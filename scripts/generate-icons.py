#!/usr/bin/env python3
"""Render the app icons from public/favicon.svg.

    pip install cairosvg
    python3 scripts/generate-icons.py

The SVG is the only source of the mark; everything in public/*.png is derived
from it and committed as a source asset. Three shapes come out of one drawing:

  * the plain icons keep the SVG's rounded plate, transparent outside it;
  * the maskable one drops the plate for a full-bleed background and shrinks
    the drawing into the safe circle, because launchers crop it to whatever
    shape they like;
  * the Apple touch icon is full bleed and square — iOS rounds it itself and
    ignores transparency.
"""

import re
import sys
from pathlib import Path

try:
    import cairosvg
except ImportError:  # pragma: no cover - a plain missing-dependency message
    sys.exit('Missing cairosvg. Run: pip install cairosvg')

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'public' / 'favicon.svg'
PUBLIC = ROOT / 'public'

CANVAS = 512
# The colour behind a full-bleed icon: the darker end of the plate's gradient,
# so the flat variants sit in the same family as the gradient one.
BACKDROP = '#3f6212'
# A maskable icon may be cropped to a circle of 80% of the canvas. Two thirds
# leaves the drawing clear of the crop on every launcher.
SAFE_SCALE = 2 / 3


def parts() -> tuple[str, str]:
    """The <defs> block and the drawing, pulled out of the source SVG."""
    # Comments go first: the file's own header names both markers, and a
    # search that sees them matches inside the prose instead of the drawing.
    svg = re.sub(r'<!--.*?-->', '', SOURCE.read_text(encoding='utf-8'), flags=re.DOTALL)

    defs = re.search(r'<defs>.*?</defs>', svg, re.DOTALL)
    mark = re.search(r'<g id="mark">.*</g>', svg, re.DOTALL)
    if not defs or not mark:
        sys.exit(
            f'{SOURCE.name} no longer has both <defs> and <g id="mark">. '
            'Restore them, or teach this script the new shape.'
        )
    return defs.group(0), mark.group(0)


def compose(defs: str, mark: str, *, full_bleed: bool, scale: float) -> str:
    """One icon variant, as an SVG document."""
    offset = CANVAS * (1 - scale) / 2
    plate = (
        f'<rect width="{CANVAS}" height="{CANVAS}" fill="{BACKDROP}"/>'
        if full_bleed
        else f'<rect width="{CANVAS}" height="{CANVAS}" rx="112" fill="url(#bg)"/>'
    )
    drawing = (
        mark
        if scale == 1
        else f'<g transform="translate({offset} {offset}) scale({scale})">{mark}</g>'
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS} {CANVAS}">'
        f'{defs}{plate}{drawing}</svg>'
    )


ICONS = (
    # name,                    size, full bleed, scale
    ('icon-192.png', 192, False, 1.0),
    ('icon-512.png', 512, False, 1.0),
    ('icon-maskable-512.png', 512, True, SAFE_SCALE),
    ('apple-touch-icon.png', 180, True, 1.0),
)


def main() -> None:
    defs, mark = parts()

    for name, size, full_bleed, scale in ICONS:
        svg = compose(defs, mark, full_bleed=full_bleed, scale=scale)
        target = PUBLIC / name
        cairosvg.svg2png(
            bytestring=svg.encode('utf-8'),
            write_to=str(target),
            output_width=size,
            output_height=size,
        )
        print(f'{name}: {size}x{size}, {target.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
