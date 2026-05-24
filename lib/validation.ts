// Shared input validation helpers.
// We use these to stop low-effort answers like "." or "ok" sneaking in.

export type ValidationResult = { ok: true } | { ok: false; reason: string };

/**
 * Check that text contains at least N meaningful words, total min chars,
 * and isn't just punctuation/symbols.
 */
export function validateMeaningful(
  text: string | null | undefined,
  opts?: { minChars?: number; minWords?: number; label?: string }
): ValidationResult {
  const { minChars = 5, minWords = 2, label = "Answer" } = opts ?? {};
  const t = (text ?? "").trim();

  if (t.length === 0) return { ok: false, reason: `${label} can't be empty.` };

  // Must contain at least one letter or digit
  if (!/[\p{L}\p{N}]/u.test(t)) {
    return { ok: false, reason: `${label} needs real content, not just symbols.` };
  }

  if (t.length < minChars) {
    return { ok: false, reason: `${label} is too short — write at least ${minChars} characters.` };
  }

  // Split into words ≥ 2 chars (filters out single-letter "words" like "i")
  const words = t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w) && w.length >= 2);
  if (words.length < minWords) {
    return { ok: false, reason: `${label} needs at least ${minWords} words.` };
  }

  return { ok: true };
}

/**
 * Per-prompt minimum content rules. Light prompts accept short answers
 * ("home" for "What anchors you?"). Medium need a sentence. Heavy expect
 * a thought-out paragraph. The bucket is inferred from which array the
 * question lives in inside `promptLibrary` (lib/mock-data.ts).
 */
export function getPromptValidationRule(
  question: string,
  library: { light: string[]; medium: string[]; heavy: string[] }
): { minChars: number; minWords: number } {
  if (library.heavy.includes(question))  return { minChars: 30, minWords: 5 };
  if (library.medium.includes(question)) return { minChars: 12, minWords: 2 };
  // light or unknown — accept short single-word answers
  return { minChars: 4, minWords: 1 };
}

/** Best for short fields like alias or custom language: 2–N chars, contains letter/digit. */
export function validateShortLabel(
  text: string | null | undefined,
  opts?: { min?: number; max?: number; label?: string }
): ValidationResult {
  const { min = 2, max = 40, label = "Value" } = opts ?? {};
  const t = (text ?? "").trim();
  if (t.length < min) return { ok: false, reason: `${label} must be at least ${min} characters.` };
  if (t.length > max) return { ok: false, reason: `${label} must be at most ${max} characters.` };
  if (!/[\p{L}\p{N}]/u.test(t)) return { ok: false, reason: `${label} needs at least one letter or number.` };
  return { ok: true };
}
