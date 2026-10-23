import { describe, expect, it } from "vitest";
import { applyDictation, cleanSpeech, removeLastPhrase, tidyText } from "./dictation-text";

describe("applyDictation", () => {
  it("starts with a capital and joins with spaces", () => {
    expect(applyDictation("", "call the bakery")).toBe("Call the bakery");
    expect(applyDictation("Call the bakery", "about the invoice")).toBe("Call the bakery about the invoice");
  });
  it("turns spoken punctuation into marks", () => {
    expect(applyDictation("", "send the quote period then call them comma ok question mark")).toBe("Send the quote. Then call them, ok? ");
  });
  it("capitalises after a sentence end and fixes lone i", () => {
    expect(applyDictation("Done. ", "i think i'm finished")).toBe("Done. I think I'm finished");
  });
  it("handles new lines and paragraphs", () => {
    expect(applyDictation("First item", "new line second item")).toBe("First item\nSecond item");
    expect(applyDictation("Intro.", "new paragraph more")).toBe("Intro.\n\nMore");
  });
  it("takes back the last sentence with scratch that", () => {
    expect(applyDictation("Keep this. Remove this", "scratch that")).toBe("Keep this. ");
    expect(applyDictation("Only sentence", "scratch that")).toBe("");
    expect(applyDictation("Keep this. Remove this", "scratch that better one")).toBe("Keep this. Better one");
  });
});

describe("removeLastPhrase", () => {
  it("removes back to the previous sentence or line", () => {
    expect(removeLastPhrase("One. Two. Three.")).toBe("One. Two. ");
    expect(removeLastPhrase("line one\nline two")).toBe("line one\n");
    expect(removeLastPhrase("")).toBe("");
  });
});

describe("cleanup", () => {
  it("drops filler sounds and stumbles", () => {
    expect(cleanSpeech("um so the the invoice uh is is ready")).toBe("so the invoice is ready");
    expect(cleanSpeech("I I think we we should")).toBe("I think we should");
    expect(cleanSpeech("had had a very very good day")).toBe("had had a very very good day");
  });
  it("cleans while dictating", () => {
    expect(applyDictation("", "um call the the bakery")).toBe("Call the bakery");
  });
  it("tidies a whole box of text", () => {
    expect(tidyText("um send the the quote  \n call dana , ok")).toBe("Send the quote.\nCall dana, ok.");
    expect(tidyText("")).toBe("");
  });
});
