# THE WORLD — Wednesday 18 November 2026 front page

[![make.fun](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/Maranatha99/news-image-20261118/rank.svg)](https://make.fun/bounty/news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/Maranatha99/news-image-20261118/reward.svg)](https://make.fun/bounty/news-image-20261118)

A program that draws a newspaper front page summing up the world's news of
Wednesday 18 November 2026 and writes it as a deterministic 1024x1024 PNG.
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

The program draws everything itself — masthead, headlines, subheads and all
illustrations — with a hand-written 5×7 bitmap font and a hand-written PNG
encoder. Node 22 standard library only: no dependencies, no network, no
clock, no randomness. Running it twice writes byte-identical files.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024×1024, under 1 MiB).

## Layout

- Masthead with a globe and a red "18" date badge, black date bar.
- Lead: the widening Gulf war, with a Gulf scene (sea, tanker, jets, bursts).
- Four more stories in a 2×2 grid, each with its own drawn illustration:
  Kerch Bridge, the Shenzhen summit, Ebola, measles.
- Voyager 1 strip: a navy space band with Earth, the spacecraft and its
  16-billion-mile trajectory.
- Footer line.
