# ETHGlobal Banner Generator

Create personalized attendance banners for ETHGlobal events and share them on X.

Inspired by the [Blockspäti Banner Generator](https://blockspati.joinwebzero.com/).

## Events

- **ETHGlobal Lisbon 2026** — July 24–26, 2026
- **ETHGlobal Tokyo 2026** — September 25–27, 2026
- **ETHOnline 2026** — September 4–16, 2026
- **ETHGlobal Mumbai 2026** — November 6–8, 2026

## Features

- Event dropdown with dates, location, and sponsors on the banner
- Upload your photo
- Live canvas preview
- Download PNG banner
- Share on X (downloads image + opens tweet compose)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/armsves/ethglobalx)

Or from the CLI:

```bash
npm i -g vercel
vercel
```

Vercel auto-detects Next.js. No extra configuration required.

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- HTML Canvas API for banner rendering
