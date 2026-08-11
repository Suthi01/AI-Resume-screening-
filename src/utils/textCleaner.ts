// src/utils/textCleaner.ts
/**
 * Text cleaning utility used in the ingestion pipeline to normalize extracted content.
 * Cleans content by:
 * - Normalizing line breaks (CRLF -> LF)
 * - Removing unwanted symbols (non-printable control chars, etc.)
 * - Removing duplicate/multiple spaces
 * - Removing completely blank lines
 */
export function cleanText(text: string): string {
  if (!text) return '';

  // Normalize Unicode dashes (em-dash, en-dash, etc.) to standard ASCII hyphen before cleaning
  let cleaned = text.replace(/[\u2010-\u2015\u2212]/g, '-');

  // 1. Normalize line breaks (replace \r\n with \n)
  cleaned = cleaned.replace(/\r\n/g, '\n');

  // 2. Remove unwanted control characters (keep standard ASCII printable characters, newlines, and tabs)
  cleaned = cleaned.replace(/[^\x20-\x7E\n\t]/g, '');

  // 3. Normalize duplicate spaces on each line
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // 4. Split by line, trim line contents, remove empty lines, and rejoin with a single newline
  cleaned = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  return cleaned;
}
