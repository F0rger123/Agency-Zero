/**
 * Turns what the speech recogniser hears into clean text: spoken punctuation ("period", "comma", "question mark"),
 * "new line" / "new paragraph", "scratch that" to take back the last sentence, sentence capitalisation, a lone "i"
 * becoming "I", and sensible spacing. Pure, so it is easy to test.
 */

type Token = { kind: "word"; text: string } | { kind: "mark"; text: string } | { kind: "break"; text: string } | { kind: "undo" };

const MARKS: [RegExp, string][] = [
  [/^(period|full stop)\b/, "."],
  [/^comma\b/, ","],
  [/^question mark\b/, "?"],
  [/^(exclamation point|exclamation mark)\b/, "!"],
  [/^colon\b/, ":"],
  [/^semicolon\b/, ";"],
];
const BREAKS: [RegExp, string][] = [
  [/^new paragraph\b/, "\n\n"],
  [/^(new line|next line)\b/, "\n"],
];
const UNDO = /^(scratch that|delete that|undo that)\b/;

function tokenize(phrase: string): Token[] {
  const tokens: Token[] = [];
  let rest = phrase.trim();
  while (rest) {
    const lower = rest.toLowerCase();
    let matched = false;
    if (UNDO.test(lower)) {
      tokens.push({ kind: "undo" });
      rest = rest.slice((lower.match(UNDO) as RegExpMatchArray)[0].length).trim();
      continue;
    }
    for (const [pattern, text] of BREAKS) {
      const hit = lower.match(pattern);
      if (hit) {
        tokens.push({ kind: "break", text });
        rest = rest.slice(hit[0].length).trim();
        matched = true;
        break;
      }
    }
    if (matched) continue;
    for (const [pattern, text] of MARKS) {
      const hit = lower.match(pattern);
      if (hit) {
        tokens.push({ kind: "mark", text });
        rest = rest.slice(hit[0].length).trim();
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const word = rest.match(/^\S+/) as RegExpMatchArray;
    tokens.push({ kind: "word", text: word[0] });
    rest = rest.slice(word[0].length).trim();
  }
  return tokens;
}

/** Removes the last sentence (or the last line) so "scratch that" takes back what was just said. */
export function removeLastPhrase(text: string): string {
  const trimmed = text.replace(/\s+$/, "");
  if (!trimmed) return "";
  const body = trimmed.replace(/[.!?]+$/, "");
  const cut = Math.max(body.lastIndexOf(". "), body.lastIndexOf("! "), body.lastIndexOf("? "), body.lastIndexOf("\n"));
  if (cut < 0) return "";
  return trimmed.slice(0, cut + 1) + (trimmed[cut] === "\n" ? "" : " ");
}

const needsCapital = (text: string) => text === "" || /(^|[.!?]\s+|\n)$/.test(text);

function tidyWord(word: string): string {
  if (/^i$/i.test(word)) return "I";
  if (/^i['’](m|ll|ve|d)$/i.test(word)) return `I${word.slice(1)}`;
  return word;
}

/** Adds one heard phrase to existing text. */
export function applyDictation(current: string, phrase: string): string {
  let text = current;
  for (const token of tokenize(phrase)) {
    if (token.kind === "undo") {
      text = removeLastPhrase(text);
    } else if (token.kind === "break") {
      text = text.replace(/[ \t]+$/, "") + token.text;
    } else if (token.kind === "mark") {
      text = text.replace(/\s+$/, "") + token.text + " ";
    } else {
      const word = tidyWord(token.text);
      const joined = text === "" || /\s$/.test(text) ? text : `${text} `;
      const capital = needsCapital(joined);
      text = joined + (capital ? word.charAt(0).toUpperCase() + word.slice(1) : word);
    }
  }
  return text;
}
