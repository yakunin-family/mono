import { describe, expect, it } from "vitest";

import { jsonToXML } from "./to-xml";

describe("jsonToXML", () => {
  describe("basic structure", () => {
    it("wraps content in lesson tag", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Hello" }],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe("<lesson><p>Hello</p></lesson>");
    });

    it("pretty prints with indentation", () => {
      const result = jsonToXML({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello" }],
          },
        ],
      });
      expect(result).toBe("<lesson>\n  <p>Hello</p>\n</lesson>");
    });
  });

  describe("headings", () => {
    it("serializes h1", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Title" }],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe("<lesson><h1>Title</h1></lesson>");
    });

    it("serializes h2 and h3", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Subtitle" }],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Section" }],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe("<lesson><h2>Subtitle</h2><h3>Section</h3></lesson>");
    });
  });

  describe("paragraphs with marks", () => {
    it("serializes paragraph with bold", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Hello " },
                { type: "text", text: "world", marks: [{ type: "bold" }] },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe("<lesson><p>Hello <b>world</b></p></lesson>");
    });

    it("serializes nested marks", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "both",
                  marks: [{ type: "bold" }, { type: "italic" }],
                },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe("<lesson><p><b><i>both</i></b></p></lesson>");
    });
  });

  describe("lists", () => {
    it("serializes bullet list", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Item 1" }],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Item 2" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe(
        "<lesson><ul><li><p>Item 1</p></li><li><p>Item 2</p></li></ul></lesson>",
      );
    });

    it("serializes ordered list", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "orderedList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "First" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe("<lesson><ol><li><p>First</p></li></ol></lesson>");
    });
  });

  describe("blockquote", () => {
    it("serializes blockquote", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "blockquote",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Quote" }],
                },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe(
        "<lesson><blockquote><p>Quote</p></blockquote></lesson>",
      );
    });
  });

  describe("horizontal rule", () => {
    it("serializes horizontal rule", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Before" }],
            },
            { type: "horizontalRule" },
            {
              type: "paragraph",
              content: [{ type: "text", text: "After" }],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe("<lesson><p>Before</p><hr /><p>After</p></lesson>");
    });
  });

  describe("exercise", () => {
    it("serializes exercise with id", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "exercise",
              attrs: { id: "ex-123" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Exercise content" }],
                },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe(
        '<lesson><exercise id="ex-123"><p>Exercise content</p></exercise></lesson>',
      );
    });

    it("serializes exercise without id", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "exercise",
              attrs: {},
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Content" }],
                },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe(
        "<lesson><exercise><p>Content</p></exercise></lesson>",
      );
    });
  });

  describe("blank", () => {
    it("serializes blank in paragraph", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "She " },
                {
                  type: "blank",
                  attrs: {
                    correctAnswer: "goes",
                    alternativeAnswers: [],
                    hint: null,
                    studentAnswer: "",
                  },
                },
                { type: "text", text: " to school." },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe(
        '<lesson><p>She <blank answer="goes" student-answer="" /> to school.</p></lesson>',
      );
    });

    it("serializes blank with all attributes", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "blank",
                  attrs: {
                    correctAnswer: "went",
                    alternativeAnswers: ["had gone"],
                    hint: "past tense",
                    studentAnswer: "goed",
                  },
                },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe(
        '<lesson><p><blank answer="went" alts="had gone" hint="past tense" student-answer="goed" /></p></lesson>',
      );
    });
  });

  describe("noteBlock", () => {
    it("serializes note", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "noteBlock",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Teacher note" }],
                },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe("<lesson><note><p>Teacher note</p></note></lesson>");
    });
  });

  describe("writingArea", () => {
    it("serializes writing area", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "writingArea",
              attrs: {
                id: "wa-1",
                lines: 8,
                placeholder: "Write here...",
              },
              content: [
                {
                  type: "paragraph",
                  content: [],
                },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe(
        '<lesson><writing-area id="wa-1" lines="8" placeholder="Write here..."><p></p></writing-area></lesson>',
      );
    });
  });

  describe("group", () => {
    it("serializes group", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "group",
              attrs: { id: "grp-1" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Grouped" }],
                },
              ],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe(
        '<lesson><group id="grp-1"><p>Grouped</p></group></lesson>',
      );
    });
  });

  describe("special characters", () => {
    it("escapes special characters in text", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "a < b & c > d" }],
            },
          ],
        },
        { pretty: false },
      );
      expect(result).toBe("<lesson><p>a &lt; b &amp; c &gt; d</p></lesson>");
    });
  });

  describe("complex document", () => {
    it("serializes a complete lesson structure", () => {
      const result = jsonToXML(
        {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Past Tense Verbs" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Learn about past tense." }],
            },
            {
              type: "exercise",
              attrs: { id: "ex-1" },
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "She " },
                    {
                      type: "blank",
                      attrs: {
                        correctAnswer: "went",
                        alternativeAnswers: [],
                        hint: null,
                        studentAnswer: "",
                      },
                    },
                    { type: "text", text: " to the store." },
                  ],
                },
              ],
            },
            { type: "horizontalRule" },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Remember: ", marks: [{ type: "bold" }] },
                { type: "text", text: "Practice makes perfect!" },
              ],
            },
          ],
        },
        { pretty: false },
      );

      expect(result).toBe(
        '<lesson><h1>Past Tense Verbs</h1><p>Learn about past tense.</p><exercise id="ex-1"><p>She <blank answer="went" student-answer="" /> to the store.</p></exercise><hr /><p><b>Remember: </b>Practice makes perfect!</p></lesson>',
      );
    });
  });
});
