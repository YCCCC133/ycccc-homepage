# YCCCC Homepage

Engineering-grade personal site for YCCCC built with Next.js, React 19, and Tencent Cloud COS.

## Features

- Interactive cinematic homepage with pointer-reactive background
- Server-side profile data loading
- Safe server-only credential usage through environment variables

## Environment

Copy `env.example` to `.env.local` and fill in your Tencent Cloud values:

- `TENCENT_SECRET_ID`
- `TENCENT_SECRET_KEY`
- `TENCENT_COS_REGION`
- `TENCENT_COS_BUCKET`
- `TENCENT_COS_APP_ID`

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## COS Data Model

- `site/profile.json` (profile + engineering-grade content)
`profile.json` keys:
- `brand` (identity, positioning, valueProposition, keywords)
- `coreCapabilities` (title, description)
- `projects` (title, role, summary, stack, scope, metrics, links)
- `techSystem` (title, pillars, toolchain)
- `blog` (focus, posts)
- `orgPractice` (organizations, socialProjects)
- `contact` (email, socials, collaboration)

Only `site/profile.json` is used.
