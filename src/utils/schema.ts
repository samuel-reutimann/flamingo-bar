/**
 * Structured Data (JSON-LD) für die Seiten. NAP-Angaben kommen aus
 * `consts.ts`, Öffnungszeiten und Karte aus den Collections — damit Markup
 * und Schema nicht auseinanderlaufen.
 */
import { BUSINESS, SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "../consts.ts";
import { scheduleFrom, type DayHours } from "./hours.ts";

/** Wochentage in schema.org-Schreibweise, Index wie `Date.prototype.getDay()`. */
const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).href;

/** Minuten seit Mitternacht als `HH:MM`; Werte über 24 h laufen in den Folgetag. */
const toClock = (minutes: number) => {
  const m = minutes % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

const openingHoursFrom = (days: DayHours[]) =>
  Object.entries(scheduleFrom(days)).map(([day, [opens, closes]]) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: SCHEMA_DAYS[Number(day)],
    opens: toClock(opens),
    closes: toClock(closes),
  }));

/** `@id` der Bar. Andere Schemas referenzieren die Bar damit statt sie zu wiederholen. */
export const BAR_ID = `${SITE_URL}/#bar`;

/**
 * Die Bar als `BarOrPub`. Für lokale Suche und das Wissenspanel.
 *
 * TODO: `geo` fehlt bewusst — falsche Koordinaten schaden mehr als keine.
 * Sobald die exakten Werte für die Marktgasse 34B feststehen, hier als
 * `geo: { "@type": "GeoCoordinates", latitude: …, longitude: … }` ergänzen.
 */
export const barSchema = (days: DayHours[]) => ({
  "@context": "https://schema.org",
  "@type": "BarOrPub",
  "@id": BAR_ID,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  image: absoluteUrl("/og-image.jpg"),
  url: `${SITE_URL}/`,
  telephone: BUSINESS.phone,
  email: BUSINESS.email,
  priceRange: BUSINESS.priceRange,
  currenciesAccepted: "CHF",
  address: {
    "@type": "PostalAddress",
    streetAddress: BUSINESS.street,
    postalCode: BUSINESS.postalCode,
    addressLocality: BUSINESS.city,
    addressCountry: BUSINESS.country,
  },
  hasMap: BUSINESS.mapsUrl,
  openingHoursSpecification: openingHoursFrom(days),
  hasMenu: absoluteUrl("/getraenkekarte"),
  sameAs: [BUSINESS.instagram],
  publicAccess: true,
  smokingAllowed: false,
});

/** Breadcrumb-Pfad. `Startseite` wird immer vorangestellt. */
export function breadcrumbSchema(
  trail: { name: string; path: string }[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Startseite", path: "/" }, ...trail].map(
      (item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
      }),
    ),
  };
}

/** FAQ-Block. Nur für Fragen, die auf der Seite auch sichtbar beantwortet werden. */
export function faqSchema(entries: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export type MenuItem = {
  name: string;
  /** Ohne `CHF` und ohne Endstrich — nur der Betrag, z. B. `"14"`. */
  price?: string;
  description?: string;
};

export type MenuSectionInput = {
  name: string;
  description?: string;
  items: MenuItem[];
  sections?: MenuSectionInput[];
};

const menuSection = (section: MenuSectionInput): object => ({
  "@type": "MenuSection",
  name: section.name,
  ...(section.description ? { description: section.description } : {}),
  ...(section.items.length
    ? {
        hasMenuItem: section.items.map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          ...(item.price
            ? {
                offers: {
                  "@type": "Offer",
                  price: item.price,
                  priceCurrency: "CHF",
                },
              }
            : {}),
        })),
      }
    : {}),
  ...(section.sections?.length
    ? { hasMenuSection: section.sections.map(menuSection) }
    : {}),
});

/** Getränkekarte als `Menu`. `dateModified` ist der Preisstand der Seite. */
export function menuSchema(sections: MenuSectionInput[], dateModified: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${SITE_URL}/getraenkekarte#menu`,
    name: "Getränkekarte",
    url: absoluteUrl("/getraenkekarte"),
    inLanguage: "de-CH",
    dateModified,
    provider: { "@id": BAR_ID },
    hasMenuSection: sections.map(menuSection),
  };
}

export type EventInput = {
  name: string;
  /** ISO-Datum mit Zeit und Offset, z. B. `"2026-08-21T21:00:00+02:00"`. */
  start: string;
  /** Ende des Abends, damit Google den Eintrag nach der Nacht ausblendet. */
  end: string;
  description: string;
  /** Absoluter Pfad zum Bild oder `undefined`. */
  image?: string;
  /** `0` für freien Eintritt. */
  price?: string;
};

/** Einzelne Abende als `Event`-Liste. Ohne Termine kommt ein leeres Array zurück. */
export function eventsSchema(events: EventInput[]) {
  return events.map((event) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: event.start,
    endDate: event.end,
    description: event.description,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(event.image ? { image: absoluteUrl(event.image) } : {}),
    location: {
      "@type": "Place",
      name: SITE_NAME,
      address: {
        "@type": "PostalAddress",
        streetAddress: BUSINESS.street,
        postalCode: BUSINESS.postalCode,
        addressLocality: BUSINESS.city,
        addressCountry: BUSINESS.country,
      },
    },
    organizer: { "@id": BAR_ID },
    ...(event.price !== undefined
      ? {
          offers: {
            "@type": "Offer",
            price: event.price,
            priceCurrency: "CHF",
            availability: "https://schema.org/InStock",
            url: absoluteUrl("/reservation"),
          },
        }
      : {}),
  }));
}
