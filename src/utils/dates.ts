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

/** Karten-Eyebrow: „Freitag, 21. August 2026“. */
export const longDate = (iso: string) =>
  fmt(new Date(iso), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Listen-Datum: „Fr, 28. Aug“ — ohne die Punkte, die `de-CH` anhängt. */
export const shortDate = (iso: string) => {
  const date = new Date(iso);
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
  }).formatToParts(new Date(iso));
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
