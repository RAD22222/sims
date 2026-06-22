# Startup Tycoon

A browser-based isometric business sim: run a tech company from a $100,000 garage startup to an IPO. Build a portfolio of products (SaaS, mobile, desktop, OS) with a real org chart behind them. The 3D office is your home base — every hire and upgrade is physically visible there.

## Tech Stack

- **React 18 + Vite**
- **@react-three/fiber + @react-three/drei** for the 3D office
- **Zustand** (with persist middleware for localStorage save/load)
- **Tailwind CSS** for 2D UI
- **framer-motion** for transitions
- **recharts** for charts
- No backend — fully client-side, single save slot

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build to dist/
```

## Core Loop

One tick = one in-game day. Speed control: Paused / 1x (1.5s) / 2x (0.75s) / 3x (0.3s).

Each tick:
1. Resolve random/market events
2. Advance kanban cards (work-points from assigned staff)
3. Resolve support tickets
4. Compute user growth/churn per product
5. Compute employee morale
6. Compute daily revenue + expenses
7. Apply net profit/loss to shared cash pool
8. Check funding milestones
9. Check win/lose conditions

## Structure

```
src/
  sim/         # pure logic, no React
    resolveDay.ts staff.ts economy.ts events.ts funding.ts kanban.ts
  store/       # Zustand store
  scene/       # R3F 3D office
  ui/          # HUD, Tabs, Modals, Notifications, Onboarding
  data/        # catalogs (SaaS, Mobile, Desktop, OS), events, names
  types.ts
```

## Win/Lose

- **Lose — Bankruptcy:** shared cash < 0
- **Lose — Investor Takeover:** investor confidence hits 0 post-funding
- **Win — IPO:** combined portfolio valuation crosses $50M threshold, sustained for 30 days
