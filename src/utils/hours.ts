/**
 * Öffnungszeiten der Bar – eine Quelle für die Hero-Pill, den
 * Öffnungszeiten-Strip und die Footer-Liste. Der Index folgt
 * `Date.prototype.getDay()` (0 = Sonntag).
 */
export const DAY_NAMES = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
] as const;

/** Tage ohne Eintrag sind geschlossen. */
export const DAY_TIMES: Record<number, string> = {
  4: "20 – 03 Uhr",
  5: "20 – 04 Uhr",
  6: "20 – 04 Uhr",
  0: "20 – 01 Uhr",
};

/** Minuten seit Mitternacht; Werte über 24 h laufen in den Folgetag. */
export const SCHEDULE: Record<number, [number, number]> = {
  4: [20 * 60, 27 * 60], // Donnerstag 20 – 03 Uhr
  5: [20 * 60, 28 * 60], // Freitag 20 – 04 Uhr
  6: [20 * 60, 28 * 60], // Samstag 20 – 04 Uhr
  0: [20 * 60, 25 * 60], // Sonntag 20 – 01 Uhr
};

export function isOpenAt(date: Date) {
  const minutes = date.getHours() * 60 + date.getMinutes();

  const today = SCHEDULE[date.getDay()];
  if (today && minutes >= today[0] && minutes < today[1]) return true;

  // Nachtstunden, die noch zum Vortag gehören
  const yesterday = SCHEDULE[(date.getDay() + 6) % 7];
  if (yesterday && yesterday[1] > 24 * 60 && minutes < yesterday[1] - 24 * 60)
    return true;

  return false;
}

/** Pill im Hero: „Heute 20 – 04 Uhr“ oder „Ab Donnerstag 20 Uhr“. */
export function todayHoursLabel(dayIndex: number) {
  const today = DAY_TIMES[dayIndex];
  if (today) return `Heute ${today}`;

  for (let i = 1; i <= 7; i++) {
    const next = (dayIndex + i) % 7;
    if (DAY_TIMES[next]) return `Ab ${DAY_NAMES[next]} 20 Uhr`;
  }

  return "";
}

/** Strip unter dem Hero: „Freitag, 20 – 04 Uhr“ oder „Montag, geschlossen“. */
export function todayLineLabel(dayIndex: number) {
  return `${DAY_NAMES[dayIndex]}, ${DAY_TIMES[dayIndex] ?? "geschlossen"}`;
}
