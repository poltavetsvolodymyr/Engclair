#!/usr/bin/env python3
"""Record the deck's terms with a neural voice.

The voices an iPhone hands the web are the compact ones — Samantha is the only
American among them, and she sounds like a machine. So the pronunciation is
recorded ahead of time instead, and the deck carries the audio.

    pip install piper-tts imageio-ffmpeg
    python3 scripts/generate-audio.py            # record what is missing
    python3 scripts/generate-audio.py --force    # re-record everything
    python3 scripts/generate-audio.py --dry-run  # show the plan only

To redo one card, delete its file from public/audio/ and run the script again.

Writes two clips per card into public/audio/ — <card id>.mp3 for the term and
<card id>-answer.mp3 for its definition and example, a beat apart — and points
the matching card at each. Both the files and the edit are source assets:
review the diff, then commit them.

The model is driven directly rather than through the piper command, because a
few cards are recorded from phonemes and the command only takes letters.

The voice model is ~120 MB and is *not* committed. It is downloaded once into
.cache/ (git-ignored) from the piper release below, which mirrors the models
otherwise hosted on Hugging Face.
"""

import argparse
import re
import subprocess
import sys
import tarfile
import urllib.request
import wave
from pathlib import Path
from typing import NamedTuple, Optional

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'src' / 'content.ts'
AUDIO_DIR = ROOT / 'public' / 'audio'
CACHE = ROOT / '.cache' / 'piper'

# An American voice at the release's highest quality tier. LibriTTS is the only
# multi-speaker model in it, which is what made the choice possible: the
# single-speaker voices mispronounced words outright — ryan-high read "candid"
# as something closer to "kentar" — and that is not fixable by settings.
# Speakers 260 and 600 were the runners-up if 0 ever needs replacing.
VOICE = 'en-us-libritts-high'
SPEAKER = 0
VOICE_URL = (
    'https://github.com/rhasspy/piper/releases/download/v0.0.2/'
    f'voice-{VOICE}.tar.gz'
)

# The model improvises twice over: the length of every phoneme it speaks, and
# the grain of the voice speaking it.
#
# The lengths are pinned. Left free, the same word recorded twice ran anywhere
# from 0.85 to 1.04 seconds, which quietly turns every comparison between two
# settings into a coin toss — you cannot tell the change from the take. Pinned,
# a term takes the same time to say every run.
#
# The grain is deliberately *not* pinned, though pinning it would make a clip
# reproducible byte for byte. On a single word the flat delivery that costs is
# barely audible, and it was judged no worse on one — but a definition is a
# sentence, and a sentence keeps its intonation in exactly that variation. With
# it gone the readings came out robotic. Reproducibility here is of timing, not
# of the waveform.
NOISE_W_SCALE = 0.0

# The deck is read slower than the model's own pace: these are recordings to
# learn a word from, not to be talked at. An override may go slower still,
# never faster.
LENGTH_SCALE = 1.2

# The answer is slower again. A term is one word and you already know what is
# coming; a definition and an example are sentences met for the first time, and
# the ear needs longer with them than with the word they explain.
ANSWER_LENGTH_SCALE = 1.4


class Override(NamedTuple):
    """How one card departs from simply having its term read out.

    Piper does not read letters: espeak turns the term into phonemes and the
    model sings those. On a few words espeak is wrong, and this is where each
    one is put right — the card still shows the term, only the synthesiser is
    handed something else.
    """

    # Letters espeak reads correctly. Spelling rather than phonetic notation,
    # so the fix cannot invent a sound of its own on the way in. Most
    # respellings change nothing at all, so check one before trusting your ear:
    #
    #   python3 -c "from piper.phonemize_espeak import EspeakPhonemizer as E; \
    #       print(''.join(E().phonemize('en-us', 'rezilient.')[0]))"
    respelling: str = ''

    # The phonemes themselves, for what no spelling can reach: espeak inserts a
    # palatal glide between a high front vowel and the vowel after it, and all
    # thirty respellings of "alleviate" that kept its four syllables kept the
    # glide with them. Written out, the word is simply the dictionary's.
    phonemes: str = ''

    # Slower than the deck's own LENGTH_SCALE, for a word whose ending arrives
    # as mush because the model is racing through it.
    length_scale: Optional[float] = None


# Keyed by card id. A respelling follows its term into the example as well —
# every example uses the word it teaches, and a card that says "rezilient" on
# one button and "resilient" on the other teaches the mistake it was fixing.
# Phonemes cannot travel that way, so a term corrected with them is corrected
# on its own clip only; the glide they fix is a blemish inside a sentence
# rather than the wrong consonant.
OVERRIDES = {
    # espeak said ɹᵻsˈɪliənt; the word takes a z, not an s.
    'vocab-resilient': Override(respelling='rezilient'),
    # espeak said ɐlˈiːvɪʲˌeɪt, which lands as "-i-yate".
    'vocab-alleviate': Override(phonemes='ɐlˈiːviˌeɪt.', length_scale=1.3),
}

# Punctuation espeak already reads as the end of a sentence.
SENTENCE_END = ('.', '!', '?')

# The answer is read as one clip with a beat between its two halves, rather
# than two clips the app has to sequence: one file, one fetch, one play, and
# the pause is heard the same offline as on.
PAUSE_SECONDS = 0.6

# What the answer's clip is called, next to the term's own file.
ANSWER_SUFFIX = '-answer'

# MP3 rather than the better-per-bit AAC: open-source Chromium builds ship no
# AAC decoder, and a clip that will not decode falls back to the very voice the
# recording exists to replace. MP3 plays everywhere — iOS included.
#
# Mono speech at 64 kbps is transparent enough for one spoken word, and about a
# tenth of what the raw WAV costs.
CODEC = 'libmp3lame'
EXTENSION = 'mp3'
BITRATE = '64k'


def voice_model() -> Path:
    """The .onnx model, downloaded and unpacked on first use."""
    model = CACHE / f'{VOICE}.onnx'
    if model.exists():
        return model

    CACHE.mkdir(parents=True, exist_ok=True)
    archive = CACHE / f'{VOICE}.tar.gz'
    print(f'Fetching the {VOICE} voice (~105 MB, once)…')
    try:
        urllib.request.urlretrieve(VOICE_URL, archive)
    except OSError as error:
        sys.exit(
            f'Could not download the voice: {error}\n'
            f'Fetch {VOICE_URL} by hand and unpack it into {CACHE}.'
        )

    with tarfile.open(archive) as tar:
        tar.extractall(CACHE)
    archive.unlink()
    return model


def load_voice():
    """The loaded model, ready to speak."""
    try:
        from piper import PiperVoice
    except ImportError:
        sys.exit('Missing piper. Run: pip install piper-tts imageio-ffmpeg')
    return PiperVoice.load(str(voice_model()))


def ffmpeg() -> str:
    """The bundled ffmpeg binary, so nothing has to be installed system-wide."""
    try:
        import imageio_ffmpeg
    except ImportError:
        sys.exit('Missing imageio-ffmpeg. Run: pip install piper-tts imageio-ffmpeg')
    return imageio_ffmpeg.get_ffmpeg_exe()


def read_cards(source: str) -> list[tuple[str, str, str, str]]:
    """Every card's id, term, definition and example, out of the authored deck.

    A regex rather than a parser: content.ts is written by hand in one shape,
    and the count check below fails loudly if that ever stops being true.
    """
    cards = re.findall(
        r"\bid: '([^']+)',[\s\S]{0,400}?\bterm: '([^']+)',"
        r"[\s\S]{0,400}?\bdefinition: '([^']+)',"
        r"[\s\S]{0,400}?\bexample: '([^']+)',",
        source,
    )
    declared = len(re.findall(r"^ {6}id: '", source, re.MULTILINE))
    if len(cards) != declared:
        sys.exit(
            f'Parsed {len(cards)} cards but the deck declares {declared}. '
            'The file shape changed — fix this script before trusting it.'
        )
    return cards


def link_card(source: str, card_id: str, field: str, after: str, file_name: str) -> str:
    """Point a card's `field` at its recording, unless it already has one.

    The clip is named after what it reads, so it lands right below it: `audio`
    under the term, `definitionAudio` under the definition.
    """
    pattern = re.compile(
        rf"(id: '{re.escape(card_id)}',[\s\S]{{0,400}}?{after}: '[^']+',\n)"
        rf"(?! *{field}:)"
    )
    return pattern.sub(rf"\g<1>      {field}: '{file_name}',\n", source, count=1)


def respell(sentence: str, term: str, respelling: str) -> str:
    """The sentence with the card's term swapped for the spelling espeak reads.

    Every example uses the word it teaches, so a respelling that stopped at the
    term would have the card saying "rezilient" on one button and "resilient"
    on the other.
    """
    if not respelling:
        return sentence
    return re.sub(rf'\b{re.escape(term)}\b', respelling, sentence, flags=re.I)


def say(voice, text: str, phonemes: str, length_scale: float) -> tuple:
    """One utterance, and the phonemes it was sung from."""
    from piper.config import SynthesisConfig

    if phonemes:
        sung = list(phonemes)
    else:
        # The full stop matters: given a bare word the model has no sentence to
        # end and clips the last syllable short. Only where one is missing,
        # though — a sentence brings its own, and doubling it leaves espeak
        # holding a stray period that it reads out as the word "dot" at the
        # start of whatever is phonemised next.
        sung = voice.phonemize(text if text.endswith(SENTENCE_END) else f'{text}.')[0]

    audio = voice.phoneme_ids_to_audio(
        voice.phonemes_to_ids(sung),
        syn_config=SynthesisConfig(
            speaker_id=SPEAKER,
            length_scale=length_scale,
            noise_w_scale=NOISE_W_SCALE,
        ),
    )
    return audio, ''.join(sung)


def record(voice, take, target: Path, convert: str, length_scale: float) -> str:
    """Speak a take into an MP3, a beat between its parts, and report the sound.

    A take is one or more (text, phonemes) pairs: the term is one, the answer
    is its definition and its example with a pause between them.
    """
    import numpy as np

    pieces, spoken = [], []
    for index, (text, phonemes) in enumerate(take):
        if index:
            pieces.append(
                np.zeros(int(PAUSE_SECONDS * voice.config.sample_rate), dtype=np.float32)
            )
        piece, sung = say(voice, text, phonemes, length_scale)
        pieces.append(piece)
        spoken.append(sung)

    audio = np.concatenate(pieces)
    # Normalise to the peak, which is what piper's own command does; without it
    # a clip lands quieter than the rest of the deck.
    audio = audio / max(float(np.abs(audio).max()), 1e-8)
    samples = (np.clip(audio, -1.0, 1.0) * 32767).astype('<i2')

    raw = target.with_suffix('.wav')
    with wave.open(str(raw), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(voice.config.sample_rate)
        out.writeframes(samples.tobytes())
    subprocess.run(
        [convert, '-y', '-loglevel', 'error', '-i', str(raw),
         '-c:a', CODEC, '-b:a', BITRATE, '-ac', '1', str(target)],
        check=True,
    )
    raw.unlink()
    return ' ⏸ '.join(spoken)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--force', action='store_true', help='re-record existing clips')
    parser.add_argument('--dry-run', action='store_true', help='show the plan only')
    args = parser.parse_args()

    source = CONTENT.read_text(encoding='utf-8')
    cards = read_cards(source)

    stale = sorted(set(OVERRIDES) - {card_id for card_id, *_ in cards})
    if stale:
        sys.exit(f'OVERRIDES names cards the deck does not have: {stale}')
    both = sorted(k for k, o in OVERRIDES.items() if o.respelling and o.phonemes)
    if both:
        sys.exit(f'An override is either letters or phonemes, not both: {both}')
    print(
        f'{len(cards)} cards, voice "{VOICE}" speaker {SPEAKER}'
        f'{" (dry run)" if args.dry_run else ""}'
    )

    if not args.dry_run:
        voice, convert = load_voice(), ffmpeg()
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    updated = source
    recorded = 0

    for card_id, term, definition, example in cards:
        override = OVERRIDES.get(card_id, Override())
        answer = [
            (respell(definition, term, override.respelling), ''),
            (respell(example, term, override.respelling), ''),
        ]

        # Two clips per card: the word, and the answer to the card — its
        # definition and its example, a beat apart.
        takes = (
            (f'{card_id}.{EXTENSION}', 'audio', 'term', term,
             [(override.respelling or term, override.phonemes)],
             override.length_scale or LENGTH_SCALE),
            (f'{card_id}{ANSWER_SUFFIX}.{EXTENSION}', 'answerAudio', 'example',
             definition, answer, ANSWER_LENGTH_SCALE),
        )

        for file_name, field, after, label, take, length_scale in takes:
            target = AUDIO_DIR / file_name
            shown = label if len(label) <= 34 else f'{label[:33]}…'

            if target.exists() and not args.force:
                print(f'  skip    {shown}')
            elif args.dry_run:
                print(f'  would record  {shown} -> {file_name}')
                recorded += 1
            else:
                spoken = record(voice, take, target, convert, length_scale)
                note = f'  [{spoken}]' if card_id in OVERRIDES else ''
                print(
                    f'  record  {shown} -> {file_name} '
                    f'({target.stat().st_size // 1024} KB){note}'
                )
                recorded += 1

            updated = link_card(updated, card_id, field, after, file_name)

    if not args.dry_run and updated != source:
        CONTENT.write_text(updated, encoding='utf-8')

    total = (
        sum(f.stat().st_size for f in AUDIO_DIR.glob(f'*.{EXTENSION}'))
        if AUDIO_DIR.exists()
        else 0
    )
    print(
        f'\n{recorded} recorded, {total // 1024} KB of audio in total.\n'
        + ('Nothing written.' if args.dry_run
           else 'Check `git diff` and public/audio/, then commit.')
    )


if __name__ == '__main__':
    main()
