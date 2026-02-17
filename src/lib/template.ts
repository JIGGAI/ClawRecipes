/**
 * Tiny, safe template renderer: replaces {{key}} with vars[key].
 * No conditionals, no eval.
 */
export function renderTemplate(raw: string, vars: Record<string, string>): string {
  return raw.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key) => {
    const v = vars[key];
    return typeof v === "string" ? v : "";
  });
}
