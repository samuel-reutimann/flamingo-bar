// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import keystatic from "@keystatic/astro";
import { SITE_URL } from "./src/consts.ts";
import { isNoindexRoute } from "./src/utils/seo.ts";

export default defineConfig({
  site: SITE_URL,

  // `trailingSlash` steht bewusst auf dem Standard ("ignore").
  //
  // Der Build legt jede Seite als `<route>/index.html` ab, und Cloudflares
  // Asset-Router beantwortet `/kontakt` mit einer 307 auf `/kontakt/`.
  // Interne Links, Canonicals und Structured Data nennen deshalb überall die
  // Form mit Schrägstrich — damit entsteht die Weiterleitung gar nicht erst.
  //
  // `trailingSlash: "always"` wäre der naheliegende Riegel dafür, gilt aber
  // auch für die API-Routen, die Keystatic einhängt: `/api/keystatic/…`
  // bekäme dann eine 301, und die Schreibvorgänge der Redaktion liefen über
  // eine Weiterleitung. Nicht wert.

  // Keystatic's admin UI (`/keystatic`) and its API routes run server-side, so
  // the project needs an adapter. Every content page stays prerendered — only
  // the routes Keystatic injects are rendered on demand, which is why
  // `wrangler.jsonc` now points at a Worker instead of serving `dist` flat.
  adapter: cloudflare({ imageService: "compile" }),

  integrations: [
    // React is only here because the Keystatic admin UI is a React app. No
    // page component uses it.
    react(),
    keystatic(),
    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);
        // The editor is not public content.
        if (pathname.startsWith("/keystatic")) return false;
        return !isNoindexRoute(pathname);
      },
    }),
  ],
});
