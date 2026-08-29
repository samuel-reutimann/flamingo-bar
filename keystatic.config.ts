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
 * `cloud`: die Redaktion läuft über keystatic.cloud gegen das GitHub-Repo
 * `samuel-reutimann/flamingo-bar`. Der Kunde meldet sich bei Keystatic Cloud
 * an und braucht selbst keinen GitHub-Zugang. Jede Speicherung wird ein
 * Commit auf `main` und löst den Cloudflare-Build aus — die Änderung steht
 * rund eine Minute später auf der Seite.
 *
 * Lokal (`npm run dev`, `http://127.0.0.1:4321/keystatic`) funktioniert das
 * ebenfalls, weil im Cloud-Projekt "Allow local development" aktiv ist.
 *
 * Wichtig: Keystatic Cloud lässt die Anmeldung nur von den URLs zu, die im
 * Projekt unter "Project URLs" eingetragen sind. Neue Domain der Seite dort
 * ergänzen, sonst bricht der Login ab.
 */
import { config, collection, singleton, fields } from "@keystatic/core";

import {
  DRINK_CATEGORIES,
  DRINK_GROUPS,
  EVENT_TAGS,
  GALLERY_RATIOS,
  MENU_SECTIONS,
} from "./src/content/options.ts";

/**
 * `fields.datetime`, das als Zeichenkette in der Datei landet.
 *
 * Keystatics eigenes `serialize()` gibt ein `Date` zurück, dessen `toJSON` und
 * `toString` auf die Kurzform `2026-09-05T21:00` gepatcht sind. In der
 * Cloud-Oberfläche läuft der Wert über eine Structured-Clone-Grenze, die genau
 * diesen Patch abstreift; der YAML-Writer schreibt danach den nativen
 * Zeitstempel `2026-09-05T21:00:00.000Z`, und der Build hält an dem Muster in
 * `content.config.ts` an. Lokal fällt das nicht auf, weil dort nicht geklont
 * wird — die Kurzform kommt heraus und alles sieht in Ordnung aus.
 *
 * Eine Zeichenkette übersteht das Klonen unverändert.
 */
function localDatetime(options: Parameters<typeof fields.datetime>[0]) {
  const field = fields.datetime(options);
  return {
    ...field,
    serialize(value: string | null) {
      const { value: serialized } = field.serialize(value);
      return {
        value: serialized === undefined ? undefined : String(serialized),
      };
    },
  };
}

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
  storage: { kind: "cloud" },
  cloud: { project: "flamingo-bar/flamingo-bar" },

  ui: {
    brand: { name: "Flamingo Bar" },
    navigation: {
      Programm: ["events"],
      Getränkekarte: ["drinks", "bottleService", "menuSections", "menuSettings"],
      Galerie: ["gallery"],
      Betrieb: ["hours", "happyHour"],
    },
  },

  collections: {
    events: collection({
      label: "Events",
      path: "src/content/events/*",
      slugField: "name",
      format: { data: "yaml" },
      entryLayout: "form",
      columns: ["name", "start", "featured"],
      schema: {
        name: fields.slug({
          name: {
            label: "Titel",
            description: 'Wie der Abend heißt, z. B. "Pink Friday mit DJ Nael".',
          },
        }),
        start: localDatetime({
          label: "Beginn",
          description: "Datum und Startzeit.",
          validation: { isRequired: true },
        }),
        end: localDatetime({
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
        image: imageField("Optional. Ohne eigenes Bild nimmt die Karte eines passend zur Art des Abends."),
        imageAlt: fields.text({
          label: "Bildbeschreibung",
          description: "Für Screenreader und Google. Was ist auf dem Bild zu sehen?",
        }),
        featured: fields.checkbox({
          label: "Oben als große Karte zeigen",
          description:
            "Stellt den Abend im Posterformat über die anderen. Ohne eigenes Bild nimmt die Karte automatisch eines passend zur Art des Abends. Drei Karten sehen am besten aus.",
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
      columns: ["name", "category", "price", "featured"],
      schema: {
        name: fields.slug({
          name: {
            label: "Name",
            description: 'Ohne Klammerzusatz — der gehört ins Feld darunter.',
          },
        }),
        category: fields.select({
          label: "Abschnitt",
          description: "Bestimmt, unter welcher Überschrift das Getränk steht.",
          options: [...DRINK_CATEGORIES],
          defaultValue: "alkoholfrei",
        }),
        group: fields.select({
          label: "Zwischentitel",
          description:
            'Der kleine Titel innerhalb des Abschnitts, z. B. "Flaschenbier (33 cl)". "Ohne Zwischentitel" heißt: direkt unter der Abschnitts-Überschrift.',
          options: [...DRINK_GROUPS],
          defaultValue: "keine",
        }),
        ...priceGroup("Preis"),
        note: fields.text({
          label: "Zusatz",
          description:
            'Das Kleingedruckte hinter dem Namen: Volumenprozent, Größe oder Sorten — z. B. "4.8%", "5% / 25 cl", "Lemon / Peach". Ohne Klammern.',
        }),
        description: fields.text({
          label: "Zutaten oder Hinweis",
          multiline: true,
          description: 'Z. B. "Aperol, Prosecco, Mineral, Orange." Wird nur bei Getränken mit Bild angezeigt.',
        }),
        image: imageField("Nötig, wenn das Getränk auf der Startseite stehen soll."),
        imageAlt: fields.text({
          label: "Bildbeschreibung",
          description: "Für Screenreader und Google.",
        }),
        featured: fields.checkbox({
          label: "Auf der Startseite zeigen",
          description:
            "Steht dann als grosse Karte auf der Startseite. Braucht ein Bild — ohne eines wird das Getränk übersprungen. Drei Karten sehen am besten aus.",
          defaultValue: false,
        }),
        order: fields.number({
          label: "Reihenfolge",
          description: "Kleinere Zahl steht weiter oben, innerhalb des Abschnitts.",
          defaultValue: 0,
        }),
      },
    }),

    bottleService: collection({
      label: "Flaschenservice",
      path: "src/content/bottle-service/*",
      slugField: "name",
      format: { data: "yaml" },
      entryLayout: "form",
      columns: ["name", "price"],
      schema: {
        name: fields.slug({
          name: {
            label: "Stufe",
            description: 'Wie die Position auf der Karte steht, z. B. "Flasche Gin".',
          },
        }),
        description: fields.text({
          label: "Was enthalten ist",
          multiline: true,
          description:
            'Eine Zeile: die Sorten oder die Bedingung — z. B. "Gordon\'s, Bombay oder Hendrick\'s" oder "Ab 6 Personen ein Tisch".',
        }),
        ...priceGroup("Preis"),
        fromCHF: fields.number({
          label: "Startpreis in CHF",
          description:
            'Untergrenze der Stufe, ohne Währung — z. B. 120. Daraus rechnet die Seite das "Flaschen ab CHF 125.–" auf Startseite, Events und Reservation. Bei "Auf Anfrage" leer lassen.',
          validation: { isRequired: false },
        }),
        order: fields.number({
          label: "Reihenfolge",
          description: "Kleinere Zahl steht weiter oben.",
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
          name: { label: "Überschrift" },
        }),
        // Bestimmt, an welcher Stelle der Karte der Text erscheint. Früher
        // übernahm das der Dateiname, den Keystatic aus der Überschrift
        // bildet — eine umbenannte Überschrift ließ den Text verschwinden.
        section: fields.select({
          label: "Abschnitt",
          description: "An welcher Stelle der Getränkekarte dieser Text steht.",
          options: [...MENU_SECTIONS],
          defaultValue: "alkoholfrei",
        }),
        intro: fields.text({
          label: "Einleitung",
          multiline: true,
          description: 'Der Satz unter der Überschrift, z. B. "Alles 4 cl."',
        }),
        note: fields.text({
          label: "Fußnote",
          multiline: true,
          description: 'Die Zeile unter der Liste, z. B. "Zusätzliche Getränke / Mischgetränk: + CHF 3.–".',
        }),
        order: fields.number({ label: "Reihenfolge", defaultValue: 0 }),
      },
    }),

    gallery: collection({
      label: "Galerie",
      path: "src/content/gallery/*",
      slugField: "caption",
      format: { data: "yaml" },
      entryLayout: "form",
      columns: ["caption", "ratio", "homepage"],
      schema: {
        caption: fields.slug({
          name: {
            label: "Beschriftung",
            description:
              'Kurz, z. B. "Die Bar". Steht nicht unter dem Bild — sie beschriftet den Knopf und die Grossansicht.',
          },
        }),
        image: fields.image({
          label: "Bild",
          description: "Das Foto der Kachel.",
          directory: "src/assets/flamingo",
          publicPath: "../../assets/flamingo/",
          validation: { isRequired: true },
        }),
        // Pflicht: die Kachel ist ein Knopf, und ohne Beschreibung hoert ein
        // Screenreader an dieser Stelle nichts als "Grafik".
        alt: fields.text({
          label: "Bildbeschreibung",
          multiline: true,
          description:
            "Was ist auf dem Bild zu sehen? Für Screenreader und Google — nicht dasselbe wie die Beschriftung.",
          validation: { isRequired: true },
        }),
        ratio: fields.select({
          label: "Format",
          description:
            "Die Höhe der Kachel im Mosaik. Gemischte Formate lassen es dicht wirken; stehen alle auf quadratisch, sieht es aus wie eine Tabelle.",
          options: [...GALLERY_RATIOS],
          defaultValue: "quadrat",
        }),
        homepage: fields.checkbox({
          label: "Auch auf der Startseite zeigen",
          description:
            "Läuft dann im Bilderband auf der Startseite mit. Das Band zeigt Stimmung — vier bis sechs Bilder wirken am besten, alle elf machen es beliebig.",
          defaultValue: false,
        }),
        order: fields.number({
          label: "Reihenfolge",
          description: "Kleinere Zahl steht weiter oben.",
          defaultValue: 0,
        }),
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

    happyHour: singleton({
      label: "Happy Hour",
      path: "src/content/happy-hour",
      format: { data: "yaml" },
      schema: {
        // Der Wrapper-Schluessel muss bleiben: `content.config.ts` liest die
        // Datei mit Astros `file()`-Loader, der jeden Schluessel der obersten
        // Ebene als eigenen Eintrag nimmt.
        happyHour: fields.object(
          {
            // `isRequired`, weil `content.config.ts` beide als `z.string()`
            // fuehrt: ein geleertes Feld schreibt Keystatic gar nicht in die
            // Datei, und der Build braeche mit einem Zod-Fehler ab. Besser
            // haelt die Oberflaeche das Speichern an.
            day: fields.text({
              label: "Wochentag",
              description: 'Ausgeschrieben, z. B. "Donnerstag".',
              defaultValue: "Donnerstag",
              validation: { isRequired: true },
            }),
            time: fields.text({
              label: "Zeit",
              description: 'Wie es auf der Seite steht, z. B. "20 – 22 Uhr".',
              defaultValue: "20 – 22 Uhr",
              validation: { isRequired: true },
            }),
            note: fields.text({
              label: "Hinweis",
              multiline: true,
              description: 'Der Satz darunter, z. B. "Ausgewählte Drinks vergünstigt."',
            }),
          },
          { label: "Happy Hour" }
        ),
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
