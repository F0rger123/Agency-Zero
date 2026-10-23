/**
 * Turns what the speech recogniser hears into clean text: spoken punctuation ("period", "comma", "question mark"),
 * "new line" / "new paragraph", "scratch that" to take back the last sentence, sentence capitalisation, a lone "i"
 * becoming "I", and sensible spacing. Pure, so it is easy to test.
 */

const FILLERS = /\b(?:u+m+|u+h+m*|e+r+m*|h+m+|m+h+m+)\b[,.]?\s*/gi;
/** Words people stumble on when talking fast ("the the", "I I", "to to"): a straight repeat is dropped. */
const STUTTER = new Set(["a", "an", "the", "i", "to", "and", "but", "of", "in", "on", "it", "is", "we", "you", "so", "that", "for", "with", "my", "our", "was", "at", "if", "or", "this", "they", "he", "she", "be", "do"]);

/**
 * Takes the "um"s and "uh"s out and collapses stumbles like "the the". Safe to run on anything: it only removes filler
 * sounds and immediate repeats of small common words, never anything else.
 */
export function cleanSpeech(text: string): string {
  const withoutFillers = text.replace(FILLERS, " ");
  const words = withoutFillers.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const word of words) {
    const previous = out[out.length - 1];
    const bare = word.toLowerCase().replace(/[^a-z']/g, "");
    if (previous && bare && STUTTER.has(bare) && previous.toLowerCase().replace(/[^a-z']/g, "") === bare && !/[.!?,;:]$/.test(previous)) continue;
    out.push(word);
  }
  return out.join(" ");
}

/** "Tidy up" for text that is already in a box: spoken-style cleanup, spacing, capitals, and a full stop at the end. */
export function tidyText(text: string): string {
  const lines = text.split("\n").map((line) => {
    const cleaned = cleanSpeech(line).replace(/\s+([,.!?;:])/g, "$1").replace(/\s{2,}/g, " ").trim();
    if (!cleaned) return "";
    const capitalised = cleaned.replace(/(^|[.!?]\s+)([a-z])/g, (_, lead: string, letter: string) => lead + letter.toUpperCase()).replace(/\bi\b/g, "I");
    return /[.!?:)"”]$/.test(capitalised) || capitalised.length < 4 ? capitalised : `${capitalised}.`;
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

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
  let rest = cleanSpeech(phrase).trim();
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
