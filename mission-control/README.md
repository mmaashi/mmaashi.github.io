# Mission Control 🎯

Your personal productivity hub. A custom Next.js dashboard built specifically for your workflow.

## What's This?

Mission Control is a centralized place to:
- View your tasks (Things 3 integration)
- Check your schedule
- Run quick actions
- Track projects
- Custom productivity tools (we'll build these together)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd mission-control
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will auto-reload as you edit files.

### Production Build

```bash
npm run build
npm run start
```

## Structure

```
mission-control/
├── app/                 # Next.js App Router
│   ├── page.tsx        # Home/Dashboard
│   ├── layout.tsx      # Root layout
│   └── globals.css     # Global styles
├── components/          # Reusable React components (add here)
├── lib/                 # Utilities & helpers
└── public/             # Static assets
```

## Adding Features

1. Create components in `components/`
2. Add API routes in `app/api/`
3. Import and use in pages

## Next Up

- [ ] Things 3 task integration
- [ ] Calendar view
- [ ] Quick action buttons
- [ ] OpenClaw command shortcuts
- [ ] Dark mode toggle (already defaulting to dark)
- [ ] Settings panel

---

Built with **Next.js 15** + **Tailwind CSS** + **TypeScript**
