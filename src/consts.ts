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
