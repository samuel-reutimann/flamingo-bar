/**
 * Prüft jeden `<style>`-Block und jede `.css`-Datei auf unbalancierte
 * Klammern und leere At-Regeln.
 *
 * Astro und Vite melden so etwas nicht: eine Regel ohne schließende Klammer
 * ist gültiges CSS, sie verschluckt nur alles danach als verschachtelten
 * Inhalt. Genau das ist passiert — eine halb gelöschte
 * `@media`-Regel in `index.astro` hat den Hero-Verlauf, die Galerie-Laufschrift
 * und zwei ganze Abschnitte stillgelegt, während `astro check` und der Build
 * sauber durchliefen.
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const files = [
  ...globSync("src/**/*.astro"),
  ...globSync("src/**/*.css"),
].sort();

/** Kommentare raus, damit geschweifte Klammern darin nicht mitzählen. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const problems = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const blocks = [];

  if (file.endsWith(".css")) {
    blocks.push({ line: 1, css: text });
  } else {
    const re = /<style[^>]*>/g;
    let m;
    while ((m = re.exec(text))) {
      const end = text.indexOf("</style>", m.index);
      if (end === -1) continue;
      blocks.push({
        line: text.slice(0, m.index + m[0].length).split("\n").length,
        css: text.slice(m.index + m[0].length, end),
      });
    }
  }

  for (const { line, css: raw } of blocks) {
    const css = stripComments(raw);
    let depth = 0;
    const lines = css.split("\n");
    for (let i = 0; i < lines.length; i++) {
      depth += (lines[i].match(/\{/g) ?? []).length;
      depth -= (lines[i].match(/\}/g) ?? []).length;
      if (depth < 0) {
        problems.push(`${file}:${line + i}  eine '}' zu viel`);
        break;
      }
    }
    if (depth > 0) {
      problems.push(`${file}:${line}  ${depth} Regel(n) nie geschlossen`);
    }
    for (const m of css.matchAll(/@[\w-]+[^{;]*\{\s*\}/g)) {
      const at = line + css.slice(0, m.index).split("\n").length - 1;
      problems.push(`${file}:${at}  leere At-Regel: ${m[0].replace(/\s+/g, " ").slice(0, 60)}`);
    }
  }
}

if (problems.length) {
  console.error("CSS-Prüfung fehlgeschlagen:\n" + problems.map((p) => "  " + p).join("\n"));
  process.exit(1);
}
console.log(`CSS ok — ${files.length} Dateien geprüft.`);
