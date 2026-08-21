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

/** Das Label einer Optionsliste zu einem Wert. */
export const labelOf = (options: readonly Option[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value;

/** Art des Abends — erscheint als Tag in der Terminliste. */
export const EVENT_TAGS = [
  { label: "DJ-Abend", value: "DJ-Abend" },
  { label: "Live-Musik", value: "Live-Musik" },
  { label: "Motto-Party", value: "Motto-Party" },
  { label: "Sport", value: "Sport" },
  { label: "Special", value: "Special" },
] as const;

/**
 * Abschnitte der Getränkekarte. Reihenfolge = Reihenfolge auf der Seite und
 * dieselbe wie auf der gedruckten Karte an der Bar.
 */
export const DRINK_CATEGORIES = [
  { label: "Alkoholfrei", value: "alkoholfrei" },
  { label: "Warme Getränke", value: "warm" },
  { label: "Bier", value: "bier" },
  { label: "Wein & Prosecco", value: "wein" },
  { label: "Shots", value: "shots" },
  { label: "Aperitif & Digestif", value: "aperitif" },
  { label: "Liköre", value: "likoere" },
  { label: "Whisky", value: "whisky" },
  { label: "Vodka & Rum", value: "vodkarum" },
] as const;

/**
 * Zwischentitel innerhalb eines Abschnitts — „Flaschenbier (33 cl)“,
 * „Im Glas (1 dl)“, „Flasche (inkl. Zusatzgetränke)“.
 *
 * Eine Liste für alle Abschnitte, keine pro Abschnitt: die Reihenfolge hier
 * ist die Reihenfolge der Zwischentitel auf der Seite, und ein Dropdown kann
 * sich nicht vertippen (ein Tippfehler wäre sonst eine neue, halb leere
 * Gruppe). `keine` heißt: die Position steht direkt unter der Überschrift.
 */
export const DRINK_GROUPS = [
  { label: "Ohne Zwischentitel", value: "keine" },
  { label: "Flaschenbier (33 cl)", value: "flaschenbier" },
  { label: "Offenbier", value: "offenbier" },
  { label: "Alkoholfreies Bier (33 cl)", value: "bier-alkoholfrei" },
  { label: "Im Glas (1 dl)", value: "wein-glas" },
  { label: "Flaschen", value: "wein-flaschen" },
  { label: "Flasche (inkl. Zusatzgetränke)", value: "spirituose-flasche" },
  { label: "Rum (4 cl)", value: "rum-4cl" },
] as const;

/**
 * Abschnitte, zu denen es einen Einleitungstext gibt: die Abschnitte der
 * Karte plus der Flaschenservice-Block, der keine Preisliste ist.
 */
export const MENU_SECTIONS = [
  ...DRINK_CATEGORIES,
  { label: "Flaschenservice", value: "flaschen" },
] as const;
