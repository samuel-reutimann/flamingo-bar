/**
 * Die Auswahllisten der Collections — einmal, für beide Seiten.
 *
 * `keystatic.config.ts` braucht `{ label, value }` für die Dropdowns,
 * `content.config.ts` braucht die blanken Werte für `z.enum()`. Beide standen
 * getrennt voneinander in den zwei Dateien: eine neue Kategorie in Keystatic
 * ließ den Build mit einem Zod-Fehler stehen, eine neue in Zod tauchte im
 * Editor nie auf.
 *
 * Bewusst ohne `astro:content`-Import — `keystatic.config.ts` läuft auch
 * außerhalb der Astro-Pipeline und könnte das virtuelle Modul nicht auflösen.
 */

type Option = { readonly label: string; readonly value: string };

/** Die `value`s einer Optionsliste als Tupel, mit erhaltenen Literaltypen. */
type Values<T extends readonly Option[]> = {
  [K in keyof T]: T[K] extends { value: infer V } ? V : never;
};

export const values = <T extends readonly Option[]>(options: T) =>
  options.map((option) => option.value) as unknown as Values<T>;

/** Art des Abends — erscheint als Tag in der Terminliste. */
export const EVENT_TAGS = [
  { label: "DJ-Abend", value: "DJ-Abend" },
  { label: "Live-Musik", value: "Live-Musik" },
  { label: "Motto-Party", value: "Motto-Party" },
  { label: "Sport", value: "Sport" },
  { label: "Special", value: "Special" },
] as const;

/** Kategorien der Getränkekarte. Reihenfolge = Reihenfolge auf der Seite. */
export const DRINK_CATEGORIES = [
  { label: "Cocktails", value: "cocktails" },
  { label: "Longdrinks", value: "longdrinks" },
  { label: "Alkoholfrei und Getränke", value: "alkoholfrei" },
  { label: "Weitere Getränke", value: "weitere" },
] as const;

/** Gruppen im Spirituosen-Block. */
export const SPIRIT_GROUPS = [
  { label: "Whisky", value: "whisky" },
  { label: "Vodka", value: "vodka" },
  { label: "Rum", value: "rum" },
  { label: "Gin", value: "gin" },
] as const;

/** Abschnitte der Getränkekarte, in der Reihenfolge der Seite. */
export const MENU_SECTIONS = [
  { label: "Cocktails", value: "cocktails" },
  { label: "Longdrinks", value: "longdrinks" },
  { label: "Spirituosen und Flaschen", value: "spirituosen" },
  { label: "Alkoholfrei und Getränke", value: "alkoholfrei" },
  { label: "Flaschenservice", value: "flaschen" },
  { label: "Weitere Getränke", value: "weitere" },
] as const;
