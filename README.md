# Seedvault

**A tiny garden, a new puzzle every day.**

A Reddit Devvit web app built for the [Reddit Game of the Day Hackathon 2026](https://redditgameofday2026.devpost.com). Every day at midnight UTC, a fresh 5×5 garden bed and a hand of 8 seed packets grow for everyone — the same puzzle for every player, everywhere.

## How it plays

Plant your 8 seeds on the bed. Every plant scores by its own rule:

| Plant | Rule |
| --- | --- |
| 🌻 Sunflower | +3 on a sunny tile, +1 per Sunflower next door |
| 🌹 Rose | +2 per flower next door (Rose or Tulip) |
| 🍄 Mushroom | +4 in shade, +1 on soil, +0 in sun |
| 🌵 Cactus | +2 per empty soil cell next door |
| 🌿 Fern | +1 per plant next door, any kind |
| 🌷 Tulip | +3 if another Tulip shares its row or column |
| 🫐 Berry Bush | +2 per Berry Bush next door |
| 🌱 Mint | +1 per different species next door |

Groups of 3+ of one species connected together **bloom for +5**. Rocks and ponds can't be planted. Rearrange freely until you press **Grow** — then your score lands on the day's leaderboard, your streak ticks up, and you can share your garden as an emoji grid or discuss it in the post's comments.

## Tech

- **Client:** React 19 + Tailwind CSS 4 + Vite 8, two entrypoints — `splash.html` (inline feed preview) and `game.html` (expanded game).
- **Server:** Hono on `@devvit/web/server`, Redis for leaderboards, streaks, and play records. The server regenerates the day's puzzle from the date and re-scores every submission from scratch, so scores can't be inflated from the client.
- **Shared:** `src/shared/game.ts` holds the puzzle generator (seeded PRNG — deterministic per date), scoring, validation, and the emoji share grid. It's used by both sides, so the live preview and the server always agree.

## Develop

```bash
npm install
npm run dev        # devvit playtest — uploads a playtest build
npm run test:unit  # node:test unit tests for the game logic
npm run type-check # tsc --build across client/server/shared
npm run lint       # eslint
npm run build      # vite build
npm run deploy     # type-check + lint + devvit upload
```

Requires Node 24+. The app is installed in a subreddit, where it posts today's garden automatically on install; moderators can create the daily post from the subreddit menu ("Create today's garden post").

## Layout

```
src/
  client/            # React app (runs in the Reddit webview)
    splash.tsx       # inline feed preview
    game.tsx         # expanded game
    hooks/useGame.ts # game state machine
    components/      # PlantArt (SVG), GardenGrid, SeedHand, ResultCard
  server/            # Hono app (Devvit serverless)
    routes/api.ts    # /api/init, /api/submit, /api/leaderboard
    routes/menu.ts   # moderator menu action
    routes/triggers.ts # on-app-install: seed the first post
    core/            # post creation + Redis state
  shared/            # game logic + API types (client and server)
    game.ts
    game.test.ts
```

## License

MIT — see [LICENSE](LICENSE).
