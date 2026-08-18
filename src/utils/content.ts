/**
 * Zugriff auf die Collections.
 *
 * Sortierung und Gruppierung stehen hier statt in den Seiten, damit
 * `/events`, `/getraenkekarte`, `HoursTable.astro` und das Structured Data
 * dieselbe Reihenfolge sehen.
 */
import { getCollection, getEntry } from "astro:content";
import type { DRINK_CATEGORIES, SPIRIT_GROUPS } from "../content.config.ts";
import type { DayHours } from "./hours.ts";

/** Eine der in `content.config.ts` deklarierten Kategorien. */
export type DrinkCategory = (typeof DRINK_CATEGORIES)[number];
/** Eine der in `content.config.ts` deklarierten Spirituosen-Gruppen. */
export type SpiritGroup = (typeof SPIRIT_GROUPS)[number];

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
  return events.filter((event) => new Date(event.data.end) >= now);
}

/** Getränke eines Abschnitts, nach `order` und dann Namen. */
export async function getDrinksByCategory(category: DrinkCategory) {
  const drinks = await getCollection("drinks", (d) => d.data.category === category);
  return drinks.sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name)
  );
}

/**
 * Günstigster fixer Preis einer Kategorie, als Zahl. `undefined`, wenn kein
 * Getränk der Kategorie einen festen Betrag hat.
 *
 * Der „ab“-Preis stand früher als Text in Hero, Meta-Description und
 * Abschnitts-Einleitung — und war falsch: „Cocktails ab CHF 12.–“, während
 * der günstigste Cocktail CHF 14 kostete (CHF 12 war ein Longdrink).
 * Gerechnet statt getippt kann das nicht wieder passieren.
 */
export async function minPriceCHF(category: DrinkCategory) {
  const drinks = await getDrinksByCategory(category);
  const prices = drinks
    .map((drink) => drink.data.priceCHF)
    .filter((price): price is number => typeof price === "number");
  return prices.length ? Math.min(...prices) : undefined;
}

/** Spirituosen einer Gruppe, nach `order` und dann Namen. */
export async function getSpiritsByGroup(group: SpiritGroup) {
  const spirits = await getCollection("spirits", (s) => s.data.group === group);
  return spirits.sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name)
  );
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

/** Einleitungstext eines Abschnitts. Fehlt der Eintrag, bleibt der Text leer. */
export async function getMenuSection(id: string) {
  const section = await getEntry("menuSections", id);
  return section?.data ?? { title: id, intro: undefined, order: 0 };
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

/** Preisstand der Karte als ISO-Datum, oder `undefined`. */
export async function getPriceDate() {
  const settings = await getEntry("settings", "menu");
  return settings?.data.priceDate;
}
