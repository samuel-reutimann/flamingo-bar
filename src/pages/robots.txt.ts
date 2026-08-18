import type { APIRoute } from "astro";
import { SITE_URL } from "@/consts.ts";

/**
 * Serverseitig statt vorgerendert, damit der Host der Anfrage bekannt ist.
 *
 * Der Worker läuft unter mehreren Namen — der Produktionsdomain, der
 * Staging-Domain `flamingo.resa.dev` und der `*.workers.dev`-Adresse. Unter
 * jedem davon lag dasselbe `Allow: /`, die halbfertige Seite stand also
 * genauso zum Indexieren bereit wie die echte. Zwei Hosts mit identischem
 * Inhalt teilen sich in der Suche zudem die Signale, die einer allein
 * bekommen sollte.
 */
export const prerender = false;

/** Der Host, unter dem die Seite öffentlich sein soll. */
const PRODUCTION_HOST = new URL(SITE_URL).host.replace(/^www\./, "");

export const GET: APIRoute = ({ request, site }) => {
  /* `www.` zählt mit: beide zeigen auf dieselbe Seite, und welche Variante
     kanonisch ist, entscheidet `SITE_URL` über das Canonical-Tag. */
  const host = new URL(request.url).host.replace(/^www\./, "");
  const isProduction = host === PRODUCTION_HOST;

  const lines = isProduction
    ? [
        "User-agent: *",
        "Allow: /",
        /* Die Redaktion ist erreichbar, aber kein Suchergebnis. Sie steht
           nicht in der Sitemap; ohne diese Zeile bliebe sie trotzdem
           crawlbar, weil sie serverseitig mit 200 antwortet. */
        "Disallow: /keystatic",
        "",
        `Sitemap: ${new URL("sitemap-index.xml", site ?? SITE_URL).href}`,
      ]
    : ["# Staging — nicht indexieren.", "User-agent: *", "Disallow: /"];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Ohne `Vary` könnte Staging eine gecachte Produktionsantwort bekommen.
      Vary: "Host",
      ...(isProduction ? {} : { "X-Robots-Tag": "noindex, nofollow" }),
    },
  });
};
