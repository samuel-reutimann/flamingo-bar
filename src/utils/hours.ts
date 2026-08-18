/**
 * Öffnungszeiten-Logik für Hero-Pill, Strip, Footer und
 * `/oeffnungszeiten`.
 *
 * Die Zeiten selbst stehen nicht mehr hier, sondern in der Collection
 * `src/content/hours.yaml` — damit der Betrieb sie in Keystatic oder Stacki
 * ändern kann. `BaseLayout.astro` schreibt sie als JSON-Block
 * (`#hours-data`) in jede Seite; die Funktionen unten lesen ihn beim ersten
 * Aufruf. Die Aufrufe im Browser bleiben deshalb unverändert:
 * `isOpenAt(new Date())`, `todayHoursLabel(day)`, `todayLineLabel(day)`.
 *
 * Für den Build (Structured Data) gibt es `scheduleFrom()`, das ohne DOM
 * arbeitet — `schema.ts` bekommt die Tage direkt aus der Collection.
 */

/** Ein Wochentag, wie er in `hours.yaml` steht. */
export type DayHours = {
  label: string;
  time: string;
  closed: boolean;
  /** Wie `Date.prototype.getDay()`: Sonntag = 0. */
  weekday: number;
  /** `HH:MM`. Fehlt an geschlossenen Tagen. */
  opens?: string;
  closes?: string;
};

/** Wochentage, Index wie `Date.prototype.getDay()`. */
export const DAY_NAMES = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
] as const;

/** `HH:MM` als Minuten seit Mitternacht. */
const toMinutes = (clock: string) => {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + (m || 0);
};

/**
 * Minuten seit Mitternacht pro Wochentag. Schließzeiten, die vor der
 * Öffnungszeit liegen, gehören in den Folgetag und laufen über 24 h hinaus
 * (Donnerstag 20 – 03 Uhr wird `[1200, 1620]`).
 */
export function scheduleFrom(days: DayHours[]): Record<number, [number, number]> {
  const schedule: Record<number, [number, number]> = {};
  for (const day of days) {
    if (day.closed || !day.opens || !day.closes) continue;
    const opens = toMinutes(day.opens);
    let closes = toMinutes(day.closes);
    if (closes <= opens) closes += 24 * 60;
    schedule[day.weekday] = [opens, closes];
  }
  return schedule;
}

/** Anzeigetext pro Wochentag. Geschlossene Tage fehlen. */
export function dayTimesFrom(days: DayHours[]): Record<number, string> {
  const times: Record<number, string> = {};
  for (const day of days) {
    if (!day.closed) times[day.weekday] = day.time;
  }
  return times;
}

/**
 * Die Tage aus `#hours-data`. Nur im Browser; beim Rendern gibt es kein
 * `document`, dort werden die Tage direkt übergeben. Wird einmal geparst und
 * gemerkt.
 */
let cached: DayHours[] | null = null;

function days(): DayHours[] {
  if (cached) return cached;
  if (typeof document === "undefined") return [];
  const tag = document.getElementById("hours-data");
  if (!tag?.textContent) return [];
  try {
    cached = JSON.parse(tag.textContent) as DayHours[];
  } catch {
    // Kaputtes JSON darf die Seite nicht mitnehmen — ohne Zeiten bleibt der
    // Status-Pill einfach verborgen.
    cached = [];
  }
  return cached;
}

export function isOpenAt(date: Date, schedule = scheduleFrom(days())) {
  const minutes = date.getHours() * 60 + date.getMinutes();

  const today = schedule[date.getDay()];
  if (today && minutes >= today[0] && minutes < today[1]) return true;

  // Nachtstunden, die noch zum Vortag gehören
  const yesterday = schedule[(date.getDay() + 6) % 7];
  if (yesterday && yesterday[1] > 24 * 60 && minutes < yesterday[1] - 24 * 60)
    return true;

  return false;
}

/** Pill im Hero: „Heute 20 – 04 Uhr“ oder „Ab Donnerstag 20 Uhr“. */
export function todayHoursLabel(dayIndex: number, dayTimes = dayTimesFrom(days())) {
  const today = dayTimes[dayIndex];
  if (today) return `Heute ${today}`;

  for (let i = 1; i <= 7; i++) {
    const next = (dayIndex + i) % 7;
    if (dayTimes[next]) return `Ab ${DAY_NAMES[next]} 20 Uhr`;
  }

  return "";
}

/** Strip unter dem Hero: „Freitag, 20 – 04 Uhr“ oder „Montag, geschlossen“. */
export function todayLineLabel(dayIndex: number, dayTimes = dayTimesFrom(days())) {
  return `${DAY_NAMES[dayIndex]}, ${dayTimes[dayIndex] ?? "geschlossen"}`;
}
