/**
 * Zugriff auf die Collections.
 *
 * Sortierung und Gruppierung stehen hier statt in den Seiten, damit
 * `/events`, `/getraenkekarte`, `HoursTable.astro` und das Structured Data
 * dieselbe Reihenfolge sehen.
 */
import { getCollection, getEntry } from "astro:content";
import type {
  DRINK_CATEGORIES,
  DRINK_GROUPS,
  MENU_SECTIONS,
} from "../content.config.ts";
import { DRINK_GROUPS as DRINK_GROUP_OPTIONS } from "../content/options.ts";
import { parseLocal } from "./dates.ts";
import type { DayHours } from "./hours.ts";

/** Eine der in `content.config.ts` deklarierten Kategorien. */
export type DrinkCategory = (typeof DRINK_CATEGORIES)[number];
/** Einer der Zwischentitel innerhalb eines Abschnitts. */
export type DrinkGroup = (typeof DRINK_GROUPS)[number];
/** Einer der Abschnitte der Getränkekarte. */
export type MenuSection = (typeof MENU_SECTIONS)[number];

/** Termine, älteste zuerst. */
export async function getEvents() {
  const events = await getCollection("events");
  return events.sort((a, b) => a.data.start.localeCompare(b.data.start));
}

/**
 * Nur Termine, die noch kommen. Vergangene Abende blendet Google sonst als
 * abgelaufene Einträge an — und auf der Seite will sie auch niemand sehen.
 *
 * `now` ist übergebbar, damit der Aufrufer den Build-Zeitpunkt festlegen kann.
 */
export async function getUpcomingEvents(now = new Date()) {
  const events = await getEvents();
  /* `parseLocal`, weil in der Datei keine Zeitzone steht — `new Date()`
     würde sie als Zeit des Build-Rechners lesen (auf Cloudflare UTC). */
  return events.filter((event) => parseLocal(event.data.end) >= now);
}

/** Getränke eines Abschnitts, nach `order` und dann Namen. */
export async function getDrinksByCategory(category: DrinkCategory) {
  const drinks = await getCollection("drinks", (d) => d.data.category === category);
  return drinks.sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name)
  );
}

/**
 * Ein Abschnitt der Karte, in Zwischentitel unterteilt.
 *
 * Die Gruppe ohne Titel kommt zuerst (auf der gedruckten Karte stehen die
 * Positionen dort direkt unter der Überschrift), danach die Zwischentitel in
 * der Reihenfolge von `DRINK_GROUPS`. Leere Gruppen fallen weg, deshalb
 * reicht eine Liste für alle Abschnitte.
 */
export async function getDrinkGroups(category: DrinkCategory) {
  const drinks = await getDrinksByCategory(category);
  return DRINK_GROUP_OPTIONS.map((group) => ({
    /** `undefined` für die Gruppe ohne Zwischentitel. */
    label: group.value === "keine" ? undefined : group.label,
    entries: drinks.filter((drink) => drink.data.group === group.value),
  })).filter((group) => group.entries.length > 0);
}

/**
 * Günstigster fixer Preis einer Kategorie — oder mehrerer, wenn ein Teaser
 * einen Abschnitt zusammenfasst („Whisky, Vodka & Liköre ab CHF 8.–“).
 * `undefined`, wenn keine der Positionen einen festen Betrag hat.
 *
 * Der „ab“-Preis stand früher als Text in Hero, Meta-Description und
 * Abschnitts-Einleitung — und war falsch: „Cocktails ab CHF 12.–“, während
 * der günstigste Cocktail CHF 14 kostete. Gerechnet statt getippt kann das
 * nicht wieder passieren.
 */
export async function minPriceCHF(category: DrinkCategory | DrinkCategory[]) {
  const categories = Array.isArray(category) ? category : [category];
  const drinks = (
    await Promise.all(categories.map((one) => getDrinksByCategory(one)))
  ).flat();
  const prices = drinks
    .map((drink) => drink.data.priceCHF)
    .filter((price): price is number => typeof price === "number");
  return prices.length ? Math.min(...prices) : undefined;
}

/** Stufen des Flaschenservice, nach `order` und dann Namen. */
export async function getBottleService() {
  const tiers = await getCollection("bottleService");
  return tiers.sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name)
  );
}

/** Günstigster Startpreis im Flaschenservice, oder `undefined`. */
export async function bottleFromCHF() {
  const tiers = await getBottleService();
  const prices = tiers
    .map((tier) => tier.data.fromCHF)
    .filter((price): price is number => typeof price === "number");
  return prices.length ? Math.min(...prices) : undefined;
}

/**
 * Überschrift und Einleitung eines Abschnitts. Gesucht wird über das Feld
 * `section`, nicht über den Dateinamen — den bildet Keystatic aus der
 * Überschrift, eine Umbenennung würde den Text sonst still verlieren.
 */
export async function getMenuSection(section: MenuSection) {
  const entries = await getCollection("menuSections", (e) => e.data.section === section);
  return (
    entries[0]?.data ?? {
      section,
      title: section,
      intro: undefined,
      note: undefined,
      order: 0,
    }
  );
}

/**
 * Öffnungszeiten von Montag bis Sonntag.
 *
 * `getCollection` gibt die Einträge alphabetisch nach `id` zurück (Dienstag,
 * Donnerstag, Freitag …), deshalb wird hier explizit sortiert. `weekday`
 * folgt `Date.getDay()` mit Sonntag = 0 — die Verschiebung um sechs Tage
 * rückt den Sonntag ans Ende, wo er in einer Woche hingehört.
 */
export async function getHours(): Promise<DayHours[]> {
  const hours = await getCollection("hours");
  return hours
    .map((entry) => entry.data)
    .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7));
}

/**
 * Die Kacheln der Galerie, nach `order` und dann Beschriftung.
 *
 * `eager` gehoert nicht ins Schema, sondern hierher: die ersten vier Kacheln
 * stehen ueber der Falz und laden sofort, der Rest lazy. Als Feld in
 * Keystatic waere es ein Haken, den irgendwann jede Kachel traegt — und dann
 * laedt die Seite elf grosse Fotos auf einmal.
 */
const EAGER_TILES = 4;

export async function getGallery() {
  const tiles = await getCollection("gallery");
  return tiles
    .sort(
      (a, b) =>
        a.data.order - b.data.order || a.data.caption.localeCompare(b.data.caption)
    )
    .map((tile, index) => ({ ...tile.data, eager: index < EAGER_TILES }));
}

/**
 * Die Happy Hour. Stand vorher als Text auf vier Seiten.
 *
 * `day` und `time` kommen roh zurueck, weil die vier Stellen sie
 * unterschiedlich einbauen (Label, Satz, FAQ-Antwort). `sentence` ist die
 * Fassung, die zweimal identisch gebraucht wird.
 */
export async function getHappyHour() {
  const entry = await getEntry("happyHour", "happyHour");
  if (!entry) return undefined;
  const { day, time, note } = entry.data;
  return {
    day,
    time,
    note,
    /** "Donnerstag, 20 – 22 Uhr" — Label-Fassung. */
    label: `${day}, ${time}`,
    /** Ein ganzer Satz, fuer FAQ und Structured Data. */
    sentence: [`${day}, ${time}.`, note].filter(Boolean).join(" "),
  };
}

/** Preisstand der Karte als ISO-Datum, oder `undefined`. */
export async function getPriceDate() {
  const settings = await getEntry("settings", "menu");
  return settings?.data.priceDate;
}
