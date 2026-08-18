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
