/**
 * Inhalte als Content Collections.
 *
 * Einzige Quelle für Events, Getränkekarte und Öffnungszeiten. Drei Werkzeuge
 * lesen und schreiben dieselben Dateien:
 *
 * - **Keystatic** (`/keystatic`) — der Kunde pflegt hier im Browser.
 * - **Stacki** — liest diese Deklaration und zeigt passende Felder.
 * - **Astro** — Seiten holen die Daten mit `getCollection()`.
 *
 * Früher standen dieselben Preise doppelt da (ausgeschriebenes Markup plus
 * eine Zweitfassung für Structured Data), weil Stackis alter Parser kein
 * `.map()` verstand. Das ist vorbei — Stacki hat eigene Loop-Knoten. Beide
 * Fassungen sind hier zusammengeführt; bitte nicht wieder aufspalten.
 */
import { defineCollection } from "astro:content";
import { z } from "zod";
import { glob, file } from "astro/loaders";
import * as options from "./content/options.ts";

/* Die Auswahllisten stehen in `src/content/options.ts`, weil
   `keystatic.config.ts` dieselben Werte braucht — nur als `{label, value}`
   für die Dropdowns. Vorher standen beide Fassungen getrennt da. */
export const DRINK_CATEGORIES = options.values(options.DRINK_CATEGORIES);
export const DRINK_GROUPS = options.values(options.DRINK_GROUPS);
export const MENU_SECTIONS = options.values(options.MENU_SECTIONS);
export const GALLERY_RATIOS = options.values(options.GALLERY_RATIOS);
export const EVENT_TAGS = options.values(options.EVENT_TAGS);

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Dieselben Ziffern, aber mit Sekunden und `Z` — so schrieb es die Cloud. */
const KEYSTATIC_UTC = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?Z$/;

const pad = (value: number) => String(value).padStart(2, "0");

/** Die Ziffern eines `Date`, so wie sie in der Datei stünden. */
const wallClock = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

/**
 * Datum mit Uhrzeit, ohne Zeitzone: genau das, was Keystatic schreibt.
 * `2026-08-21T21:00`.
 *
 * Keystatic Cloud hat dieselben Ziffern zeitweise als vollen Zeitstempel
 * abgelegt (`2026-09-05T21:00:00.000Z`, unquotiert — js-yaml macht daraus ein
 * `Date`). `localDatetime()` in `keystatic.config.ts` schreibt inzwischen eine
 * Zeichenkette; die Umwandlung hier holt ein, was vorher gespeichert wurde.
 *
 * Das `Z` ist dabei **keine Zeitzonenangabe**, sondern dieselbe Konvention,
 * die `parseLocal()` benutzt (`new Date(wert + "Z")`): die Ziffern sind die
 * Uhrzeit an der Bar. Gelesen werden deshalb die UTC-Felder, umgerechnet wird
 * nicht — eine Umrechnung verschöbe jeden Abend um ein bis zwei Stunden,
 * genau der Fehler, den das Muster verhindern soll.
 *
 * Ein echter Offset (`+02:00`) bleibt unangetastet und fällt damit durch das
 * Muster: dort ist nicht zu erraten, ob die Ziffern Ortszeit meinen.
 */
const localDateTime = z.preprocess((value) => {
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? value : wallClock(value);
  if (typeof value === "string") return KEYSTATIC_UTC.exec(value)?.[1] ?? value;
  return value;
}, z.string().regex(LOCAL_DATE_TIME, "Erwartet YYYY-MM-DDTHH:MM ohne Zeitzone, z. B. 2026-08-21T21:00"));

/**
 * Ein Textfeld, das leer sein darf. Keystatic schreibt ein nicht ausgefülltes
 * `fields.text` als `""` in die Datei, nicht als fehlenden Schlüssel — und ein
 * leerer String kommt durch jedes `.optional()` durch. Ohne diese Umwandlung
 * landet `opens: ""` in `toMinutes()` und ergibt `NaN`, und ein leerer Preis
 * rendert als leere Zelle statt übersprungen zu werden.
 */
const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value : undefined));

/**
 * `price` ist der Anzeigetext ("CHF 13.–", "Auf Anfrage") und darf fehlen.
 * `priceCHF` ist derselbe Betrag als Zahl und nur gesetzt, wenn der Preis
 * fix ist — Structured Data darf keinen Betrag behaupten, den es nicht gibt.
 * "Auf Anfrage" steht auf der gedruckten Karte als Strich: Kaffee, Tee und
 * Rum haben dort keinen aufgedruckten Preis.
 */
const priceFields = {
  /** Weglassen, wenn die Position bewusst ohne Preis dasteht. */
  price: optionalText,
  priceCHF: z.number().optional(),
};

const events = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/events" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /**
       * Lokale Zeit ohne Offset, `YYYY-MM-DDTHH:MM` — das Format, das
       * Keystatics `fields.datetime` schreibt und als einziges akzeptiert.
       * Gelesen wird es mit `parseLocal()` aus `src/utils/dates.ts`, das den
       * Wert als Zürcher Zeit auflöst statt als Zeit des Build-Rechners.
       *
       * Das Muster ist Absicht: früher stand hier ein Offset (`+02:00`), den
       * Keystatic nicht öffnen konnte, und beim Speichern kam ein Wert zurück,
       * den `new Date()` still um ein bis zwei Stunden verschob. Ein falsches
       * Format soll den Build anhalten, nicht die Uhrzeiten verrutschen.
       */
      start: localDateTime,
      end: localDateTime,
      description: z.string(),
      /** Art des Abends — erscheint als Tag in der Terminliste. */
      tag: z.enum(EVENT_TAGS),
      image: image().optional(),
      imageAlt: optionalText,
      /**
       * Hervorgehobene Termine stehen oben als große Karte. Ein Termin ohne
       * Bild kann nicht hervorgehoben werden, das prüft `events.astro`.
       */
      featured: z.boolean().default(false),
      /** Eintritt in CHF. `0` heißt "Eintritt frei". */
      priceCHF: z.number().default(0),
    }),
});

const drinks = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/drinks" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      category: z.enum(DRINK_CATEGORIES),
      /**
       * Zwischentitel innerhalb des Abschnitts — „Flaschenbier (33 cl)“,
       * „Flasche (inkl. Zusatzgetränke)“. `keine` heißt: direkt unter der
       * Abschnitts-Überschrift, vor allen Gruppen.
       */
      group: z.enum(DRINK_GROUPS).default("keine"),
      ...priceFields,
      /**
       * Der Klammerzusatz von der gedruckten Karte: Volumenprozent, Größe
       * oder Sorten („4.8%“, „5% / 25 cl“, „Lemon / Peach“). Steht klein
       * hinter dem Namen. Ohne Klammern — die setzt die Seite.
       */
      note: optionalText,
      /** Zutaten oder Hinweis. Nur Karten mit Bild zeigen ihn an. */
      description: optionalText,
      image: image().optional(),
      imageAlt: optionalText,
      /**
       * Steht auf der Startseite als grosse Karte. Braucht ein Bild — die
       * `cover`-Karte legt ihren Verlauf ueber das Foto, ohne Foto gaebe es
       * weder das eine noch das andere. `getFeaturedDrinks()` filtert
       * deshalb auf beides.
       */
      featured: z.boolean().default(false),
      /** Kleinere Zahl steht weiter oben. */
      order: z.number().default(0),
    }),
});

/**
 * Die Stufen des Flaschenservice. Standen früher ausgeschrieben auf vier
 * Seiten (Startseite, Karte, Events, Reservation) plus ein fünftes Mal im
 * Structured Data — mit Preisen, die sich zwischen den Kopien schon
 * unterschieden.
 */
const bottleService = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/bottle-service" }),
  schema: z.object({
    name: z.string(),
    /** Was in der Stufe enthalten ist. Eine Zeile. */
    description: optionalText,
    ...priceFields,
    /**
     * Untergrenze der Stufe als Zahl. Nur gesetzt, wenn es einen echten
     * Startpreis gibt — daraus wird das „Flaschen ab CHF 125.–“ gerechnet,
     * das früher an vier Stellen von Hand stand.
     */
    fromCHF: z.number().optional(),
    order: z.number().default(0),
  }),
});

/**
 * Einleitungstexte der Abschnitte, einer pro Eintrag.
 *
 * Gesucht wird über `section`, nicht über den Dateinamen. Vorher war der
 * Dateiname der Schlüssel, und weil Keystatic ihn aus der Überschrift bildet,
 * hätte eine umbenannte Überschrift den Einleitungstext still verschwinden
 * lassen — `flaschen.yaml` hieß bereits „Flaschenservice“, die beiden waren
 * also schon auseinander.
 */
const menuSections = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/menu-sections" }),
  schema: z.object({
    /** Welcher Abschnitt der Karte. Bestimmt, wo der Text erscheint. */
    section: z.enum(MENU_SECTIONS),
    title: z.string(),
    intro: optionalText,
    /**
     * Die Fußnote unter der Liste — „Zusätzliche Getränke / Mischgetränk:
     * + CHF 3.–“. Steht auf der gedruckten Karte unter dem Abschnitt.
     */
    note: optionalText,
    order: z.number().default(0),
  }),
});

/**
 * Öffnungszeiten: ein Eintrag pro Wochentag, `id` = Slug des Tages.
 * `weekday` ist der Wert von `Date.getDay()` (Sonntag = 0), damit das Skript
 * in `HoursTable.astro` den heutigen Tag markieren kann.
 */
const hours = defineCollection({
  loader: file("src/content/hours.yaml"),
  schema: z.object({
    label: z.string(),
    /** Anzeigetext, z. B. "20 – 03 Uhr". Bei `closed` ignoriert. */
    time: z.string(),
    closed: z.boolean().default(false),
    weekday: z.number().min(0).max(6),
    /** `HH:MM` für Structured Data. Bei `closed` weglassen. */
    opens: optionalText,
    closes: optionalText,
  }),
});

/**
 * Die Kacheln der Galerie.
 *
 * Standen als elf ausgeschriebene Objekte im Frontmatter von `galerie.astro`,
 * mit elf `import`-Zeilen darüber — ein neues Foto hiess Code anfassen. Jetzt
 * pflegt der Betrieb sie wie Events und Getränke.
 *
 * `eager` steht bewusst *nicht* im Schema: welche Bilder sofort laden, ist
 * eine Frage des Ladeverhaltens, nicht der Redaktion. Ein Haken dafür würde
 * irgendwann auf allen elf Kacheln sitzen und damit genau das kaputtmachen,
 * wofür er da ist. `galerie.astro` leitet ihn aus der Reihenfolge ab.
 */
const gallery = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/gallery" }),
  schema: ({ image }) =>
    z.object({
      /** Beschriftet den Button und die Grossansicht, steht nicht unter dem Bild. */
      caption: z.string(),
      image: image(),
      /** Pflicht, nicht optional: ein Foto ohne Beschreibung ist für Screenreader nichts. */
      alt: z.string(),
      /** Höhe der Kachel im Mosaik. `quadrat` schreibt keine Klasse ins Markup. */
      ratio: z.enum(GALLERY_RATIOS).default("quadrat"),
      /**
       * Läuft zusätzlich im Bilderband auf der Startseite. Das Band zeigt
       * Stimmung, nicht den ganzen Bestand — deshalb eine Auswahl und nicht
       * einfach die ersten paar Kacheln.
       */
      homepage: z.boolean().default(false),
      /** Kleinere Zahl steht weiter oben. */
      order: z.number().default(0),
    }),
});

/**
 * Die Happy Hour. Ein Eintrag, `id` = `happyHour`.
 *
 * Stand vorher als Text an vier Stellen — Startseite, Events und zweimal auf
 * `/oeffnungszeiten`, davon einmal in der FAQ fuer Google. Die Zeiten waren
 * dort schon unterschiedlich formuliert ("von 20 bis 22 Uhr" gegen
 * "20 – 22 Uhr"); eine Aenderung an der Bar haette alle vier gebraucht.
 *
 * Der Wrapper-Schluessel in der Datei ist Absicht: der `file()`-Loader macht
 * aus jedem Schluessel der obersten Ebene einen Eintrag. Ohne ihn wuerden
 * `day`, `time` und `note` drei Eintraege mit Strings statt Objekten.
 */
const happyHour = defineCollection({
  loader: file("src/content/happy-hour.yaml"),
  schema: z.object({
    /** Wochentag, ausgeschrieben — steht als Label und im Satz. */
    day: z.string(),
    /** Anzeigetext der Zeitspanne, z. B. "20 – 22 Uhr". */
    time: z.string(),
    /** Der Satz darunter, z. B. "Ausgewaehlte Drinks verguenstigt." */
    note: optionalText,
  }),
});

/** Einzelwerte, die zu keiner Liste gehören. `id` = Bereich. */
const settings = defineCollection({
  loader: file("src/content/settings.yaml"),
  schema: z.object({
    /** Stand der Preise, ISO. Erscheint formatiert unter der Karte. */
    priceDate: optionalText,
  }),
});

export const collections = {
  events,
  drinks,
  bottleService,
  menuSections,
  gallery,
  hours,
  happyHour,
  settings,
};
