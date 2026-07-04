# RabbitHole

Go down the research rabbit hole — and keep the map.

RabbitHole turns a 2am Wikipedia spiral into a structure you can navigate. You
start with a question, then **pull threads** to dig deeper. Each pull fetches
real findings from the web and nests them under the thing you pulled from, so the
board grows into a branching tree you built by choosing which threads to yank —
and you can always trace your way back.

Live at **[rabbithole.app.space](https://rabbithole.app.space)**.

## Two views of one tree

There is a single underlying structure — the investigation tree of nested
findings — rendered two ways, toggled by a view switch:

- **Outline** (default) — a nestable, collapsible threaded outline. The root is
  your question; every finding is a node with a source lens and a "pull this
  thread" action. Indentation and connector lines show the branch structure.
- **Columns** — a Miller-column / Finder-style drill-down. Selecting a node opens
  a new column to its right showing its children; you march rightward as you go
  deeper, and the columns behind you form the trail.

Both read and write the same tree — they're different renderings, not separate
features.

## The lenses

Every finding is tagged with the source lens it came from, color-coded and shown
as a small chip. You choose which lens to pull a thread with:

- **Exa** — the deep neural / citation trail (default, primary engine)
- **Wikipedia** — the established, reference account
- **News** — what's being reported right now
- **Web** — the broad sweep

## Following the trail

- A **breadcrumb** strip showing the path from the root to where you are.
- A **trail** panel of where you've been.
- **Backlinks** — when a new finding shares a source with an existing node, the
  connection is surfaced ("N findings mention this") instead of silently
  duplicating.

Every node carries its real, clickable sources. The trail is always backed by
links.

## The telling dial

A slider controls how each finding is narrated, from **Straight** (plain and
factual) to **Deep end** (more speculative, connect-the-dots framing). It only
changes narration style — the underlying sources are always real and cited.

## How it's built

A [DeepSpace](https://deep.space) app on Cloudflare Workers.

- **Data** — two collections (`holes`, `nodes`). The tree is a flat node list
  linked by `parentId`; findings are written server-side (server actions) so
  they're durable and immediately consistent for every client.
- **Digging** — a `pullThread` server action queries the chosen lens
  (`exa` / `wikipedia` / `newsapi` / `websearch`) with context from the parent
  node, synthesizes each result into a short narrated finding (respecting the
  tone dial), and keeps the real source URL attached. Backlinks are computed by
  shared source URL.
- **Sharing** — a hole is private until its owner shares it; then anyone with the
  link can follow the trail, read-only. The model leaves room for forks, a public
  gallery, and real-time multiplayer without reshaping the tree — none of which
  are built yet.

### Develop

```sh
npx deepspace dev       # local dev (vite + worker)
npx deepspace test      # smoke + api specs
npx deepspace deploy    # deploy to rabbithole.app.space
```
