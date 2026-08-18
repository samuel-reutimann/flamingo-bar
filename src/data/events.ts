/**
 * Termine für das `Event`-Structured-Data auf `/events`.
 *
 * Zweitfassung der Karten und der Liste im Seiten-Markup (siehe
 * `src/data/menu.ts` zum gleichen Grund). Beim Eintragen eines Abends hier
 * mitziehen, sonst kündigt Google Termine an, die auf der Seite fehlen.
 *
 * `start`/`end` mit Offset: `+02:00` gilt in der Sommerzeit, im Winter `+01:00`.
 * Vergangene Termine löschen — Google zeigt sonst abgelaufene Einträge.
 */
import type { EventInput } from "@/utils/schema.ts";

export const EVENTS: EventInput[] = [
  {
    name: "Pink Friday mit DJ Nael",
    start: "2026-08-21T21:00:00+02:00",
    end: "2026-08-22T04:00:00+02:00",
    description: "DJ-Abend mit DJ Nael. Ab 21 Uhr, Eintritt frei.",
    image: "/og-image.jpg",
    price: "0",
  },
  {
    name: "Latin Night",
    start: "2026-08-22T21:00:00+02:00",
    end: "2026-08-23T04:00:00+02:00",
    description: "Motto-Party mit Latin-Sound. Ab 21 Uhr, Eintritt frei.",
    image: "/og-image.jpg",
    price: "0",
  },
  {
    name: "Live Session",
    start: "2026-08-27T20:30:00+02:00",
    end: "2026-08-28T03:00:00+02:00",
    description:
      "Live-Musik im pinken Gegenlicht. Ab 20.30 Uhr, Eintritt frei.",
    image: "/og-image.jpg",
    price: "0",
  },
  {
    name: "Pink Friday mit DJ Nael",
    start: "2026-08-28T21:00:00+02:00",
    end: "2026-08-29T04:00:00+02:00",
    description: "DJ-Abend mit DJ Nael. Ab 21 Uhr, Eintritt frei.",
    price: "0",
  },
  {
    name: "Latin Night",
    start: "2026-08-29T21:00:00+02:00",
    end: "2026-08-30T04:00:00+02:00",
    description: "Motto-Party mit Latin-Sound. Ab 21 Uhr, Eintritt frei.",
    price: "0",
  },
  {
    name: "Live Session",
    start: "2026-09-03T20:30:00+02:00",
    end: "2026-09-04T03:00:00+02:00",
    description: "Live-Musik. Ab 20.30 Uhr, Eintritt frei.",
    price: "0",
  },
  {
    name: "Flamingo Friday",
    start: "2026-09-04T21:00:00+02:00",
    end: "2026-09-05T04:00:00+02:00",
    description: "DJ-Abend. Ab 21 Uhr, Eintritt frei.",
    price: "0",
  },
  {
    name: "90s & 2000s Night",
    start: "2026-09-05T21:00:00+02:00",
    end: "2026-09-06T04:00:00+02:00",
    description:
      "Motto-Party mit 90s- und 2000s-Sound. Ab 21 Uhr, Eintritt frei.",
    price: "0",
  },
];
