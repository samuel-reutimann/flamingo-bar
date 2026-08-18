/** Site name. Appended to every page title and used as `og:site_name`. */
export const SITE_NAME = "Flamingo Bar";
/** Fallback meta description for pages that don't set their own. */
export const SITE_DESCRIPTION =
  "Flamingo Bar in Langenthal, Marktgasse 34B: Cocktails, DJ-Abende und Flaschenservice. Getränkekarte mit allen Preisen jetzt online ansehen.";
/** Canonical origin. Resolves canonical URLs, social images, and the sitemap. */
export const SITE_URL = "https://www.flamingobar-langenthal.ch";
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
 * TODO: `PHONE`, `PHONE_DISPLAY` und `WHATSAPP` sind noch Platzhalter
 * (062 000 00 00). Vor dem Livegang durch die echte Nummer ersetzen.
 */
export const BUSINESS = {
  /** E.164, für `tel:`-Links und Structured Data. */
  phone: "+41620000000",
  /** Wie die Nummer im Text erscheint. */
  phoneDisplay: "062 000 00 00",
  /** Nur Ziffern, für `wa.me`-Links. */
  whatsapp: "41620000000",
  email: "hallo@flamingobar-langenthal.ch",
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
