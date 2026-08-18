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
export const SPIRIT_GROUPS = options.values(options.SPIRIT_GROUPS);
export const MENU_SECTIONS = options.values(options.MENU_SECTIONS);
export const EVENT_TAGS = options.values(options.EVENT_TAGS);

/**
 * Datum mit Uhrzeit, ohne Zeitzone: genau das, was Keystatic schreibt.
 * `2026-08-21T21:00`.
 */
const localDateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    "Erwartet YYYY-MM-DDTHH:MM ohne Zeitzone, z. B. 2026-08-21T21:00"
  );

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
 * `price` ist der Anzeigetext ("CHF 14.–", "Auf Anfrage", "Ab CHF 13.–") und
 * darf fehlen — die drei Karten oben in den Cocktails stehen absichtlich ohne
 * Betrag, weil der "ab"-Preis über dem Abschnitt gilt. Der wird aus
 * `priceCHF` gerechnet (`minPriceCHF()`), nicht getippt.
 * `priceCHF` ist derselbe Betrag als Zahl und nur gesetzt, wenn der Preis
 * fix ist — Structured Data darf keinen Betrag behaupten, den es nicht gibt.
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
      ...priceFields,
      /** Zutaten oder Hinweis. Nur Karten mit Bild zeigen ihn an. */
      description: optionalText,
      image: image().optional(),
      imageAlt: optionalText,
      /** Kleinere Zahl steht weiter oben. */
      order: z.number().default(0),
    }),
});

const spirits = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/spirits" }),
  schema: z.object({
    name: z.string(),
    group: z.enum(SPIRIT_GROUPS),
    /** Preis pro 4 cl. */
    glass: z.string(),
    glassCHF: z.number().optional(),
    /** Preis für die ganze Flasche. */
    bottle: z.string(),
    bottleCHF: z.number().optional(),
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
     * Startpreis gibt — daraus wird das „Flaschen ab CHF 105.–“ gerechnet,
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
  spirits,
  bottleService,
  menuSections,
  hours,
  settings,
};
