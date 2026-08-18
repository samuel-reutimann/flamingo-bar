/**
 * Getränkekarte als Daten — Grundlage für das `Menu`-Structured-Data auf
 * `/getraenkekarte`.
 *
 * Das Markup der Seite steht bewusst ausgeschrieben da (Stackis Marker-Parser
 * verträgt kein `.map()`, siehe AGENTS.md), deshalb ist diese Liste eine
 * Zweitfassung derselben Preise. Beim Ändern der Karte hier mitziehen —
 * genau wie `PRICE_DATE` in `src/pages/getraenkekarte.astro`.
 *
 * `price` ist der reine Betrag in CHF. Positionen ohne festen Preis
 * ("Auf Anfrage", "Ab CHF 13.–") lassen `price` weg.
 */
import type { MenuSectionInput } from "@/utils/schema.ts";

export const MENU_SECTIONS: MenuSectionInput[] = [
  {
    name: "Cocktails",
    description: "Ab CHF 12.–, alle frisch gemixt.",
    items: [
      {
        name: "Aperol Spritz",
        description: "Aperol, Prosecco, Mineral, Orange.",
      },
      {
        name: "Long Island Iced Tea",
        description: "Der Klassiker, stark und kalt.",
      },
      { name: "Piña Colada", description: "Rum, Kokos, Ananas." },
      { name: "Mojito", price: "14" },
      { name: "Cosmopolitan", price: "15" },
      { name: "Whiskey Sour", price: "15" },
      { name: "Espresso Martini", price: "16" },
      { name: "Negroni", price: "15" },
      { name: "Moscow Mule", price: "14" },
    ],
  },
  {
    name: "Longdrinks",
    description: "Ab CHF 12.–",
    items: [
      { name: "Vodka Energy", price: "13" },
      { name: "Gin Tonic", price: "14" },
      { name: "Rum Cola", price: "12" },
      { name: "Whisky Cola", price: "13" },
      { name: "Jägermeister, 4 cl", price: "6" },
      { name: "Tequila, 4 cl", price: "6" },
    ],
  },
  {
    name: "Spirituosen und Flaschen",
    description:
      "Preis pro 4 cl und für die ganze Flasche. Flaschen kommen mit Mineral an den Tisch.",
    items: [],
    sections: [
      {
        name: "Whisky",
        items: [
          { name: "Jack Daniel’s, 4 cl", price: "14" },
          { name: "Jack Daniel’s, Flasche", price: "120" },
          { name: "Chivas Regal 12, 4 cl", price: "15" },
          { name: "Chivas Regal 12, Flasche", price: "135" },
          { name: "Ballantine’s, 4 cl", price: "13" },
          { name: "Ballantine’s, Flasche", price: "105" },
        ],
      },
      {
        name: "Vodka",
        items: [
          { name: "Absolut, Flasche", price: "105" },
          { name: "Grey Goose, Flasche", price: "150" },
          { name: "Belvedere, Flasche", price: "150" },
        ],
      },
      {
        name: "Rum",
        items: [
          { name: "Havana Club 3, Flasche", price: "105" },
          { name: "Bacardi Carta Blanca, Flasche", price: "105" },
          { name: "Zacapa 23, Flasche", description: "Preis auf Anfrage." },
        ],
      },
      {
        name: "Gin",
        items: [
          { name: "Bombay Sapphire, Flasche", price: "120" },
          { name: "Gordon’s, Flasche", price: "105" },
          { name: "Tanqueray, Flasche", price: "125" },
        ],
      },
    ],
  },
  {
    name: "Alkoholfrei und Getränke",
    items: [
      { name: "Virgin Mojito", price: "9" },
      { name: "Mineral, Cola, Red Bull", price: "5" },
      { name: "Bier vom Fass", price: "6" },
      { name: "Prosecco, 1 dl", price: "8" },
    ],
  },
  {
    name: "Flaschenservice",
    description:
      "Für Geburtstage, Gruppen und private Abende. Ein Zusatz ist ein Mixgetränk wie Cola, Red Bull oder Tonic.",
    items: [
      {
        name: "Flasche mit Mineral",
        description: "Rum, Vodka, Whisky oder Gin. CHF 105.– bis 150.–",
      },
      {
        name: "Flasche mit 2 Zusätzen",
        description: "Zum Beispiel Cola und Red Bull. Preis auf Anfrage.",
      },
      {
        name: "Gruppen und Geburtstage",
        description: "Ab 6 Personen, Tisch reserviert. Auf Anfrage.",
      },
    ],
  },
  {
    name: "Weitere Getränke",
    description:
      "Was nicht auf der Karte steht, gibt es oft trotzdem. Frag an der Bar.",
    items: [
      { name: "Vodka Red Bull", price: "15" },
      { name: "Spirituose mit Mineral, 4 cl", description: "Ab CHF 13.–" },
      { name: "Belvedere mit Zusatz", description: "Preis auf Anfrage." },
      { name: "Shots, ab 4 Stück", description: "Preis auf Anfrage." },
    ],
  },
];
