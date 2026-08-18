/**
 * Datums- und Zeitformate für Termine.
 *
 * Alles wird explizit in `Europe/Zurich` formatiert, nicht in der Zeitzone des
 * Build-Rechners — der ist auf Cloudflare UTC, und ein Abend, der um 21 Uhr
 * beginnt, stünde dort als 19 Uhr auf der Seite.
 *
 * Die Helfer stehen hier und nicht in einer Seite, weil `/events` und die
 * Startseite dieselben Termine mit demselben Format zeigen.
 */

/** Zeitzone des Betriebs. Einzige Stelle, an der sie steht. */
export const TIMEZONE = "Europe/Zurich";

const fmt = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("de-CH", { timeZone: TIMEZONE, ...options }).format(date);

/** Wie viele Millisekunden die Zeitzone zu diesem Zeitpunkt vor UTC liegt. */
function offsetAt(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, Number(x.value)]));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

/**
 * `"2026-08-21T21:00"` als der Moment, an dem in Langenthal 21 Uhr ist.
 *
 * Keystatics `fields.datetime` speichert genau dieses Format — ohne Offset.
 * `new Date()` liest so einen Wert als **lokale Zeit des Rechners**, und der
 * ist beim Cloudflare-Build UTC: jeder Abend wäre um ein bis zwei Stunden
 * verschoben, und im Structured Data stünde die falsche Startzeit.
 *
 * Der Wert wird zuerst als UTC gelesen und dann um den Offset korrigiert, den
 * die Zeitzone zu diesem Zeitpunkt hat. Der zweite Durchgang fängt die beiden
 * Nächte im Jahr ab, in denen die Umstellung genau dazwischenliegt.
 */
export function parseLocal(value: string) {
  const guess = new Date(`${value}Z`);
  if (Number.isNaN(guess.getTime())) return guess;
  const first = new Date(guess.getTime() - offsetAt(guess));
  const second = offsetAt(first);
  return second === offsetAt(guess)
    ? first
    : new Date(guess.getTime() - second);
}

/**
 * Derselbe Zeitpunkt als vollständiges ISO-Datum mit Offset
 * (`2026-08-21T21:00:00+02:00`) — so will Schema.org `startDate` es haben.
 */
export function isoWithOffset(value: string) {
  const offset = offsetAt(parseLocal(value));
  const sign = offset < 0 ? "-" : "+";
  const total = Math.abs(offset) / 60000;
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  const seconds = value.length === 16 ? ":00" : "";
  return `${value}${seconds}${sign}${pad(total / 60)}:${pad(total % 60)}`;
}

/** Karten-Eyebrow: „Freitag, 21. August 2026“. */
export const longDate = (iso: string) =>
  fmt(parseLocal(iso), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Listen-Datum: „Fr, 28. Aug“ — ohne die Punkte, die `de-CH` anhängt. */
export const shortDate = (iso: string) => {
  const date = parseLocal(iso);
  const weekday = fmt(date, { weekday: "short" }).replace(".", "");
  const day = fmt(date, { day: "numeric" });
  const month = fmt(date, { month: "short" }).replace(".", "");
  return `${weekday}, ${day}. ${month}`;
};

/**
 * Uhrzeit ohne führende Null und ohne Minuten zur vollen Stunde:
 * „20.30“, „21“. Über `formatToParts`, weil `de-CH` an eine einzeln
 * formatierte Stunde " Uhr" anhängt und die Minute nicht auffüllt.
 */
export const clockTime = (iso: string) => {
  const parts = new Intl.DateTimeFormat("de-CH", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(parseLocal(iso));
  const part = (type: string) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  const hour = String(Number(part("hour")));
  const minute = part("minute");
  return minute === "00" ? hour : `${hour}.${minute}`;
};

/**
 * Zeile unter dem Titel: „Ab 21 Uhr, Eintritt frei.“ Wird aus Startzeit und
 * Eintritt gerechnet statt als zweites Feld gepflegt — so kann sie nicht von
 * der Uhrzeit abweichen.
 */
export const timeNote = (start: string, priceCHF: number) => {
  const entry =
    priceCHF === 0 ? "Eintritt frei." : `Eintritt CHF ${priceCHF}.–`;
  return `Ab ${clockTime(start)} Uhr, ${entry}`;
};
