const LETTER = /\p{L}/u;

function firstLetter(text: string): { index: number; char: string } | null {
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (LETTER.test(char)) return { index: i, char };
  }
  return null;
}

function applyCaseFromSource(sourceChar: string, targetChar: string): string {
  if (
    sourceChar === sourceChar.toUpperCase() &&
    sourceChar !== sourceChar.toLowerCase()
  ) {
    return targetChar.toUpperCase();
  }
  if (
    sourceChar === sourceChar.toLowerCase() &&
    sourceChar !== sourceChar.toUpperCase()
  ) {
    return targetChar.toLowerCase();
  }
  return targetChar;
}

/** Mirrors the source segment's leading letter case on the translated text. */
export function matchTranslationCapitalization(
  sourceSegment: string,
  translatedText: string,
): string {
  if (!translatedText) return translatedText;

  const sourceLetter = firstLetter(sourceSegment);
  const targetLetter = firstLetter(translatedText);
  if (!sourceLetter || !targetLetter) return translatedText;

  const adjusted = applyCaseFromSource(sourceLetter.char, targetLetter.char);
  if (adjusted === targetLetter.char) return translatedText;

  return (
    translatedText.slice(0, targetLetter.index) +
    adjusted +
    translatedText.slice(targetLetter.index + 1)
  );
}
