## What this is

The Flamingo Bar website — Marktgasse 34B, Langenthal. A bar/cocktail site
(hours, drink menu teaser, events, gallery, bottle service, visit/contact).
Built on the **Lumos** Astro starter framework, reskinned to a dark
neon-pink/black brand instead of Lumos's default lime-green look.

German (`de-CH`) content throughout. Events, the drink menu and the opening
hours come from content collections and are edited in Keystatic (`/keystatic`)
or Stacki; the remaining page copy is hardcoded in `.astro` files.

The design source of truth is the static HTML/CSS mockup at
`../Website UI mockups project/` (sibling directory, `index.html` +
`css/flamingo.css`). When in doubt about how something should look, check
that file, not this one — it was built first and this project was made to
match it pixel-for-pixel.

## Development

Start the dev server in background mode:

```
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status`, `astro dev logs`.

**Heads up:** this project is also opened by Stacki (a separate Electron
visual-editor app, `~/Documents/Dev/stacki`) which spawns its own `astro dev`
child process against this same directory to render its live preview. Its
dev-server tracking is shared with the CLI above — running `astro dev
--background` here may just report "already running" and hand you Stacki's
instance rather than starting a fresh one. That's fine; it's the same
project, just don't be surprised by it. Don't run two dev servers against
this project at once — Stacki and a manually-started one on the same port
will both throw a `CompilerError` overlay. Stop one before starting the
other.

Stacki also writes a temporary marker config to
`node_modules/.avb/astro.config.mjs` (a wrapped copy of the real
`astro.config.mjs` with `devToolbar: false`, `compressHTML: false`, and a
custom Vite plugin injected) — that's normal, ignore it, don't edit it, it
regenerates each time Stacki opens the project.

### Loops are fine now

Earlier versions of this project banned `array.map()` in `.astro` files:
Stacki's old marker parser choked on looped JSX. That is no longer true —
Stacki has native **Loop** nodes, generates `.map()` itself, and outlines
every iteration on the canvas.

The ban had a real cost, so don't reintroduce it: every price, event and
opening time used to exist **twice** — once as hand-unrolled markup and once
as a second copy for structured data — and the two drifted apart. Both
copies are now merged into content collections (see below).

`Nav.astro` and `Footer.astro` still list their links literally. That is
just leftover shape, not a rule.

### Verifying changes visually

There's no `chromium-cli` in this environment. To compare against the
mockup, install Playwright + Chromium into a scratch dir, serve the mockup
statically (`python3 -m http.server` from `../Website UI mockups project/`),
and screenshot both at a matched viewport (1280×900 was used during the
last pass). Don't trust `curl` for anything CSS/JS-related — dev-mode Vite
injects styles via JS, invisible to a raw HTML fetch; use a real browser
(Playwright) or check computed styles with `page.evaluate`.

## Brand tokens (`src/styles/base.css`)

Lumos ships its own generic design tokens (lime-green `--brand-500`, a
single sans body font, generic Nav/Footer). All of the following were
retuned to match the mockup — **treat these as the project's actual brand,
not Lumos defaults**:

- **Colors**: `--dark-900`/`--dark-800` = near-black stage
  (`#040405`/`#0d0d10`), `--light-100` = warm white (`#f4efe9`),
  `--brand-500` = neon pink (`#ff2e88`), `--brand-500-soft` = soft pink
  (`#ff86bb`).
- **Fonts**: `--primary-family` = Manrope (body), `--display-family` =
  Instrument Serif (all headings h1–h6 + `.text-style-display`),
  `--mono-family` = Space Mono (labels, prices, the `.link` button variant,
  hours-row day labels). Loaded via Google Fonts `<link>` tags in
  `BaseHead.astro` — don't switch this to a CSS `@import`, it was
  deliberately done as preconnect + stylesheet links for performance.
- **Type scale**: h1 42–84px, h2 34–62px, body text 14px (fixed, not
  fluid), small text 12.5px (fixed), body line-height 1.7. These match the
  mockup's literal rem values, not Lumos's original fluid-clamp defaults —
  don't "fix" them back to a smoother fluid curve without checking the
  mockup first.
- **`--max-width-main`**: hardcoded to `76rem` (matches the mockup's
  `container-large`). Decoupled from `--viewport-max` (1440) on purpose —
  don't derive it from the viewport tokens again, that was the original
  Lumos default and it rendered every section ~200px too wide.
- **Button theme tokens** (in the `.theme-dark` block): primary button is
  **white by default, pink on hover** (this is inverted from Lumos's
  default, which is pink-by-default). If a button ever looks pink at rest,
  someone reverted this — check `--button-background` /
  `--button-background-hover` in `.theme-dark`.
- **Radius**: buttons are a full pill (`--radius-round`, changed in
  `Button.astro`), cards use `--radius-main` = `1.25rem`.
- Effect tokens added wholesale for the glass nav pill / glows / scrims:
  `--shadow-nav`, `--shadow-accent-glow`, `--blur-glass`,
  `--gradient-glass`, `--gradient-card-scrim`, `--glow-accent-radial`.

## Component changes vs. stock Lumos

These Lumos framework components were modified project-wide (not just for
one page) — if something looks different from a fresh Lumos install, it's
probably one of these, and it's intentional:

- **`Nav.astro`** — fully rewritten. Stock Lumos has a sticky in-flow bar;
  this is a `position: fixed` floating glass pill with a hamburger-driven
  slide-down menu, matching the mockup's `navbar_component`.
- **`Footer.astro`** — fully rewritten to match the mockup's brand block +
  link list + giant `Flamingo` wordmark + bottom legal bar, instead of
  Lumos's plain link-list footer.
- **`Button.astro`** — pill radius, pink glow on hover for the primary
  variant, and the `.link` variant was completely replaced: stock Lumos's
  `.link` is an animated sliding-underline text link; this project's
  `.link` is a mono/uppercase/letter-spaced pink label with no
  underline/border at all (used for "Tisch für heute anfragen", "Auf Karte
  öffnen", the Instagram handle). Don't reintroduce the underline animation.

## Page structure (`src/pages/index.astro`)

Sections, top to bottom: hero → Öffnungszeiten (hours) → Karte (cocktail
teaser) → Events → Atmosphäre (gallery marquee) → Flaschenservice (bottle
service) → Anfahrt/Kontakt (visit) → final CTA.

A few structural things worth knowing before editing:

- **`.section-header` wrapper**: every section's heading + subhead + CTA
  button is wrapped in a `<div class="section-header">`. This is
  deliberate — Lumos's `<Section>` puts a large `gap` between *all* of its
  direct children (heading, paragraph, button, grid), which stacks on top
  of each component's own margin and produces way too much whitespace
  between a heading and its subhead. Grouping them into one plain-flow div
  sidesteps that; only *between* logical blocks (header → grid, grid →
  note) should you rely on the Section's own `gap`. If you add a new
  section, follow the same pattern — don't drop a bare `<Heading>` +
  `<Paragraph>` directly as siblings in a `<Section>`, wrap them.
- **`align="center"` ambient alignment**: `<Section align="center">` sets
  `text-align`/`--_alignment: center` on *everything* inside it, including
  things that need to stay left-aligned (the hours list) or full-width (the
  visit map image, which otherwise shrinks to fit-content because
  `align-items: center` stops it from stretching). Where that happened,
  there's an explicit override class (`.hours_content { --_alignment:
  start }`, `.visit_map { width: 100% }`) — if you add new left-aligned or
  full-width content inside a centered section, you'll need the same kind
  of override.
- **`.events_grid .card_wrap.cover` / `.card_content` override**: Lumos's
  `Card` `cover` variant is a fixed 20rem-tall box with content pinned to
  the *top*. The mockup's event cards are a tall 3:4 poster with the
  date/title anchored to the *bottom* over a gradient scrim. This is
  overridden with `aspect-ratio: 3/4` + `justify-content: flex-end`, scoped
  to `.events_grid` only — don't "fix" this at the `Card.astro` level, other
  cover-card usages (if any get added later) may want the default look.
- **Today-highlight on the hours list**: each `<li class="hours_row">` has
  a `data-day` attribute (`0`=Sunday…`6`=Saturday, matching
  `Date.prototype.getDay()`). A small inline `<script>` right after the
  list adds `.is-today` to the matching row on page load, which reveals the
  pink "Heute" badge and tints that row. If you reorder days or add a
  new row, keep the `data-day` values correct.

## Pages and shared page components

All routes are built out: `index`, `getraenkekarte`, `events`, `galerie`,
`reservation`, `kontakt`, `oeffnungszeiten`, `impressum`, `datenschutz`,
`404`. The structure follows `../../04-Resources/Seitenaufbau Flamingo
Bar.md`, with one deviation: that document argues for folding reservation
into the contact page. Here they are split on request — `reservation.astro`
owns the form, `kontakt.astro` owns the direct channels, address and hours,
and each links to the other. Don't duplicate the form onto Kontakt.

Three project components carry the patterns the subpages share:

- **`PageHeader.astro`** — the `.section-header` block (eyebrow, heading,
  subhead, optional buttons via the default slot) as a component, so every
  page gets the same measure and heading/subhead rhythm. Use `headingTag`
  for the outline level and `variant` for the size; pass markup through the
  `heading` slot when a plain string isn't enough. `.section-header` and
  `.section-note` themselves now live in `patterns.css` — don't redeclare
  them per page.
- **`HoursTable.astro`** — the week's opening hours as one list, used by
  Öffnungszeiten, Kontakt and Reservation. Rows carry `data-day`
  (`0`=Sunday…`6`=Saturday) and an **`is:inline`** script marks today.
  It has to be `is:inline`: a normally bundled component script is dropped
  by Astro when the component is rendered inside a `<Section>` slot, so the
  hoisted version silently never shipped on any of the three pages. The
  times come from the `hours` collection — see below.
- **`LegalText.astro`** — long-form legal copy (Impressum, Datenschutz).
  Wraps `RichText` and supplies the paragraph/list spacing, because this
  project's `RichText` ships no `.rich-text` descendant styles and the
  global reset zeroes every margin.

`reservation.astro` has no backend: the form validates in the browser,
builds a WhatsApp message from the fields and opens the chat. `<noscript>`
falls back to phone and WhatsApp links. When a real form endpoint exists,
set it as the form's `action` and drop the `window.open` call.

`getraenkekarte.astro` carries the sticky category chips. Which chip is
current is *calculated* in a scroll handler, not observed with an
IntersectionObserver — the measurement is six `getBoundingClientRect` calls
per event and stays in step during fast scrolling.

Placeholders that still need real data from the bar: the phone number
(`062 000 00 00`) and e-mail across all pages, the Instagram URL, the
spirits prices on the drink menu, the event dates, and everything in square
brackets on the Impressum plus the hosting line on Datenschutz.

## Images

Real photos live in `src/assets/flamingo/` (copied from the mockup's
`assets/images/`), imported and rendered through Lumos's `<Img>` component
so Astro optimizes them to WebP at build time. Don't reference them via a
plain `<img src="/...">` or drop new photos into `public/` — import from
`src/assets` so they go through the image pipeline.

## SEO / metadata

`src/consts.ts` holds `SITE_NAME` ("Flamingo Bar"), `SITE_URL`
(`https://www.flamingobar-langenthal.ch`), and `SITE_DESCRIPTION` — these
feed `BaseHead.astro`'s title/meta tags and `astro.config.mjs`'s sitemap.
`index.astro` also carries a `BarOrPub` JSON-LD block (address, phone,
opening hours, price range) injected via `slot="head"` — keep this in sync
if the address/hours/phone ever change for real.

## Content collections (`src/content.config.ts`)

Events, the drink menu and the opening hours live in
`src/content/`, not in page markup:

| Collection      | Files                        | Was ist drin |
| --------------- | ---------------------------- | ------------ |
| `events`        | `src/content/events/*.yaml`   | ein Abend pro Datei |
| `drinks`        | `src/content/drinks/*.yaml`   | ein Getränk pro Datei, `category` bestimmt den Abschnitt |
| `spirits`       | `src/content/spirits/*.yaml`  | Sorte mit 4-cl- und Flaschenpreis |
| `menuSections`  | `src/content/menu-sections/*.yaml` | Überschrift + Einleitung je Abschnitt |
| `hours`         | `src/content/hours.yaml`      | ein Block pro Wochentag |
| `settings`      | `src/content/settings.yaml`   | Preisstand der Karte |

Three tools read and write the same files:

- **Keystatic** at `/keystatic` — this is what the bar owner uses.
  Configured in `keystatic.config.ts`, labels in German.
- **Stacki** — reads `src/content.config.ts` and renders matching fields.
- **The build** — pages call the helpers in `src/utils/content.ts`.

Two rules:

- A field added to `keystatic.config.ts` must be added to
  `src/content.config.ts` too, or the build fails with a Zod error.
- `price` is the display string (`"CHF 14.–"`, `"Auf Anfrage"`) and may be
  absent; `priceCHF` is the same amount as a number and is set **only** when
  the price is fixed. Structured data uses `priceCHF`, so it never claims a
  price the bar doesn't actually charge.

Prices, event dates and opening times must not be written into `.astro`
markup again. `getraenkekarte.astro` derives its JSON-LD from the same
entries it renders, `events.astro` computes "Ab 21 Uhr, Eintritt frei." from
the start time and the entry price, and `HoursTable.astro` loops the hours
collection.

`src/utils/hours.ts` runs in the **browser** (hero pill, hours strip,
footer), where `getCollection()` does not exist. `BaseLayout.astro` therefore
serializes the hours into a `<script type="application/json" id="hours-data">`
tag on every page and `hours.ts` reads that. Its exported function
signatures are unchanged; don't inline the times back into it.

## Keystatic

Admin UI at `/keystatic`. It needs server-side code, which is why the
project now has `@astrojs/cloudflare` and deploys as a Worker instead of a
flat asset bundle. Content pages stay prerendered.

Storage is `local` — it writes straight to the files on this machine. For
the client to edit in a browser, create a project at keystatic.cloud and
switch `keystatic.config.ts` to:

```ts
storage: { kind: "cloud" },
cloud: { project: "team-slug/projekt-slug" },
```

Deploy with:

```
npx astro build
npx wrangler deploy --config dist/server/wrangler.json
```

The adapter merges the root `wrangler.jsonc` into that generated config —
don't add `main` to the root file by hand.

## Documentation

Full Astro docs: https://docs.astro.build

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
