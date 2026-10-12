/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a, b) {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  
  const matrix = Array.from({ length: s1.length + 1 }, () => 
    new Array(s2.length + 1).fill(0)
  );

  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return matrix[s1.length][s2.length];
}

export function checkGuess(guess, secretWord) {
  if (!guess || !secretWord) return { isCorrect: false, isNearMiss: false, distance: 99 };
  
  const normGuess = guess.toLowerCase().trim();
  const normWord = secretWord.toLowerCase().trim();

  if (normGuess === normWord) {
    return { isCorrect: true, isNearMiss: false, distance: 0 };
  }

  const distance = levenshteinDistance(normGuess, normWord);
  
  // Near-miss threshold: distance <= 2 if word length >= 4, distance === 1 if word length === 3
  const isNearMiss = normWord.length >= 4 
    ? distance <= 2 
    : (normWord.length === 3 && distance === 1);

  return { isCorrect: false, isNearMiss, distance };
}

/**
 * Calculate score for a correct guess
 * Faster guesses earn more points (max ~1000, min ~500)
 */
export function calculateGuesserPoints(timeLeft, totalTime, guessRank = 0) {
  const ratio = Math.max(0, Math.min(1, timeLeft / totalTime));
  const base = 500;
  const timeBonus = Math.floor(ratio * 400);
  const rankBonus = Math.max(0, 100 - (guessRank * 25)); // 1st guesser +100, 2nd +75, etc.
  return base + timeBonus + rankBonus;
}

/**
 * Calculate drawer points based on how many players guessed
 */
export function calculateDrawerPoints(correctGuesserCount, totalGuessers) {
  if (totalGuessers <= 0 || correctGuesserCount <= 0) return 0;
  const ratio = correctGuesserCount / totalGuessers;
  return Math.floor(ratio * 600) + (correctGuesserCount * 50);
}

/**
 * Generate blanks representation with letter hints revealed over time
 * e.g. "APPLE" -> "_ _ _ _ _" -> "A _ _ _ _" -> "A _ _ L _"
 */
export function generateWordHint(secretWord, revealedIndices = new Set()) {
  return secretWord
    .split('')
    .map((char, index) => {
      if (char === ' ') return '  ';
      if (char === '-') return '-';
      return revealedIndices.has(index) ? char : '_';
    })
    .join(' ');
}
