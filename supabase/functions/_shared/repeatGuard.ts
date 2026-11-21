// Repeat Guard: Normalizes question text and prevents question repeats via token overlap similarity
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes token overlap similarity coefficient between two strings.
 * Returns a number between 0.0 (no overlap) and 1.0 (identical token set).
 */
export function computeTokenOverlapSimilarity(textA: string, textB: string): number {
  const normA = normalizeQuestionText(textA);
  const normB = normalizeQuestionText(textB);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  // Filter out common short noise words (stop-words < 3 chars)
  const tokensA = new Set(normA.split(' ').filter((t) => t.length > 2));
  const tokensB = new Set(normB.split(' ').filter((t) => t.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    }
  }

  // Overlap coefficient relative to the smaller token set (catches paraphrases and inclusions)
  return intersection / Math.min(tokensA.size, tokensB.size);
}

/**
 * Checks if a candidate question text is a repeat of any previously asked question.
 */
export function isRepeatOfAskedQuestions(
  candidateText: string,
  askedTextsNormalized: string[],
  threshold = 0.65
): boolean {
  if (!candidateText || !askedTextsNormalized || askedTextsNormalized.length === 0) {
    return false;
  }

  const normCandidate = normalizeQuestionText(candidateText);

  for (const askedNorm of askedTextsNormalized) {
    if (!askedNorm) continue;
    if (normCandidate === askedNorm) {
      return true;
    }
    const similarity = computeTokenOverlapSimilarity(candidateText, askedNorm);
    if (similarity >= threshold) {
      return true;
    }
  }

  return false;
}
