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

Writes public/audio/<card id>.mp3 and adds `audio:` to the matching card in
src/content.ts. Both are source assets: review the diff, then commit them.

The voice model is ~120 MB and is *not* committed. It is downloaded once into
.cache/ (git-ignored) from the piper release below, which mirrors the models
otherwise hosted on Hugging Face.
"""

import argparse
import re
import shutil
import subprocess
import sys
import tarfile
import urllib.request
from pathlib import Path

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

# Piper does not read letters; espeak turns the term into phonemes first, and
# on a few words espeak is simply wrong. Where it is, the clip is recorded from
# a respelling — the card still shows the term, only the synthesiser is handed
# something it reads correctly. Spelling, not phonetic notation: the whole point
# is that no extra sound gets invented on the way in.
#
#   resilient   ɹᵻsˈɪliənt -> ɹᵻzˈɪliənt   the word takes a z, and espeak said s
#
# Check a candidate before trusting your ear, because most respellings change
# nothing at all:
#
#   python3 -c "from piper.phonemize_espeak import EspeakPhonemizer as E; \
#       print(''.join(E().phonemize('en-us', 'rezilient.')[0]))"
#
# What a respelling cannot fix is a sound espeak inserts by rule. It puts a
# palatal glide between a high front vowel and the vowel after it — "alleviate"
# comes out ɐlˈiːvɪʲˌeɪt — and every respelling that keeps the four syllables
# keeps the glide with them. That one needs the phonemes edited directly, which
# is a bigger machine than the deck has yet earned.
RESPELLINGS = {
    'vocab-resilient': 'rezilient',
}

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


def ffmpeg() -> str:
    """The bundled ffmpeg binary, so nothing has to be installed system-wide."""
    try:
        import imageio_ffmpeg
    except ImportError:
        sys.exit('Missing imageio-ffmpeg. Run: pip install piper-tts imageio-ffmpeg')
    return imageio_ffmpeg.get_ffmpeg_exe()


def read_cards(source: str) -> list[tuple[str, str]]:
    """Every card's id and term, straight out of the authored deck.

    A regex rather than a parser: content.ts is written by hand in one shape,
    and the count check below fails loudly if that ever stops being true.
    """
    cards = re.findall(r"\bid: '([^']+)',[\s\S]{0,400}?\bterm: '([^']+)',", source)
    declared = len(re.findall(r"^ {6}id: '", source, re.MULTILINE))
    if len(cards) != declared:
        sys.exit(
            f'Parsed {len(cards)} cards but the deck declares {declared}. '
            'The file shape changed — fix this script before trusting it.'
        )
    return cards


def link_card(source: str, card_id: str, file_name: str) -> str:
    """Point a card at its recording, unless it already has one."""
    pattern = re.compile(
        rf"(id: '{re.escape(card_id)}',[\s\S]{{0,400}}?term: '[^']+',\n)(?! *audio:)"
    )
    return pattern.sub(rf"\g<1>      audio: '{file_name}',\n", source, count=1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--force', action='store_true', help='re-record existing clips')
    parser.add_argument('--dry-run', action='store_true', help='show the plan only')
    args = parser.parse_args()

    source = CONTENT.read_text(encoding='utf-8')
    cards = read_cards(source)

    stale = sorted(set(RESPELLINGS) - {card_id for card_id, _ in cards})
    if stale:
        sys.exit(f'RESPELLINGS names cards the deck does not have: {stale}')
    print(
        f'{len(cards)} cards, voice "{VOICE}" speaker {SPEAKER}'
        f'{" (dry run)" if args.dry_run else ""}'
    )

    if not args.dry_run:
        model, convert = voice_model(), ffmpeg()
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    updated = source
    recorded = 0

    for card_id, term in cards:
        file_name = f'{card_id}.{EXTENSION}'
        target = AUDIO_DIR / file_name

        if target.exists() and not args.force:
            print(f'  skip    {term}')
        elif args.dry_run:
            print(f'  would record  {term} -> {file_name}')
            recorded += 1
        else:
            raw = AUDIO_DIR / f'{card_id}.wav'
            spoken = RESPELLINGS.get(card_id, term)
            subprocess.run(
                [sys.executable, '-m', 'piper', '--model', str(model),
                 '--speaker', str(SPEAKER), '--output_file', str(raw)],
                # The full stop matters: given a bare word the model has no
                # sentence to end and clips the last syllable short.
                input=f'{spoken}.', text=True, check=True, capture_output=True,
            )
            subprocess.run(
                [convert, '-y', '-loglevel', 'error', '-i', str(raw),
                 '-c:a', CODEC, '-b:a', BITRATE, '-ac', '1', str(target)],
                check=True,
            )
            raw.unlink()
            said = f' (said "{spoken}")' if spoken != term else ''
            print(
                f'  record  {term}{said} -> {file_name} '
                f'({target.stat().st_size // 1024} KB)'
            )
            recorded += 1

        updated = link_card(updated, card_id, file_name)

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
