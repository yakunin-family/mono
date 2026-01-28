import simplePararaph from "./simple-paragraph.json" assert { type: "json" };
import vocabularyText from "./vocabulary-text.json" assert { type: "json" };
import grammarText from "./grammar-text.json" assert { type: "json" };
import complexDocument from "./complex-document.json" assert { type: "json" };
import emptyDocument from "./empty-document.json" assert { type: "json" };

export const fixtures = {
  simplePararaph,
  vocabularyText,
  grammarText,
  complexDocument,
  emptyDocument,
} as const;

export type FixtureName = keyof typeof fixtures;
