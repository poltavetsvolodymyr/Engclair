#!/usr/bin/env python3
"""Render the Engclair app icons from the same geometry as public/favicon.svg.

Run after changing the mark:

    python3 scripts/generate-icons.py

Deliberately dependency-free — the mark is a rounded square plus an "E" built
from four axis-aligned bars, so it needs no SVG rasteriser. Coverage of the
bars is computed analytically and only the rounded corners are supersampled,
which keeps the edges clean without pulling an image library into the build.
"""

import struct
import zlib
from pathlib import Path

# The mark, in the 64-unit space of public/favicon.svg. Keep the two in sync.
CANVAS = 64
CORNER_RADIUS = 14
BG = (0x3F, 0x62, 0x12)  # --color-accent for the forest theme, as favicon.svg
FG = (0xFA, 0xF6, 0xEF)  # --color-bg, the cream the app is painted on

# "M22 15.5h20v7H29v6h11v7H29v6h13v7H22z" — a stem and three arms.
# Arms are 7 deep with 6 between them, so the E stands 33 tall and starts at
# 15.5 to sit dead centre of the 64-unit canvas.
BARS = (
    (22, 15.5, 29, 48.5),  # stem
    (29, 15.5, 42, 22.5),  # top arm
    (29, 28.5, 40, 35.5),  # middle arm
    (29, 41.5, 42, 48.5),  # bottom arm
)

SUBSAMPLES = 4  # per axis, inside the corner squares only

PUBLIC = Path(__file__).resolve().parent.parent / 'public'


def overlap(lo_a, hi_a, lo_b, hi_b):
    """Length shared by two 1-D spans."""
    return max(0.0, min(hi_a, hi_b) - max(lo_a, lo_b))


def bar_coverage(x, y, bars):
    """How much of pixel (x, y) the bars cover. They never overlap."""
    total = 0.0
    for x0, y0, x1, y1 in bars:
        total += overlap(x, x + 1, x0, x1) * overlap(y, y + 1, y0, y1)
    return min(1.0, total)


def rounded_coverage(x, y, size, radius):
    """How much of pixel (x, y) a rounded square of `size` covers."""
    if radius <= 0:
        return 1.0

    # Corner squares are the only place the shape is not the full pixel.
    cx = x if x < radius else (size - 1 - x if x >= size - radius else None)
    cy = y if y < radius else (size - 1 - y if y >= size - radius else None)
    if cx is None or cy is None:
        return 1.0

    # Centre of the corner arc, in the pixel's own quadrant.
    ox = radius if x < radius else size - radius
    oy = radius if y < radius else size - radius

    step = 1.0 / SUBSAMPLES
    inside = 0
    for sy in range(SUBSAMPLES):
        py = y + (sy + 0.5) * step
        for sx in range(SUBSAMPLES):
            px = x + (sx + 0.5) * step
            dx = px - ox
            dy = py - oy
            # Only the outward quadrant of the corner is cut away.
            if (dx < 0) == (x < radius) and (dy < 0) == (y < radius):
                if dx * dx + dy * dy > radius * radius:
                    continue
            inside += 1
    return inside / (SUBSAMPLES * SUBSAMPLES)


def render(size, corner_radius, content_scale):
    """Composite the mark over its background into RGBA rows."""
    unit = size / CANVAS
    radius = corner_radius * unit

    # Scale the 64-unit bars about the centre, then into pixels.
    def place(v):
        return ((v - CANVAS / 2) * content_scale + CANVAS / 2) * unit

    bars = [(place(x0), place(y0), place(x1), place(y1)) for x0, y0, x1, y1 in BARS]

    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            back = rounded_coverage(x, y, size, radius)
            fore = bar_coverage(x, y, bars)
            alpha = fore + back * (1 - fore)
            if alpha <= 0:
                row += b'\0\0\0\0'
                continue
            for channel in range(3):
                mixed = FG[channel] * fore + BG[channel] * back * (1 - fore)
                row.append(round(mixed / alpha))
            row.append(round(alpha * 255))
        rows.append(bytes(row))
    return rows


def write_png(path, size, rows):
    raw = b''.join(b'\0' + row for row in rows)

    def chunk(tag, payload):
        body = tag + payload
        return struct.pack('>I', len(payload)) + body + struct.pack('>I', zlib.crc32(body))

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    path.write_bytes(png)
    print(f'{path.name}: {size}x{size}, {len(png)} bytes')


ICONS = (
    # name,                    size, corner radius, content scale
    ('icon-192.png', 192, CORNER_RADIUS, 1.0),
    ('icon-512.png', 512, CORNER_RADIUS, 1.0),
    # Maskable icons get cropped to whatever shape the launcher likes, so the
    # background runs full bleed and the mark shrinks into the safe zone.
    ('icon-maskable-512.png', 512, 0, 0.6),
    # iOS applies its own rounding and ignores transparency, so: full bleed.
    ('apple-touch-icon.png', 180, 0, 1.0),
)


def main():
    for name, size, corner_radius, content_scale in ICONS:
        write_png(PUBLIC / name, size, render(size, corner_radius, content_scale))


if __name__ == '__main__':
    main()
