/**
 * Das Bild eines Termins — gepflegt oder zurückgefallen.
 *
 * Die Event-Karten sind `cover`-Karten: das Bild füllt die Karte, der Text
 * liegt darauf, und `Card.astro` legt dafür einen Gradient-Overlay darüber.
 * Der Overlay hängt aber am Bild (`{hasImage && …}`) — ein Termin ohne Bild
 * bekäme also weder Bild noch Overlay und fiele still auf eine Textkarte
 * zurück. Genau das war der Zustand: alle kommenden Termine ohne Bild.
 *
 * Statt in Keystatic ein Pflichtfeld daraus zu machen (der Betrieb pflegt
 * Termine im Minutentakt, ein Bildzwang bliebe liegen), fällt die Karte auf
 * ein Bild je Art des Abends zurück. `tag` ist in Keystatic bereits Pflicht
 * und hat einen Standardwert, kann also nie fehlen.
 */
import type { EVENT_TAGS } from "../content.config.ts";

import djImage from "../assets/flamingo/event-dj-mixer.jpeg";
import liveImage from "../assets/flamingo/event-live-session.jpeg";
import partyImage from "../assets/flamingo/event-crowd-dancing.jpeg";
import sportImage from "../assets/flamingo/bar-guests-night.jpeg";
import specialImage from "../assets/flamingo/mood-neon-glasses.jpeg";

type EventTag = (typeof EVENT_TAGS)[number];

/** Ein Rückfallbild je Art des Abends. Jeder Tag aus `options.ts` steht hier. */
const TAG_IMAGE: Record<EventTag, ImageMetadata> = {
  "DJ-Abend": djImage,
  "Live-Musik": liveImage,
  "Motto-Party": partyImage,
  Sport: sportImage,
  Special: specialImage,
};

type EventData = {
  tag: EventTag;
  image?: ImageMetadata;
  imageAlt?: string;
};

/**
 * Bild und Bildbeschreibung für eine Event-Karte.
 *
 * `alt` bleibt beim Rückfallbild leer: es zeigt nicht diesen Abend, sondern
 * die Art des Abends. Eine Beschreibung, die so tut, als sei es ein Foto des
 * Termins, wäre für Screenreader schlechter als keine — der Titel steht als
 * Überschrift ohnehin daneben.
 */
export function eventImage(data: EventData) {
  return data.image
    ? { image: data.image, imageAlt: data.imageAlt }
    : { image: TAG_IMAGE[data.tag], imageAlt: undefined };
}
