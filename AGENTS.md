## What this is

The Flamingo Bar website — Marktgasse 34B, Langenthal. A bar site (hours,
drink menu, events, gallery, bottle service, visit/contact).
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

**For refactors, screenshots are the wrong tool** — photographic regions
re-rasterise slightly between runs, so a pixel diff shows a few percent of
noise on any page with a large image and you can't tell that from a real
regression. What worked instead: walk the DOM of every route at 1280 and
390, record each element's path, box, text and ~40 computed properties, and
diff the two JSON dumps by path. That is fully deterministic — two runs of
the same build produce zero differences — so any output at all is a real
change, and it names the property. Serve `dist/client` with a **threaded**
server (`ThreadingHTTPServer`); the single-threaded `python3 -m
http.server` drops concurrent image requests and fakes up diffs. Freeze
`Date` in an init script, or the today-highlight moves under you.

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
  hours-row day labels). **Self-hosted** via `@fontsource` imports in
  `BaseLayout.astro`, only the latin subsets and the weights in use. Don't
  move this back to Google Fonts — no third-party connection is what
  `/datenschutz` now states, so the two would disagree.
- **Type scale**: h1 42–84px, h2 34–62px, body text 16px (fixed, not
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
  `--border-glass`, `--shadow-nav`, `--shadow-accent-glow`,
  `--shadow-dot-glow`, `--blur-glass`, `--gradient-glass`,
  `--gradient-card-scrim`, `--glow-accent-radial`. Their lengths are in
  `rem`, not `px`, so they scale with the reader's font size like the rest
  of the system.
- **Pure swatches** `--light-000` / `--dark-850` / `--dark-1000` exist only
  to be mixed at low alpha (glass edge, drop shadow, scrim). The tinted
  swatches above them have a visible cast at those alphas. Don't paint with
  them at full strength.
- **`--text-faded` (48 %) and `--text-subtle` (55 %)** are the two tiers of
  played-down text — labels, captions, closed-day times, the footer's legal
  bar. They resolve against `currentcolor`, so they work in every theme.
  This stood written out as `color-mix(in lab, currentcolor 48%, …)` in
  sixteen places; don't type the mix again.

## The cascade

`global.css` declares `@layer base, patterns, components, utilities`. **Every
`<style is:global>` block — in a component *and* in a page — must wrap its
rules in `@layer components`.** Unlayered CSS outranks every layer no matter
the specificity, so a page that forgets it silently beats the whole design
system, including the `utilities` layer that is supposed to win. All seven
pages were unlayered until this was fixed; if a page rule starts behaving
strangely, check for a missing `@layer` first. That includes the `<style>`
inside `Nav.astro`'s `<noscript>`: it is in the layer too, and still wins
because the block sits in the body while the bundled styles sit in the head.

Colours come from the tokens via `color-mix`, never as literal `rgba()`.
There used to be a second near-black (`rgba(10, 7, 8, …)`) blended straight
into `var(--dark-900)` in the same gradient.

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

Sections, top to bottom: hero → Öffnungszeiten (hours) → Karte (price
teaser) → Events → Atmosphäre (gallery marquee) → Flaschenservice (bottle
service) → Anfahrt/Kontakt (visit) → final CTA.

A few structural things worth knowing before editing:

- **`.section-header` wrapper**: every section's heading + subhead + CTA
  button sits inside one `<div class="section-header">` — in practice, use
  `<PageHeader>`, which emits exactly that. This is deliberate: Lumos's
  `<Section>` puts a large `gap` between *all* of its direct children
  (heading, paragraph, button, grid), which stacks on top of each
  component's own margin and produces way too much whitespace between a
  heading and its subhead. Grouping them into one plain-flow div sidesteps
  that; only *between* logical blocks (header → grid, grid → note) should
  you rely on the Section's own `gap`. If you add a new section, use
  `PageHeader` — don't drop a bare `<Heading>` + `<Paragraph>` in as
  siblings, and don't hand-write the wrapper div either: doing that on
  `index.astro` meant `PageHeader`'s styles never shipped there, so the
  homepage's spacing quietly differed from every other page.
- **`align="center"` ambient alignment**: `<Section align="center">` sets
  `text-align`/`--_alignment: center` on *everything* inside it, including
  things that need to stay left-aligned (the hours list) or full-width (the
  visit map image, which otherwise shrinks to fit-content because
  `align-items: center` stops it from stretching). Where that happened,
  there's an explicit override class (`.hours_content { --_alignment:
  start }`, `.visit_map { width: 100% }`) — if you add new left-aligned or
  full-width content inside a centered section, you'll need the same kind
  of override.
- **Event cards are `Card` props, not overrides**: Lumos's `Card` `cover`
  variant is a fixed 20rem-tall box with content pinned to the *top*. The
  mockup's event cards are a tall 3:4 poster with the date/title anchored to
  the *bottom* over a gradient scrim. That is now `ratio="3 / 4"` +
  `contentAlign="end"` on the `Card` itself, and `alignment-start` (a
  utility) on the `Grid` around it. It used to be a `.events_grid
  .card_wrap.cover` rule in `patterns.css`, where its `min-height: 0` never
  applied — the `components` layer beats `patterns`, so Lumos's 20rem floor
  won every time. Don't reintroduce a descendant override; the defaults are
  unchanged, so other cover cards still get the plain look.
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

Six project components carry the patterns the subpages share:

- **`PageHeader.astro`** — the `.section-header` block (eyebrow, heading,
  subhead, optional buttons via the default slot) as a component, so every
  page gets the same measure and heading/subhead rhythm. Use `headingTag`
  for the outline level and `variant` for the size; pass markup through the
  `heading` slot when a plain string isn't enough. `.section-header` and
  `.section-note` themselves now live in `patterns.css` — don't redeclare
  them per page. Use it for the closing CTA blocks too: eleven pages
  hand-wrote the same markup, and because `index.astro` never imported
  `PageHeader`, its styles were never bundled there and the homepage's
  heading rhythm differed from every other page. `maxWidth="none"` drops the
  measure cap for one-line subheads.

  Spacing is adjustable per instance. `spacing="tight" | "default" | "loose"`
  sets all three gaps at once; `gap`, `eyebrowGap` and `headingGap` override
  them individually with any CSS length. They write the custom properties
  `--_ph-gap`, `--_ph-eyebrow-gap` and `--_ph-heading-gap`, so a page can also
  set them in CSS. Measured heading gap: tight 8px, default 14.4px, loose
  22.4px — `tight` is the rhythm the homepage had before it used PageHeader.
  The gaps live in the component, not in `patterns.css`, so there is one place
  to change them.

`patterns.css` also carries the recipes that used to be copied between
pages: `.split_layout` (image beside text; `.is-top` aligns the columns at
the top), `.def_rows`/`.def_row` (labelled rows with dividers),
`.label_mono`, and `.measure-main` (full-width block, capped at
`--max-width-main` and centred — the chip bar, the hours strip, the gallery
grid, the footer's inner column, and every two-column `ContentWrapper`
compose it). Reach for those before writing a new page-local rule — each of
them had already drifted apart between its copies.

**Image beside text is `<ContentWrapper variant="columns">`**, on
Flaschenservice (home), Kontakt, private Events and Reservation. It used to
be a `.split_layout` pattern; the wrapper does the same job, so the pattern
is gone. Three things follow from the wrapper's own rules, and each has a
utility as the escape hatch rather than an override:

- It **stacks at 64rem**, not at the ~44rem the old `auto-fit` grid used.
  Tablet widths now show one column.
- Each column is a **flex column with `align-items: start`**, so a child
  that has to span the column needs `width-full` — the forms, the aside,
  the `def_rows` blocks and the button wrappers all carry it.
- `:first-child` gets `align-self: center`. Where both columns should start
  at the top (Reservation, formerly `.split_layout.is-top`), the wrapper
  carries `align-items-start` and the first column `align-self-start`.

A column holding nothing but a visual is locked to `--_visual-ratio`, 3/2 by
default. Set another with the **`visualRatio` prop** (Kontakt's map uses
`"4 / 3"`); the corner radius that comes with the lock is `--radius-small`,
so that map also carries the `radius-main` utility. On desktop the grid
stretches that column to the row height, so the ratio only bites once the
columns stack.

A rule that belongs to *one instance* — a margin under this one grid, a
`max-width: none` on this one table — is a utility class in the markup, not
a new named class. A rule that belongs to *the kind of thing* stays in the
component or in `patterns.css`.
- **`HoursTable.astro`** — the week's opening hours as one list, used by
  Öffnungszeiten, Kontakt and Reservation. Rows carry `data-day`
  (`0`=Sunday…`6`=Saturday) and an **`is:inline`** script marks today.
  It has to be `is:inline`: a normally bundled component script is dropped
  by Astro when the component is rendered inside a `<Section>` slot, so the
  hoisted version silently never shipped on any of the three pages. The
  times come from the `hours` collection — see below.
- **`BottleOptions.astro`** — the Flaschenservice tiers, over the
  `bottleService` collection. `variant="rows"` is the price list beside the
  image on the homepage, `variant="cards"` the centred trio on Karte and
  Reservation. This block used to exist four times in markup plus once more
  as prose inside the Karte's JSON-LD, and the copies had drifted.
- **`OpenStatusPill.astro`** — „Jetzt geöffnet · Heute 20 – 04 Uhr“.
  `variant="eyebrow"` in the hero, `variant="pill"` on Öffnungszeiten. It
  renders markup only; the text is filled in by the one script in
  `BaseLayout.astro`, which drives every pill and every `[data-today-line]`
  on the page. Put new client logic for it there, not in the component — a
  bundled component script is dropped when the component sits in a
  `<Section>` slot, which is where this pill sits.
- **`LegalText.astro`** — long-form legal copy (Impressum, Datenschutz).
  Wraps `RichText` and supplies the paragraph/list spacing, because this
  project's `RichText` ships no `.rich-text` descendant styles and the
  global reset zeroes every margin.

`reservation.astro` has no backend: the form validates in the browser,
builds a WhatsApp message from the fields and opens the chat. `<noscript>`
falls back to phone and WhatsApp links. When a real form endpoint exists,
set it as the form's `action` and drop the `window.open` call.

`getraenkekarte.astro` renders its sections by looping `DRINK_CATEGORIES`,
so a new section in `src/content/options.ts` appears on the page, in the
chips and in the JSON-LD without touching the page. Inside a section the
entries are grouped by `group` — see the collections below.

It also carries the sticky category chips. Which chip is current is
*calculated* in a scroll handler, not observed with an IntersectionObserver
— one `getBoundingClientRect` call per section per event, which stays in
step during fast scrolling. The chip bar is nudged with its own
`scrollLeft`, never `scrollIntoView`: that walks every scrollport ancestor
and can scroll the page from inside a scroll handler.

Phone, e-mail and address are real. What is still open is listed once, in
the comment above `BUSINESS` in `src/consts.ts`: the legal form and the
CHE numbers for the Impressum (those lines are omitted until they exist —
don't reintroduce bracket placeholders on a page the law requires), the
never-confirmed Instagram URL, and the deliberately absent `geo` block.
Event dates are sample content the bar replaces in Keystatic. The drink
prices are **real**: they come from the bar's printed Getränkekarte
(`~/Downloads/Getraenkekarte.pdf`, Stand 20. August 2026). The printed card
has no cocktail or longdrink section, so the site has none either — don't
reintroduce cocktails as filler content, and don't call the bar a
"Cocktailbar" in copy or metadata while the card doesn't list one.

## Images

Real photos live in `src/assets/flamingo/` (copied from the mockup's
`assets/images/`), imported and rendered through Lumos's `<Img>` component
so Astro optimizes them to WebP at build time. Don't reference them via a
plain `<img src="/...">` or drop new photos into `public/` — import from
`src/assets` so they go through the image pipeline.

## SEO / metadata

`src/consts.ts` holds `SITE_NAME` ("Flamingo Bar"), `SITE_URL`
(`https://flamingobar.ch`), `SITE_DESCRIPTION`, the `BUSINESS` master data
and the derived `ADDRESS_LINE` / `ADDRESS_SHORT` / `OWNER` — these feed
`BaseHead.astro`'s title/meta tags and `astro.config.mjs`'s sitemap. Never
retype the address, phone number or Instagram handle into a page; they were
scattered across ten files and drifted.

`robots.txt.ts` is server-rendered (`prerender = false`) so it can read the
request host: only `SITE_URL`'s host gets `Allow: /`, every other host the
Worker answers to (`flamingo.resa.dev`, `*.workers.dev`) gets `Disallow: /`.
`index.astro` also carries a `BarOrPub` JSON-LD block (address, phone,
opening hours, price range) injected via `slot="head"` — keep this in sync
if the address/hours/phone ever change for real.

## Content collections (`src/content.config.ts`)

Events, the drink menu and the opening hours live in
`src/content/`, not in page markup:

| Collection      | Files                        | Was ist drin |
| --------------- | ---------------------------- | ------------ |
| `events`        | `src/content/events/*.yaml`   | ein Abend pro Datei |
| `drinks`        | `src/content/drinks/*.yaml`   | ein Getränk pro Datei; `category` bestimmt den Abschnitt, `group` den Zwischentitel |
| `bottleService` | `src/content/bottle-service/*.yaml` | eine Flaschenservice-Stufe pro Datei |
| `menuSections`  | `src/content/menu-sections/*.yaml` | Überschrift, Einleitung und Fußnote je Abschnitt, `section` bestimmt die Stelle |
| `hours`         | `src/content/hours.yaml`      | ein Block pro Wochentag |
| `settings`      | `src/content/settings.yaml`   | Preisstand der Karte |

Three tools read and write the same files:

- **Keystatic** at `/keystatic` — this is what the bar owner uses.
  Configured in `keystatic.config.ts`, labels in German.
- **Stacki** — reads `src/content.config.ts` and renders matching fields.
- **The build** — pages call the helpers in `src/utils/content.ts`.

The rules:

- A field added to `keystatic.config.ts` must be added to
  `src/content.config.ts` too, or the build fails with a Zod error.
- The **option lists live in `src/content/options.ts`** and nowhere else.
  Keystatic needs `{ label, value }` for its dropdowns, Zod needs the bare
  values for `z.enum()`; both derive from that one file. They used to be
  typed out separately in the two configs, so a new category broke one side
  or silently never appeared on the other.
- Event `start`/`end` are **local time without an offset**
  (`2026-08-21T21:00`) — the only format Keystatic's `fields.datetime`
  accepts. Read them with `parseLocal()` from `src/utils/dates.ts`, which
  resolves them in `Europe/Zurich`; plain `new Date()` would read them as
  the build machine's time, which is UTC on Cloudflare. `isoWithOffset()`
  produces the full form for structured data. The Zod field is a regex, so a
  wrong format stops the build instead of shifting every event by an hour.
- Optional text fields go through `optionalText`, which turns Keystatic's
  empty string into `undefined`. Without it `opens: ""` reaches `toMinutes()`
  and yields `NaN`.
- `menuSections` entries are found by their `section` field, not by
  filename — Keystatic derives the filename from the heading, so renaming a
  heading would otherwise drop the intro text.
- `price` is the display string (`"CHF 13.–"`, `"Auf Anfrage"`) and may be
  absent; `priceCHF` is the same amount as a number and is set **only** when
  the price is fixed. Structured data uses `priceCHF`, so it never claims a
  price the bar doesn't actually charge. The printed card prints a dash for
  coffee, tea and rum — those entries carry `"Auf Anfrage"` and no
  `priceCHF`, and the note under the card explains what that means.
- A drink's `note` is the parenthesis from the printed card — the ABV, the
  size, the flavours (`"4.8%"`, `"5% / 25 cl"`, `"Lemon / Peach"`). Stored
  **without** the brackets; the page adds them. It is not the `description`,
  which is prose for a card with an image.
- `group` is the sub-heading inside a section (`"Flaschenbier (33 cl)"`,
  `"Flasche (inkl. Zusatzgetränke)"`). One `DRINK_GROUPS` list serves every
  section — empty groups simply don't render, and a dropdown can't typo a
  group into existence. `keine` means the entry sits directly under the
  section heading, which is where every group without a title goes first.

Prices, event dates and opening times must not be written into `.astro`
markup again. `getraenkekarte.astro` derives its JSON-LD from the same
entries it renders, `events.astro` computes "Ab 21 Uhr, Eintritt frei." from
the start time and the entry price, and `HoursTable.astro` loops the hours
collection. The homepage teasers read the same collections as `/events` and
`/getraenkekarte`; they used to be hand-written cards with dates baked in.

"Ab" prices are **computed**, never typed: `minPriceCHF()` (one category or
a list of them, for a teaser that covers several) and `bottleFromCHF()` in
`src/utils/content.ts`. The site claimed "Cocktails ab CHF 12.–" in four
places while the cheapest cocktail was CHF 14. Likewise
`openDaysLabel()` and `hoursSentence()` in `utils/hours.ts` build "Do – So,
ab 20 Uhr" and the FAQ sentence from the hours collection.

`src/utils/hours.ts` runs in the **browser** (hero pill, hours strip,
footer table), where `getCollection()` does not exist. `BaseLayout.astro` therefore
serializes the hours into a `<script type="application/json" id="hours-data">`
tag on every page and `hours.ts` reads that. Its exported function
signatures are unchanged; don't inline the times back into it.

## Keystatic

Admin UI at `/keystatic`. It needs server-side code, which is why the
project now has `@astrojs/cloudflare` and deploys as a Worker instead of a
flat asset bundle. Content pages stay prerendered.

Storage is `cloud`, project `flamingo-bar/flamingo-bar` on keystatic.cloud,
backed by the GitHub repo `samuel-reutimann/flamingo-bar`. The client signs
in to Keystatic Cloud and needs no GitHub account of their own. Each save is
a commit on `main`, which triggers the Cloudflare build.

Keystatic Cloud only accepts logins from the URLs listed under **Project
URLs** in the cloud project. When the site moves to a new domain, add it
there or the login fails. "Allow local development" is on, so
`http://127.0.0.1:4321/keystatic` works too.

Deploy with:

```
npx astro build
npx wrangler deploy --config dist/server/wrangler.json
```

The adapter merges the root `wrangler.jsonc` into that generated config —
don't add `main` to the root file by hand. `.github/workflows/deploy.yml`
runs the same two steps on every push to `main`; the `--config` flag matters
there too, without it wrangler falls back to the root file, which has no
`main` and deploys nothing.

`src/pages/robots.txt.ts` is the one route that is **not** prerendered, so
that it can read the request host and keep the staging domain out of the
index. Keep `prerender = false` on it.

## Documentation

Full Astro docs: https://docs.astro.build

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
