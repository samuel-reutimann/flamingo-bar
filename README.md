# Flamingo Bar

Website of the Flamingo Bar, Marktgasse 34B, Langenthal — opening hours, drink
menu, events, gallery, bottle service and contact. German (`de-CH`) throughout.

Built on [Lumos for Astro](https://github.com/lumosframework/lumos-for-astro)
and reskinned to a dark neon-pink brand. Deployed as a Cloudflare Worker; the
bar edits content through [Keystatic](https://keystatic.com) at `/keystatic`.

`AGENTS.md` (symlinked as `CLAUDE.md`) is the detailed working document — brand
tokens, component deviations from stock Lumos, page structure and the content
model. Read it before changing anything.

## Getting started

```sh
npm install
npm run dev
```

Node 22.12 or newer is required.

| Script            | What it does                      |
| ----------------- | --------------------------------- |
| `npm run dev`     | Starts the dev server             |
| `npm run build`   | Builds the site to `dist/`        |
| `npm run preview` | Serves the built site             |
| `npm run check`   | Type-checks every `.astro` file   |
| `npm run format`  | Formats the project with Prettier |

Only run one dev server at a time — Stacki and Ship Studio each spawn their own
against this directory, and two on the same port throw a `CompilerError`.

## Deploying

Pushing to `main` type-checks, builds and deploys via
`.github/workflows/deploy.yml`. Manually:

```sh
npx astro build
npx wrangler deploy --config dist/server/wrangler.json
```

The Cloudflare adapter merges the root `wrangler.jsonc` into that generated
config — don't add `main` to the root file by hand.

## How it is put together

### The cascade

Styles are split across four cascade layers, declared in
[`global.css`](src/styles/global.css) in this order:

| Layer        | File                                      | Holds                                               |
| ------------ | ----------------------------------------- | --------------------------------------------------- |
| `base`       | [base.css](src/styles/base.css)           | Design tokens, color themes, the reset, text styles |
| `patterns`   | [patterns.css](src/styles/patterns.css)   | Multi-property patterns shared across components    |
| `components` | Each component's and page's `<style>`     | The component or page itself                        |
| `utilities`  | [utilities.css](src/styles/utilities.css) | Single-property classes                             |

A later layer beats an earlier one whatever the selectors say. **Every
`<style is:global>` block — in a component *and* in a page — must wrap its rules
in `@layer components`.** Unlayered CSS outranks every layer, so a page that
forgets it silently beats the whole design system.

### Content

Events, the drink menu, the bottle-service tiers and the opening hours live in
content collections under `src/content/`, declared in
[`src/content.config.ts`](src/content.config.ts). Prices, dates and opening
times must never be written into `.astro` markup — three tools read these same
files: Keystatic, Stacki, and the build (via `src/utils/content.ts`).

### Site configuration

Business master data (phone, WhatsApp, e-mail, address, profiles) lives in
[`src/consts.ts`](src/consts.ts) alongside the site name, canonical origin and
locale. Pages and structured data read from there so the NAP details can't drift.

## License

The Lumos framework portions are [MIT](LICENSE) © Timothy Ricks. Site content,
copy and photography are © Flamingo Bar and are not covered by that license.
