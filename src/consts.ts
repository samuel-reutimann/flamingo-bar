/** Site name. Appended to every page title and used as `og:site_name`. */
export const SITE_NAME = "Flamingo Bar";
/** Fallback meta description for pages that don't set their own. */
export const SITE_DESCRIPTION =
  "Flamingo Bar in Langenthal, Marktgasse 34B: Drinks, DJ-Abende und Flaschenservice. Getränkekarte mit allen Preisen jetzt online ansehen.";
/** Canonical origin. Resolves canonical URLs, social images, and the sitemap. */
export const SITE_URL = "https://flamingobar.ch";
/** BCP 47 locale tag used to format dates and numbers. */
export const SITE_LOCALE = "de-CH";
/**
 * Routes kept out of search results. Each is excluded from the sitemap and
 * served with a `robots: noindex, nofollow` tag, so the two can't disagree.
 *
 * Surrounding slashes are optional: `"/thanks"`, `"thanks"` and `"/thanks/"`
 * all match the same route.
 */
export const NOINDEX_ROUTES: string[] = ["/404"];

/**
 * Stammdaten des Betriebs. Einzige Quelle für Telefon, WhatsApp, Adresse und
 * Profile — Seiten und Structured Data lesen von hier, damit NAP-Angaben
 * (Name, Address, Phone) überall identisch sind. Google vergleicht sie mit
 * dem Google-Business-Profil; Abweichungen kosten Sichtbarkeit in der lokalen
 * Suche.
 *
 * OFFEN vor dem Livegang — die einzige Liste, die es dafür gibt:
 *
 * 1. Impressum: Rechtsform (Einzelfirma, GmbH, AG) und, falls im
 *    Handelsregister bzw. MWST-Register eingetragen, die CHE-Nummern.
 *    Solange sie fehlen, nennt `/impressum` diese Punkte gar nicht — leere
 *    eckige Klammern auf einer Pflichtseite wären schlimmer als ihr Fehlen.
 * 2. `instagram` / `instagramHandle` sind nie bestätigt worden.
 * 3. `geo` im Structured Data fehlt bewusst (siehe `utils/schema.ts`).
 */
export const BUSINESS = {
  /** E.164, für `tel:`-Links und Structured Data. */
  phone: "+41764019466",
  /** Wie die Nummer im Text erscheint. */
  phoneDisplay: "076 401 94 66",
  /** Nur Ziffern, für `wa.me`-Links. */
  whatsapp: "41764019466",
  email: "negasi.gebretnsa@icloud.com",
  instagram: "https://www.instagram.com/flamingobar.langenthal/",
  instagramHandle: "@flamingobar.langenthal",
  street: "Marktgasse 34B",
  postalCode: "4900",
  city: "Langenthal",
  country: "CH",
  /** Preisspanne für Structured Data: günstigster Drink bis teuerste Flasche. */
  priceRange: "CHF 5–150",
  mapsUrl: "https://maps.google.com/?q=Marktgasse+34B+4900+Langenthal",
} as const;

/**
 * Die Adresse als fertige Zeilen. Stand vorher auf zehn Seiten ausgeschrieben,
 * teils mit und teils ohne Postleitzahl — bei einem Umzug wären einzelne
 * Vorkommen stehen geblieben.
 */
/** „Marktgasse 34B, 4900 Langenthal“ — Impressum, Karten-Alt-Text, Kontakt. */
export const ADDRESS_LINE = `${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city}`;
/** „Marktgasse 34B, Langenthal“ — Fließtext, wo die PLZ nur stört. */
export const ADDRESS_SHORT = `${BUSINESS.street}, ${BUSINESS.city}`;

/**
 * Inhaberschaft — im Impressum als Vertretung und als verantwortliche Person.
 *
 * Rechtsform und CHE-Nummern fehlen noch (siehe die offene Liste bei
 * `BUSINESS`); die betreffenden Zeilen stehen deshalb gar nicht auf der Seite,
 * statt mit leeren eckigen Klammern in Produktion zu gehen.
 */
export const OWNER = "Negasi Gebretnsa";
