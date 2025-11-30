/**
 * Validates a student answer against correct answer and alternatives.
 * Returns true if answer is correct (case-insensitive, trimmed).
 */
export function validateAnswer(
  studentAnswer: string,
  correctAnswer: string,
  alternativeAnswers: string[] = [],
): boolean {
  const normalize = (str: string) => str.trim().toLowerCase();

  const student = normalize(studentAnswer);
  const correct = normalize(correctAnswer);
  const alternatives = alternativeAnswers.map(normalize);

  return student === correct || alternatives.includes(student);
}
