import { describe, expect, it } from "vitest";

import { xmlToJSON } from "./from-xml";

describe("xmlToJSON", () => {
  describe("basic structure", () => {
    it("parses lesson root element", () => {
      const result = xmlToJSON("<lesson><p>Hello</p></lesson>");
      expect(result.type).toBe("doc");
      expect(result.content).toHaveLength(1);
    });

    it("throws on non-lesson root", () => {
      expect(() => xmlToJSON("<document><p>Hello</p></document>")).toThrow(
        "Expected <lesson> root element",
      );
    });

    it("throws on invalid XML", () => {
      expect(() => xmlToJSON("<lesson><p>Unclosed")).toThrow("Invalid XML");
    });
  });

  describe("headings", () => {
    it("parses h1", () => {
      const result = xmlToJSON("<lesson><h1>Title</h1></lesson>");
      expect(result.content?.[0]).toEqual({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Title" }],
      });
    });

    it("parses h2", () => {
      const result = xmlToJSON("<lesson><h2>Subtitle</h2></lesson>");
      expect(result.content?.[0]?.attrs).toEqual({ level: 2 });
    });

    it("parses h3", () => {
      const result = xmlToJSON("<lesson><h3>Section</h3></lesson>");
      expect(result.content?.[0]?.attrs).toEqual({ level: 3 });
    });
  });

  describe("paragraphs", () => {
    it("parses simple paragraph", () => {
      const result = xmlToJSON("<lesson><p>Hello world</p></lesson>");
      expect(result.content?.[0]).toEqual({
        type: "paragraph",
        content: [{ type: "text", text: "Hello world" }],
      });
    });

    it("parses empty paragraph", () => {
      const result = xmlToJSON("<lesson><p></p></lesson>");
      expect(result.content?.[0]).toEqual({
        type: "paragraph",
        content: undefined,
      });
    });
  });

  describe("inline marks", () => {
    it("parses bold", () => {
      const result = xmlToJSON("<lesson><p><b>bold</b></p></lesson>");
      expect(result.content?.[0]?.content?.[0]).toEqual({
        type: "text",
        text: "bold",
        marks: [{ type: "bold" }],
      });
    });

    it("parses italic", () => {
      const result = xmlToJSON("<lesson><p><i>italic</i></p></lesson>");
      expect(result.content?.[0]?.content?.[0]).toEqual({
        type: "text",
        text: "italic",
        marks: [{ type: "italic" }],
      });
    });

    it("parses nested marks", () => {
      const result = xmlToJSON("<lesson><p><b><i>both</i></b></p></lesson>");
      const textNode = result.content?.[0]?.content?.[0];
      expect(textNode?.text).toBe("both");
      expect(textNode?.marks).toContainEqual({ type: "bold" });
      expect(textNode?.marks).toContainEqual({ type: "italic" });
    });

    it("parses mixed content with marks", () => {
      const result = xmlToJSON("<lesson><p>Hello <b>world</b>!</p></lesson>");
      const content = result.content?.[0]?.content;
      expect(content).toHaveLength(3);
      expect(content?.[0]).toEqual({ type: "text", text: "Hello " });
      expect(content?.[1]).toEqual({
        type: "text",
        text: "world",
        marks: [{ type: "bold" }],
      });
      expect(content?.[2]).toEqual({ type: "text", text: "!" });
    });
  });

  describe("lists", () => {
    it("parses bullet list", () => {
      const result = xmlToJSON(
        "<lesson><ul><li><p>Item</p></li></ul></lesson>",
      );
      expect(result.content?.[0]?.type).toBe("bulletList");
      expect(result.content?.[0]?.content?.[0]?.type).toBe("listItem");
    });

    it("parses ordered list", () => {
      const result = xmlToJSON(
        "<lesson><ol><li><p>First</p></li></ol></lesson>",
      );
      expect(result.content?.[0]?.type).toBe("orderedList");
    });

    it("parses ordered list with start attribute", () => {
      const result = xmlToJSON(
        '<lesson><ol start="5"><li><p>Item</p></li></ol></lesson>',
      );
      expect(result.content?.[0]?.attrs).toEqual({ start: 5 });
    });
  });

  describe("blockquote", () => {
    it("parses blockquote", () => {
      const result = xmlToJSON(
        "<lesson><blockquote><p>Quote</p></blockquote></lesson>",
      );
      expect(result.content?.[0]?.type).toBe("blockquote");
    });
  });

  describe("horizontal rule", () => {
    it("parses hr", () => {
      const result = xmlToJSON("<lesson><hr /></lesson>");
      expect(result.content?.[0]).toEqual({ type: "horizontalRule" });
    });
  });

  describe("hard break", () => {
    it("parses br in paragraph", () => {
      const result = xmlToJSON("<lesson><p>Line 1<br />Line 2</p></lesson>");
      const content = result.content?.[0]?.content;
      expect(content?.[1]).toEqual({ type: "hardBreak" });
    });
  });

  describe("exercise", () => {
    it("parses exercise with id", () => {
      const result = xmlToJSON(
        '<lesson><exercise id="ex-123"><p>Content</p></exercise></lesson>',
      );
      expect(result.content?.[0]).toEqual({
        type: "exercise",
        attrs: { id: "ex-123" },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Content" }],
          },
        ],
      });
    });

    it("parses exercise without id", () => {
      const result = xmlToJSON(
        "<lesson><exercise><p>Content</p></exercise></lesson>",
      );
      expect(result.content?.[0]?.attrs).toEqual({ id: null });
    });
  });

  describe("blank", () => {
    it("parses blank with answer only", () => {
      const result = xmlToJSON(
        '<lesson><p>She <blank answer="goes" /> to school.</p></lesson>',
      );
      const content = result.content?.[0]?.content;
      expect(content?.[1]).toEqual({
        type: "blank",
        attrs: {
          correctAnswer: "goes",
          alternativeAnswers: [],
          hint: null,
          studentAnswer: "",
        },
      });
    });

    it("parses blank with all attributes", () => {
      const result = xmlToJSON(
        '<lesson><p><blank answer="went" alts="had gone,was going" hint="past tense" student-answer="goed" /></p></lesson>',
      );
      const blank = result.content?.[0]?.content?.[0];
      expect(blank).toEqual({
        type: "blank",
        attrs: {
          correctAnswer: "went",
          alternativeAnswers: ["had gone", "was going"],
          hint: "past tense",
          studentAnswer: "goed",
        },
      });
    });
  });

  describe("noteBlock", () => {
    it("parses note", () => {
      const result = xmlToJSON(
        "<lesson><note><p>Teacher note</p></note></lesson>",
      );
      expect(result.content?.[0]).toEqual({
        type: "noteBlock",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Teacher note" }],
          },
        ],
      });
    });
  });

  describe("writingArea", () => {
    it("parses writing-area with attributes", () => {
      const result = xmlToJSON(
        '<lesson><writing-area id="wa-1" lines="8" placeholder="Write here..."><p></p></writing-area></lesson>',
      );
      expect(result.content?.[0]).toEqual({
        type: "writingArea",
        attrs: {
          id: "wa-1",
          lines: 8,
          placeholder: "Write here...",
        },
        content: [{ type: "paragraph", content: undefined }],
      });
    });

    it("uses defaults for missing attributes", () => {
      const result = xmlToJSON(
        "<lesson><writing-area><p></p></writing-area></lesson>",
      );
      expect(result.content?.[0]?.attrs).toEqual({
        id: "",
        lines: 5,
        placeholder: "Write your answer here...",
      });
    });
  });

  describe("group", () => {
    it("parses group with id", () => {
      const result = xmlToJSON(
        '<lesson><group id="grp-1"><p>Grouped</p></group></lesson>',
      );
      expect(result.content?.[0]).toEqual({
        type: "group",
        attrs: { id: "grp-1" },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Grouped" }],
          },
        ],
      });
    });

    it("parses group without id", () => {
      const result = xmlToJSON(
        "<lesson><group><p>Content</p></group></lesson>",
      );
      expect(result.content?.[0]?.attrs).toEqual({ id: null });
    });
  });

  describe("special characters", () => {
    it("unescapes XML entities", () => {
      const result = xmlToJSON(
        "<lesson><p>a &lt; b &amp; c &gt; d</p></lesson>",
      );
      expect(result.content?.[0]?.content?.[0]?.text).toBe("a < b & c > d");
    });

    it("unescapes quotes", () => {
      const result = xmlToJSON(
        "<lesson><p>Say &quot;hello&quot; and &apos;goodbye&apos;</p></lesson>",
      );
      expect(result.content?.[0]?.content?.[0]?.text).toBe(
        "Say \"hello\" and 'goodbye'",
      );
    });
  });

  describe("unknown tags", () => {
    it("throws on unknown tag", () => {
      expect(() =>
        xmlToJSON("<lesson><unknown>Content</unknown></lesson>"),
      ).toThrow("Unknown XML tag: <unknown>");
    });
  });

  describe("complex document", () => {
    it("parses a complete lesson structure", () => {
      const xml = `<lesson>
        <h1>Past Tense Verbs</h1>
        <p>Learn about past tense.</p>
        <exercise id="ex-1">
          <p>She <blank answer="went" student-answer="" /> to the store.</p>
        </exercise>
        <hr />
        <p><b>Remember:</b> Practice makes perfect!</p>
      </lesson>`;

      const result = xmlToJSON(xml);

      expect(result.type).toBe("doc");
      expect(result.content).toHaveLength(5);

      // Heading
      expect(result.content?.[0]?.type).toBe("heading");
      expect(result.content?.[0]?.attrs?.level).toBe(1);

      // Intro paragraph
      expect(result.content?.[1]?.type).toBe("paragraph");

      // Exercise
      expect(result.content?.[2]?.type).toBe("exercise");
      expect(result.content?.[2]?.attrs?.id).toBe("ex-1");

      // Check blank inside exercise
      const exerciseContent = result.content?.[2]?.content?.[0];
      expect(exerciseContent?.type).toBe("paragraph");
      expect(exerciseContent?.content?.[1]?.type).toBe("blank");

      // HR
      expect(result.content?.[3]?.type).toBe("horizontalRule");

      // Final paragraph with bold
      expect(result.content?.[4]?.type).toBe("paragraph");
    });
  });
});
