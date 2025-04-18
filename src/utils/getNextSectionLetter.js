/**
 * Returns the next alphabet letter for naming a new section.
 * If no sections exist, returns "A".
 * If there's at least one, finds the highest letter and returns the next letter.
 */
export const getNextSectionLetter = ({ sections }) => {
  if (!sections || sections.length === 0) return "A";
  const letters = sections
    .map((sec) => sec.name.trim().toUpperCase())
    .filter((name) => /^[A-Z]$/.test(name));
  if (letters.length === 0) return "A";
  const maxLetter = letters.reduce((prev, curr) =>
    curr.charCodeAt(0) > prev.charCodeAt(0) ? curr : prev
  );
  const nextCharCode = maxLetter.charCodeAt(0) + 1;
  if (nextCharCode > "Z".charCodeAt(0)) return "A";
  return String.fromCharCode(nextCharCode);
};
