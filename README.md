# Search Dashboard

An unofficial, third-party admin UI for [MeiliSearch](https://www.meilisearch.com/) instances. Connect to any MeiliSearch server and browse indexes and documents, manage settings, monitor tasks, and administer API keys — all through a Nuxt UI interface.

> **Disclaimer:** This project is not affiliated with, endorsed by, or maintained by MeiliSearch. It is an independent tool that uses the MeiliSearch REST API.

## Quick demo

Try the dashboard without installing anything: **[https://search-admin.bansal.io](https://search-admin.bansal.io)**

You will be asked for your MeiliSearch instance URL and master key. The demo does not ship with a pre-configured server — bring your own instance to explore the UI.

> **For testing only.** Use a disposable MeiliSearch instance. Do **not** connect a production server or real customer data to the public demo.

## Features

- **Overview** — Instance health, version, database size, and index summary
- **Indexes** — Create and delete indexes, search and filter documents, add/edit/delete documents, configure index settings
- **Tasks** — List, filter, cancel, and delete indexing tasks on your instance
- **API keys** — Create, edit, reveal, and revoke keys

## Demo video

Walkthrough of the dashboard — overview, indexes, documents, settings, tasks, and API keys.


https://github.com/user-attachments/assets/a70e7d83-8779-4ea9-bcad-a9fbdb286670


## Tech stack

- [Nuxt 4](https://nuxt.com/) (SPA)
- [Nuxt UI v4](https://ui.nuxt.com/)
- [Vue 3](https://vuejs.org/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [VueUse](https://vueuse.org/)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 11+ (recommended)
- A running MeiliSearch instance (self-hosted or otherwise accessible via HTTP)

## Getting started

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Copy the example environment file and configure how the dashboard connects to your instance:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). If credentials are not fully configured via environment variables, you will be redirected to the connect page.

## Environment variables

| Variable                 | Required    | Description                                                                           |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------- |
| `NUXT_SEARCH_ENDPOINT`   | No\*        | URL of your MeiliSearch instance (e.g. `http://localhost:7700`)                       |
| `NUXT_SEARCH_MASTER_KEY` | No\*        | Master key for that instance                                                          |
| `NUXT_SESSION_SECRET`    | Recommended | Application secret used to encrypt persisted session cookies. Set this in production. |

\* If either URL or master key is omitted from the environment, you can supply the missing values through the connect page at runtime.

> **Important:** If you set `NUXT_SEARCH_ENDPOINT` and `NUXT_SEARCH_MASTER_KEY` in `.env`, do not expose this application to the public internet. Anyone who can reach the dashboard can act on your MeiliSearch instance with full master-key access. Run it on a private network — for example, a private cloud, VPC, or behind [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) — and limit access to trusted users only.

## Connecting to your instance

The dashboard supports three ways to supply credentials for a MeiliSearch server:

### 1. Environment variables (server-side)

Set both `NUXT_SEARCH_ENDPOINT` and `NUXT_SEARCH_MASTER_KEY` in `.env`. No connect step is required; all API requests are proxied through the Nuxt server using these credentials. See the important note above about keeping the app off the public internet when using this mode.

### 2. Remembered session (encrypted cookie)

On the connect page, enter your instance URL and/or master key and check **Remember connection in a secure cookie**. Credentials are verified against the server, then stored in an HTTP-only cookie encrypted with AES-256-GCM. Set `NUXT_SESSION_SECRET` in production.

### 3. Tab-only session (in-memory)

Connect without checking **Remember**. Credentials are kept in browser memory for the current tab. Non-persisted requests send `X-Auth-Url` and `X-Auth-Master-Key` headers to the server proxy.

You can mix environment and runtime credentials — for example, set the URL in `.env` and enter only the master key on the connect page.

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start the development server         |
| `pnpm build`     | Build for production                 |
| `pnpm preview`   | Preview the production build locally |
| `pnpm typecheck` | Run TypeScript type checking         |

## Project structure

```
app/
  components/search/   # Search-specific UI components
  composables/         # Session, API client, and task helpers
  layouts/             # Dashboard and auth layouts
  middleware/          # Auth guard for connect flow
  pages/               # Overview, indexes, tasks, keys, connect
  types/               # Types for the MeiliSearch API
  utils/               # Document display, filters, settings forms
server/
  api/auth/            # Connect, logout, status endpoints
  api/search/          # Proxy to your instance's REST API
  utils/               # Credential resolution, session cookies
```

All API calls go through `/api/search/*`, which forwards requests to your connected instance with the resolved credentials. The master key never leaves the server when using environment variables or a persisted cookie session.

## Security notes

- Never commit `.env` or expose your master key in client-side code.
- Use `NUXT_SESSION_SECRET` with a strong random value in production.
- Persisted cookies are `httpOnly`, `sameSite: lax`, and `secure` in production.
- The dashboard requires your instance's **master key** — restrict network access accordingly.

## License

[MIT](LICENSE)
