You are writing a Devvit web application that will be executed on Reddit.com.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Vite
- **Backend**: Node.js serverless environment (Devvit), Hono
- **Communication**: JSON over fetch to Hono routes under `/api`

## Layout & Architecture

- `/src/server`: **Backend Code**. Runs in a secure, serverless environment.
  - `index.ts`: Main server entry point (Hono app, mounts `/api` + `/internal`).
  - `routes/api.ts`: Game API (`/init`, `/submit`, `/leaderboard`).
  - `routes/menu.ts`, `routes/triggers.ts`: Menu actions and install trigger.
  - `core/`: Post creation (`post.ts`) and Redis state (`state.ts`).
  - Access `redis`, `reddit`, and `context` here via `@devvit/web/server`.
- `/src/client`: **Frontend Code**. Executed inside an iFrame on reddit.com.
  - Entrypoints (registered in `devvit.json`):
    - `splash.html`: Inline feed preview. Keep it fast; heavy work lives in `game.html`.
    - `game.html`: The main React entry point (Expanded View).
- `/src/shared`: **Shared Code** — game logic (`game.ts`) and API types (`api.ts`), used by client and server. No DOM or Node APIs here.

## Frontend

### Rules

- Instead of `window.location` or `window.assign`, use `navigateTo` from `@devvit/web/client`.
- Use `showToast` from `@devvit/web/client` instead of `window.alert`.
- Sharing uses the clipboard API with `showToast` to confirm.

### Limitations

- Geolocation, camera, microphone, and notifications web APIs: no alternatives.
- Inline script tags inside HTML files: use a script tag pointing at a separate js/ts file.

## Commands

- `npm run type-check`: Check TypeScript types
- `npm run lint`: Check the linter
- `npm run test:unit`: Run the game-logic unit tests (`node --test`)
- `npm run build`: Build the client + server bundles
- `npm run dev`: `devvit playtest`

## Code Style

- Prefer type aliases over interfaces when writing TypeScript.
- Prefer named exports over default exports.
- Never cast TypeScript types — narrow with checks and type predicates instead.

## Global Rules

- Do NOT use blocks or `@devvit/public-api`: this project is Devvit web only.
- Whenever you add an endpoint for a new menu item action, add the corresponding mapping to `devvit.json` so it is properly registered.
- The server regenerates the day's puzzle from the date and re-scores every submission from scratch — never trust a score sent by the client.

Docs: https://developers.reddit.com/docs/llms.txt.
