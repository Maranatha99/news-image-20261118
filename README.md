# THE WORLD — Wednesday 18 November 2026 front page

[![make.fun](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/Maranatha99/news-image-20261118/rank.svg)](https://make.fun/bounty/news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/Maranatha99/news-image-20261118/reward.svg)](https://make.fun/bounty/news-image-20261118)

A realistic, colorful modern newspaper front page summing up the world's news
of Wednesday 18 November 2026, written as a deterministic 1024x1024 PNG.
Built for the [make.fun](https://make.fun) bounty
[news-image-20261118](https://make.fun/bounty/news-image-20261118).

Referral: `s11m3687`

## The front page

**THE WORLD**, Wednesday 18 November 2026. Lead story: US strikes on an IRGC
missile site on Qeshm Island as Iran fires drones at US bases in Bahrain and
Kuwait. Also on the page: the Kerch Bridge road span falls after a second
Ukrainian strike, Trump lands in Shenzhen for the Xi–Putin summit, Ebola
passes 11,000 cases in Congo, the US loses measles-free status after 26
years, and Voyager 1 reaches one light-day from Earth.

The page is a real newspaper layout, not a drawing: a big black serif
masthead, red accents, four photorealistic photos (the Gulf at dusk, the
damaged Kerch Bridge, Trump and Xi in Shenzhen, Voyager 1 in deep space),
and clean serif headlines with photo captions — built as HTML/CSS and
rendered to PNG. Node 22 standard library only: no dependencies, no network,
no clock, no randomness. Running it twice writes byte-identical files.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024×1024, under 1 MiB). The program reads the
rendered `entry.png` from the repository, verifies it is a valid 1024x1024
PNG under 1 MiB, and copies it to the output directory, printing its sha256.

## How the image is made

- `frontpage.html` — the front page layout (HTML/CSS, Noto Serif / DejaVu
  Serif typography, off-white paper, red accent color).
- `assets/*.png` — four photorealistic photos (Gulf, Kerch Bridge, Shenzhen,
  Voyager 1), 1920x1280 each.
- Rendered to `entry.png` (1024x1024) with a headless Chromium screenshot.
- `main.ts` — the entrypoint: validates and writes `entry.png` to the
  output directory.

## Layout

- Masthead "THE WORLD" with a red final letter, date bar, red "World News"
  dateline.
- Lead: the widening Gulf war, with a full-width photo of the Gulf at dusk.
- Two photo stories side by side: Kerch Bridge and the Shenzhen summit.
- Two health stories in white cards with a red edge: Ebola and measles.
- Voyager 1 strip: a navy space band with the spacecraft photo and its
  16-billion-mile milestone in white.
- Footer line.
