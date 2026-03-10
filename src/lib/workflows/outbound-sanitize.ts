/**
 * Core-level outbound post text sanitizer.
 *
 * Goal: prevent internal-only disclaimer / drafting lines from ever being sent
 * to external platforms.
 *
 * This must be conservative: remove only well-known disclaimer patterns and
 * keep the actual intended post body intact.
 */
export function sanitizeOutboundPostText(input: string): string {
  const raw = String(input ?? '');
  if (!raw.trim()) return '';

  const lines = raw.split(/\r?\n/);

  const shouldDrop = (line: string) => {
    const l = line.trim();
    if (!l) return false;

    // Common internal-only disclaimers / guardrails we never want to ship.
    // Keep patterns strict-ish to avoid deleting legitimate content.
    if (/\bdraft\s*only\b/i.test(l)) return true;
    if (/\bdo\s+not\s+post\b/i.test(l)) return true;
    if (/\bdo\s+not\s+publish\b/i.test(l)) return true;
    if (/\bnot\s+for\s+posting\b/i.test(l)) return true;
    if (/\binternal\s+only\b/i.test(l)) return true;
    if (/\bneeds\s+approval\b/i.test(l)) return true;
    if (/\bapproval\s+required\b/i.test(l)) return true;

    return false;
  };

  const kept = lines.filter((l) => !shouldDrop(l));

  // Normalize whitespace after filtering.
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
