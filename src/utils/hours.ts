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

/** Kurzform derselben Tage, für „Do – So“. */
export const DAY_NAMES_SHORT = [
  "So",
  "Mo",
  "Di",
  "Mi",
  "Do",
  "Fr",
  "Sa",
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

/** `HH:MM` als Uhrzeit ohne führende Null: „20:00“ → „20“, „20:30“ → „20.30“. */
const clock = (time: string) => {
  const [h, m] = time.split(":");
  return m && m !== "00" ? `${Number(h)}.${m}` : String(Number(h));
};

/** Öffnungszeit pro Wochentag als `HH:MM`. Geschlossene Tage fehlen. */
export function openTimesFrom(days: DayHours[]): Record<number, string> {
  const times: Record<number, string> = {};
  for (const day of days) {
    if (!day.closed && day.opens) times[day.weekday] = day.opens;
  }
  return times;
}

/**
 * Aufeinanderfolgende Tage zu Läufen bündeln. „Aufeinanderfolgend“ heißt
 * benachbart im übergebenen Array *und* im Kalender; optional muss zusätzlich
 * `key` übereinstimmen, damit Tage mit verschiedenen Zeiten getrennt bleiben.
 */
function runsOf(days: DayHours[], key: (day: DayHours) => string = () => "") {
  const runs: DayHours[][] = [];
  for (const day of days) {
    const run = runs.at(-1);
    const previous = run?.at(-1);
    const contiguous =
      previous &&
      (previous.weekday + 1) % 7 === day.weekday &&
      key(previous) === key(day);
    if (run && contiguous) run.push(day);
    else runs.push([day]);
  }
  return runs;
}

/** „Freitag und Samstag“, „Montag bis Mittwoch“, „Donnerstag“. */
function namesOf(run: DayHours[], names: readonly string[]) {
  if (run.length === 1) return names[run[0].weekday];
  if (run.length === 2)
    return `${names[run[0].weekday]} und ${names[run[1].weekday]}`;
  return `${names[run[0].weekday]} bis ${names[run.at(-1)!.weekday]}`;
}

/**
 * Zusammenfassung der offenen Tage: „Do – So, ab 20 Uhr“.
 *
 * Aufeinanderfolgende Tage werden zu einer Spanne zusammengezogen, Lücken
 * durch Komma getrennt („Do, Sa – So“). Die Uhrzeit hängt nur dran, wenn alle
 * offenen Tage zur selben Zeit aufmachen — sonst wäre sie eine Behauptung.
 *
 * `days` kommt aus `getHours()` und ist damit bereits Montag-zuerst sortiert;
 * die Reihenfolge des Arrays ist die Reihenfolge der Ausgabe.
 */
export function openDaysLabel(days: DayHours[], { long = false } = {}) {
  const open = days.filter((day) => !day.closed);
  if (!open.length) return "";

  /* Kurz für den Strip („Do – So“), lang für Überschrift und Meta-Description
     („Donnerstag bis Sonntag“). */
  const label = runsOf(open)
    .map((run) =>
      long
        ? namesOf(run, DAY_NAMES)
        : run.length > 1
          ? `${DAY_NAMES_SHORT[run[0].weekday]} – ${DAY_NAMES_SHORT[run.at(-1)!.weekday]}`
          : DAY_NAMES_SHORT[run[0].weekday]
    )
    .join(", ");

  const opens = open.map((day) => day.opens);
  const uniform = opens[0] && opens.every((time) => time === opens[0]);
  return uniform ? `${label}, ab ${clock(opens[0]!)} Uhr` : label;
}

/**
 * Die ganze Woche als Fließtext, für die FAQ im Structured Data:
 * „Donnerstag 20 bis 03 Uhr, Freitag und Samstag 20 bis 04 Uhr, Sonntag 20
 * bis 01 Uhr. Montag bis Mittwoch ist die Bar geschlossen.“
 *
 * Stand als vierte handgetippte Fassung der Öffnungszeiten auf
 * `/oeffnungszeiten` — Google bekam sie damit unabhängig von der Tabelle
 * daneben serviert.
 */
export function hoursSentence(days: DayHours[]) {
  const open = days.filter((day) => !day.closed);
  const closed = days.filter((day) => day.closed);

  const openPart = runsOf(open, (day) => day.time)
    .map(
      (run) =>
        `${namesOf(run, DAY_NAMES)} ${run[0].time.replace(/\s*–\s*/, " bis ")}`
    )
    .join(", ");

  const closedPart = closed.length
    ? `${runsOf(closed).map((run) => namesOf(run, DAY_NAMES)).join(", ")} ist die Bar geschlossen.`
    : "";

  return [openPart && `${openPart}.`, closedPart].filter(Boolean).join(" ");
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
export function todayHoursLabel(
  dayIndex: number,
  dayTimes = dayTimesFrom(days()),
  openTimes = openTimesFrom(days())
) {
  const today = dayTimes[dayIndex];
  if (today) return `Heute ${today}`;

  for (let i = 1; i <= 7; i++) {
    const next = (dayIndex + i) % 7;
    /* Die Uhrzeit kommt aus `opens` des nächsten offenen Tages. Sie stand
       hier als "20 Uhr" im Text — direkt neben dem Wert, den sie meint. */
    if (dayTimes[next]) {
      const opens = openTimes[next];
      return opens
        ? `Ab ${DAY_NAMES[next]} ${clock(opens)} Uhr`
        : `Ab ${DAY_NAMES[next]}`;
    }
  }

  return "";
}

/** Strip unter dem Hero: „Freitag, 20 – 04 Uhr“ oder „Montag, geschlossen“. */
export function todayLineLabel(dayIndex: number, dayTimes = dayTimesFrom(days())) {
  return `${DAY_NAMES[dayIndex]}, ${dayTimes[dayIndex] ?? "geschlossen"}`;
}
