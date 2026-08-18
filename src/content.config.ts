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
import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

/** Kategorien der Getränkekarte. Reihenfolge = Reihenfolge auf der Seite. */
export const DRINK_CATEGORIES = [
  "cocktails",
  "longdrinks",
  "alkoholfrei",
  "weitere",
] as const;

/** Gruppen im Spirituosen-Block. */
export const SPIRIT_GROUPS = ["whisky", "vodka", "rum", "gin"] as const;

/**
 * `price` ist der Anzeigetext ("CHF 14.–", "Auf Anfrage", "Ab CHF 13.–").
 * `priceCHF` ist derselbe Betrag als Zahl und nur gesetzt, wenn der Preis
 * fix ist — Structured Data darf keinen Betrag behaupten, den es nicht gibt.
 */
const priceFields = {
  price: z.string(),
  priceCHF: z.number().optional(),
};

const events = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/events" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /** Beginn mit Zeitzonen-Offset: Sommerzeit `+02:00`, Winter `+01:00`. */
      start: z.string(),
      end: z.string(),
      description: z.string(),
      /** Art des Abends — erscheint als Tag in der Terminliste. */
      tag: z.enum(["DJ-Abend", "Live-Musik", "Motto-Party", "Sport", "Special"]),
      image: image().optional(),
      imageAlt: z.string().optional(),
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
      description: z.string().optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
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
 * Einleitungstexte der Kategorien. Ein Eintrag pro Abschnitt, `id` = Slug aus
 * `DRINK_CATEGORIES` oder `spirituosen` / `flaschen`.
 */
const menuSections = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/menu-sections" }),
  schema: z.object({
    title: z.string(),
    intro: z.string().optional(),
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
    opens: z.string().optional(),
    closes: z.string().optional(),
  }),
});

/** Einzelwerte, die zu keiner Liste gehören. `id` = Bereich. */
const settings = defineCollection({
  loader: file("src/content/settings.yaml"),
  schema: z.object({
    /** Stand der Preise, ISO. Erscheint formatiert unter der Karte. */
    priceDate: z.string().optional(),
  }),
});

export const collections = {
  events,
  drinks,
  spirits,
  menuSections,
  hours,
  settings,
};
