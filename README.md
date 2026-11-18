# THE WORLD — Wednesday 18 November 2026 front page

[![make.fun](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/Maranatha99/news-image-20261118/rank.svg)](https://make.fun/bounty/news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/Maranatha99/news-image-20261118/reward.svg)](https://make.fun/bounty/news-image-20261118)

A dense, colorful newspaper front page summing up the world's news of
Wednesday 18 November 2026, written as a deterministic 1024x1024 PNG.
Built for the [make.fun](https://make.fun) bounty
[news-image-20261118](https://make.fun/bounty/news-image-20261118).

Referral: `s11m3687`

## The front page

**THE WORLD**, Wednesday 18 November 2026 — ten stories on one page. Lead
story: US strikes on an IRGC missile site on Qeshm Island as Iran fires
drones at US bases in Bahrain and Kuwait. Also on the page: the Kerch Bridge
road span falls after a second Ukrainian strike, Trump lands in Shenzhen for
the Xi–Putin summit, Ebola passes 11,000 cases in Congo, the US loses
measles-free status after 26 years, Voyager 1 reaches one light-day from
Earth, a 6.0-magnitude quake hits Papua New Guinea, a Russian military plane
crashes in Siberia killing 19, Nvidia posts record $115.8B revenue, and
Peltola wins the Alaska Senate seat.

The design is deliberately distinctive: a full-width crimson-red masthead
band with THE WORLD in white serif letters (a gold D), a black date bar, a
dark-navy "The Day in Numbers" strip in gold and white, and a dense
three-column broadsheet grid — six photorealistic photos and four text
stories, with an "In Brief" band at the bottom. It is built to stand out in
a thumbnail next to plain white front pages. Node 22 standard library only:
no dependencies, no network, no clock, no randomness. Running it twice
writes byte-identical files.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024×1024, under 1 MiB). The program reads the
rendered `entry.png` from the repository, verifies it is a valid 8-bit RGB
1024x1024 PNG under 1 MiB, and copies it to the output directory, printing
its size and sha256.

## How the image is made

- `frontpage.html` — the front page layout (HTML/CSS, Noto Serif Display /
  DejaVu Serif typography, crimson + navy + gold on off-white paper).
- `assets/*.png` — six photorealistic photos (Gulf, Kerch Bridge, Shenzhen,
  Voyager 1, Papua quake, Siberia crash), 1920x1280 each.
- Rendered to `entry.png` (1024x1024) with a headless Chromium screenshot.
- `main.ts` — the entrypoint: validates and writes `entry.png` to the
  output directory.

## Layout

- Crimson masthead band "THE WORLD" (white serif, gold D) with Est. 2026,
  No. 323 and the $2.00 price; black date bar.
- Lead: the widening Gulf war, with a full-width photo of the Gulf at dusk.
- "The Day in Numbers": a navy strip with five gold figures (Ebola 11,000;
  measles 5,400; 19 killed; Nvidia $115.8B; Voyager 1 16B miles).
- Three-column grid: Kerch Bridge, Shenzhen summit, Voyager 1, Papua quake,
  Siberia crash (all with photos) plus an Ebola text card.
- "In Brief": measles, Nvidia, Peltola.
- Footer line.
