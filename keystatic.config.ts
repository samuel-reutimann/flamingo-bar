/**
 * Keystatic — das Redaktions-Backend für die Flamingo Bar.
 *
 * Öffnet unter `/keystatic`. Schreibt genau dieselben Dateien, die
 * `src/content.config.ts` deklariert: eine Quelle für Keystatic, Stacki und
 * den Build. Wer hier ein Feld ergänzt, ergänzt es dort mit — sonst wirft
 * der Build einen Zod-Fehler.
 *
 * Beschriftungen sind auf Deutsch, weil der Betrieb selbst pflegt.
 *
 * ## Storage
 *
 * Steht auf `local`: die Oberfläche schreibt direkt in die Dateien auf dieser
 * Maschine. Damit der Kunde im Browser pflegen kann, braucht es ein Projekt
 * auf keystatic.cloud (Konto und Projekt legt der Betreiber selbst an) und
 * dann hier:
 *
 *     storage: { kind: "cloud" },
 *     cloud: { project: "team-slug/projekt-slug" },
 *
 * Danach `astro build` und deployen. Jede Speicherung des Kunden wird ein
 * Commit im GitHub-Repo und löst den Rebuild aus.
 */
import { config, collection, singleton, fields } from "@keystatic/core";

const EVENT_TAGS = [
  { label: "DJ-Abend", value: "DJ-Abend" },
  { label: "Live-Musik", value: "Live-Musik" },
  { label: "Motto-Party", value: "Motto-Party" },
  { label: "Sport", value: "Sport" },
  { label: "Special", value: "Special" },
] as const;

const DRINK_CATEGORIES = [
  { label: "Cocktails", value: "cocktails" },
  { label: "Longdrinks", value: "longdrinks" },
  { label: "Alkoholfrei und Getränke", value: "alkoholfrei" },
  { label: "Weitere Getränke", value: "weitere" },
] as const;

const SPIRIT_GROUPS = [
  { label: "Whisky", value: "whisky" },
  { label: "Vodka", value: "vodka" },
  { label: "Rum", value: "rum" },
  { label: "Gin", value: "gin" },
] as const;

/** Bilder liegen bei den übrigen Assets, nicht im Content-Ordner. */
const imageField = (description: string) =>
  fields.image({
    label: "Bild",
    description,
    directory: "src/assets/flamingo",
    publicPath: "../../assets/flamingo/",
  });

/**
 * Anzeigepreis und Betrag als Paar. Der Betrag ist optional, weil
 * "Auf Anfrage" und "Ab CHF 13.–" keine feste Zahl haben — und Google darf
 * keinen Preis angekündigt bekommen, den es an der Bar nicht gibt.
 */
const priceGroup = (label: string) => ({
  price: fields.text({
    label,
    description: 'Wie es auf der Karte steht, z. B. "CHF 14.–" oder "Auf Anfrage". Leer lassen, wenn dort bewusst kein Preis steht.',
  }),
  priceCHF: fields.number({
    label: `${label} als Zahl (für Google)`,
    description: "Nur ausfüllen, wenn der Preis fix ist. Ohne Währung, z. B. 14.",
    validation: { isRequired: false },
  }),
});

export default config({
  storage: { kind: "local" },

  ui: {
    brand: { name: "Flamingo Bar" },
    navigation: {
      Programm: ["events"],
      Getränkekarte: ["drinks", "spirits", "menuSections", "menuSettings"],
      Betrieb: ["hours"],
    },
  },

  collections: {
    events: collection({
      label: "Events",
      path: "src/content/events/*",
      slugField: "name",
      format: { data: "yaml" },
      entryLayout: "form",
      columns: ["name", "start"],
      schema: {
        name: fields.slug({
          name: {
            label: "Titel",
            description: 'Wie der Abend heißt, z. B. "Pink Friday mit DJ Nael".',
          },
        }),
        start: fields.datetime({
          label: "Beginn",
          description: "Datum und Startzeit.",
          validation: { isRequired: true },
        }),
        end: fields.datetime({
          label: "Ende",
          description: "Meist am Folgetag früh morgens.",
          validation: { isRequired: true },
        }),
        description: fields.text({
          label: "Beschreibung",
          multiline: true,
          description: 'Ein bis zwei Sätze, z. B. "DJ-Abend mit DJ Nael. Ab 21 Uhr, Eintritt frei."',
          validation: { isRequired: true },
        }),
        tag: fields.select({
          label: "Art",
          options: [...EVENT_TAGS],
          defaultValue: "DJ-Abend",
        }),
        image: imageField("Nur nötig, wenn der Abend oben als große Karte stehen soll."),
        imageAlt: fields.text({
          label: "Bildbeschreibung",
          description: "Für Screenreader und Google. Was ist auf dem Bild zu sehen?",
        }),
        featured: fields.checkbox({
          label: "Oben als große Karte zeigen",
          description: "Braucht ein Bild. Drei Karten sehen am besten aus.",
          defaultValue: false,
        }),
        priceCHF: fields.number({
          label: "Eintritt in CHF",
          description: "0 heißt Eintritt frei.",
          defaultValue: 0,
        }),
      },
    }),

    drinks: collection({
      label: "Getränke",
      path: "src/content/drinks/*",
      slugField: "name",
      format: { data: "yaml" },
      entryLayout: "form",
      columns: ["name", "category", "price"],
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        category: fields.select({
          label: "Abschnitt",
          description: "Bestimmt, unter welcher Überschrift das Getränk steht.",
          options: [...DRINK_CATEGORIES],
          defaultValue: "cocktails",
        }),
        ...priceGroup("Preis"),
        description: fields.text({
          label: "Zutaten oder Hinweis",
          multiline: true,
          description: 'Z. B. "Aperol, Prosecco, Mineral, Orange." Wird nur bei Getränken mit Bild angezeigt.',
        }),
        image: imageField("Nur die wenigen Getränke oben im Abschnitt brauchen ein Bild."),
        imageAlt: fields.text({
          label: "Bildbeschreibung",
          description: "Für Screenreader und Google.",
        }),
        order: fields.number({
          label: "Reihenfolge",
          description: "Kleinere Zahl steht weiter oben, innerhalb des Abschnitts.",
          defaultValue: 0,
        }),
      },
    }),

    spirits: collection({
      label: "Spirituosen und Flaschen",
      path: "src/content/spirits/*",
      slugField: "name",
      format: { data: "yaml" },
      entryLayout: "form",
      columns: ["name", "group", "glass", "bottle"],
      schema: {
        name: fields.slug({ name: { label: "Sorte" } }),
        group: fields.select({
          label: "Gruppe",
          options: [...SPIRIT_GROUPS],
          defaultValue: "whisky",
        }),
        glass: fields.text({
          label: "Preis 4 cl",
          description: 'Z. B. "CHF 14.–" oder "Auf Anfrage".',
        }),
        glassCHF: fields.number({
          label: "4 cl als Zahl (für Google)",
          description: "Nur bei festem Preis.",
          validation: { isRequired: false },
        }),
        bottle: fields.text({
          label: "Preis Flasche",
          description: 'Z. B. "CHF 120.–" oder "Auf Anfrage".',
        }),
        bottleCHF: fields.number({
          label: "Flasche als Zahl (für Google)",
          description: "Nur bei festem Preis.",
          validation: { isRequired: false },
        }),
        order: fields.number({
          label: "Reihenfolge",
          description: "Innerhalb der Gruppe.",
          defaultValue: 0,
        }),
      },
    }),

    menuSections: collection({
      label: "Abschnitts-Texte",
      path: "src/content/menu-sections/*",
      slugField: "title",
      format: { data: "yaml" },
      entryLayout: "form",
      columns: ["title", "intro"],
      schema: {
        title: fields.slug({
          name: {
            label: "Überschrift",
            description: "Der Dateiname darf nicht geändert werden — die Seite sucht die Abschnitte darüber.",
          },
        }),
        intro: fields.text({
          label: "Einleitung",
          multiline: true,
          description: 'Der Satz unter der Überschrift, z. B. "Ab CHF 12.–, alle frisch gemixt."',
        }),
        order: fields.number({ label: "Reihenfolge", defaultValue: 0 }),
      },
    }),
  },

  singletons: {
    hours: singleton({
      label: "Öffnungszeiten",
      path: "src/content/hours",
      format: { data: "yaml" },
      schema: {
        montag: dayField("Montag", 1),
        dienstag: dayField("Dienstag", 2),
        mittwoch: dayField("Mittwoch", 3),
        donnerstag: dayField("Donnerstag", 4),
        freitag: dayField("Freitag", 5),
        samstag: dayField("Samstag", 6),
        sonntag: dayField("Sonntag", 0),
      },
    }),

    menuSettings: singleton({
      label: "Stand der Preise",
      path: "src/content/settings",
      format: { data: "yaml" },
      schema: {
        menu: fields.object(
          {
            priceDate: fields.date({
              label: "Preise aktualisiert am",
              description: "Erscheint unter der Karte. Nach einer Preisänderung mitziehen.",
            }),
          },
          { label: "Getränkekarte" }
        ),
      },
    }),
  },
});

/**
 * Ein Wochentag. Die sieben Tage stehen einzeln im Schema statt als Liste,
 * damit die Reihenfolge fix bleibt und niemand versehentlich einen Tag
 * löscht. `weekday` ist bewusst nicht editierbar — `HoursTable.astro`
 * markiert damit den heutigen Tag.
 */
function dayField(label: string, weekday: number) {
  return fields.object(
    {
      label: fields.text({ label: "Tag", defaultValue: label }),
      time: fields.text({
        label: "Zeit",
        description: 'Z. B. "20 – 04 Uhr". Bei geschlossen egal.',
        defaultValue: "Geschlossen",
      }),
      closed: fields.checkbox({ label: "Geschlossen", defaultValue: weekday >= 1 && weekday <= 3 }),
      weekday: fields.integer({
        label: "Wochentag-Nummer (nicht ändern)",
        defaultValue: weekday,
      }),
      opens: fields.text({ label: "Öffnet (HH:MM, für Google)" }),
      closes: fields.text({ label: "Schließt (HH:MM, für Google)" }),
    },
    { label }
  );
}
