import { describe, expect, it } from "vitest";

import {
  escapeXml,
  serializeBlockquote,
  serializeBulletList,
  serializeHeading,
  serializeHorizontalRule,
  serializeInlineContent,
  serializeListItem,
  serializeOrderedList,
  serializeParagraph,
  unescapeXml,
} from "./blocks";

describe("escapeXml", () => {
  it("escapes ampersand", () => {
    expect(escapeXml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes less than", () => {
    expect(escapeXml("a < b")).toBe("a &lt; b");
  });

  it("escapes greater than", () => {
    expect(escapeXml("a > b")).toBe("a &gt; b");
  });

  it("escapes quotes", () => {
    expect(escapeXml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes apostrophes", () => {
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it("handles multiple special chars", () => {
    expect(escapeXml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });
});

describe("unescapeXml", () => {
  it("unescapes ampersand", () => {
    expect(unescapeXml("foo &amp; bar")).toBe("foo & bar");
  });

  it("unescapes all entities", () => {
    expect(unescapeXml("&lt;&gt;&quot;&apos;&amp;")).toBe("<>\"'&");
  });
});

describe("serializeInlineContent", () => {
  it("returns empty string for undefined", () => {
    expect(serializeInlineContent(undefined)).toBe("");
  });

  it("serializes plain text", () => {
    expect(
      serializeInlineContent([{ type: "text", text: "Hello world" }]),
    ).toBe("Hello world");
  });

  it("escapes special characters in text", () => {
    expect(
      serializeInlineContent([{ type: "text", text: "a < b & c > d" }]),
    ).toBe("a &lt; b &amp; c &gt; d");
  });

  it("serializes bold text", () => {
    expect(
      serializeInlineContent([
        { type: "text", text: "bold", marks: [{ type: "bold" }] },
      ]),
    ).toBe("<b>bold</b>");
  });

  it("serializes italic text", () => {
    expect(
      serializeInlineContent([
        { type: "text", text: "italic", marks: [{ type: "italic" }] },
      ]),
    ).toBe("<i>italic</i>");
  });

  it("serializes nested marks", () => {
    expect(
      serializeInlineContent([
        {
          type: "text",
          text: "both",
          marks: [{ type: "bold" }, { type: "italic" }],
        },
      ]),
    ).toBe("<b><i>both</i></b>");
  });

  it("serializes mixed content", () => {
    expect(
      serializeInlineContent([
        { type: "text", text: "Hello " },
        { type: "text", text: "world", marks: [{ type: "bold" }] },
        { type: "text", text: "!" },
      ]),
    ).toBe("Hello <b>world</b>!");
  });

  it("serializes hard break", () => {
    expect(
      serializeInlineContent([
        { type: "text", text: "line 1" },
        { type: "hardBreak" },
        { type: "text", text: "line 2" },
      ]),
    ).toBe("line 1<br />line 2");
  });

  it("serializes underline", () => {
    expect(
      serializeInlineContent([
        { type: "text", text: "underlined", marks: [{ type: "underline" }] },
      ]),
    ).toBe("<u>underlined</u>");
  });

  it("serializes strikethrough", () => {
    expect(
      serializeInlineContent([
        { type: "text", text: "deleted", marks: [{ type: "strike" }] },
      ]),
    ).toBe("<s>deleted</s>");
  });

  it("serializes inline code", () => {
    expect(
      serializeInlineContent([
        { type: "text", text: "const x = 1", marks: [{ type: "code" }] },
      ]),
    ).toBe("<code>const x = 1</code>");
  });
});

describe("serializeHeading", () => {
  const noopChildren = () => "";

  it("serializes h1", () => {
    expect(
      serializeHeading(
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Title" }],
        },
        noopChildren,
      ),
    ).toBe("<h1>Title</h1>");
  });

  it("serializes h2", () => {
    expect(
      serializeHeading(
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Subtitle" }],
        },
        noopChildren,
      ),
    ).toBe("<h2>Subtitle</h2>");
  });

  it("serializes h3", () => {
    expect(
      serializeHeading(
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Section" }],
        },
        noopChildren,
      ),
    ).toBe("<h3>Section</h3>");
  });

  it("clamps level to max 3", () => {
    expect(
      serializeHeading(
        {
          type: "heading",
          attrs: { level: 6 },
          content: [{ type: "text", text: "Deep" }],
        },
        noopChildren,
      ),
    ).toBe("<h3>Deep</h3>");
  });

  it("defaults to h1 if no level", () => {
    expect(
      serializeHeading(
        {
          type: "heading",
          content: [{ type: "text", text: "No Level" }],
        },
        noopChildren,
      ),
    ).toBe("<h1>No Level</h1>");
  });

  it("preserves inline formatting", () => {
    expect(
      serializeHeading(
        {
          type: "heading",
          attrs: { level: 1 },
          content: [
            { type: "text", text: "Hello " },
            { type: "text", text: "World", marks: [{ type: "bold" }] },
          ],
        },
        noopChildren,
      ),
    ).toBe("<h1>Hello <b>World</b></h1>");
  });
});

describe("serializeParagraph", () => {
  const noopChildren = () => "";

  it("serializes simple paragraph", () => {
    expect(
      serializeParagraph(
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
        noopChildren,
      ),
    ).toBe("<p>Hello world</p>");
  });

  it("serializes empty paragraph", () => {
    expect(serializeParagraph({ type: "paragraph" }, noopChildren)).toBe(
      "<p></p>",
    );
  });

  it("preserves inline formatting", () => {
    expect(
      serializeParagraph(
        {
          type: "paragraph",
          content: [
            { type: "text", text: "This is " },
            { type: "text", text: "important", marks: [{ type: "bold" }] },
            { type: "text", text: "." },
          ],
        },
        noopChildren,
      ),
    ).toBe("<p>This is <b>important</b>.</p>");
  });
});

describe("serializeBulletList", () => {
  it("serializes bullet list with items", () => {
    const serializeChildren = () => "<li>Item 1</li><li>Item 2</li>";
    expect(
      serializeBulletList(
        {
          type: "bulletList",
          content: [],
        },
        serializeChildren,
      ),
    ).toBe("<ul><li>Item 1</li><li>Item 2</li></ul>");
  });
});

describe("serializeOrderedList", () => {
  it("serializes ordered list", () => {
    const serializeChildren = () => "<li>First</li><li>Second</li>";
    expect(
      serializeOrderedList(
        {
          type: "orderedList",
          content: [],
        },
        serializeChildren,
      ),
    ).toBe("<ol><li>First</li><li>Second</li></ol>");
  });

  it("includes start attribute when not 1", () => {
    const serializeChildren = () => "<li>Item</li>";
    expect(
      serializeOrderedList(
        {
          type: "orderedList",
          attrs: { start: 5 },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe('<ol start="5"><li>Item</li></ol>');
  });

  it("omits start attribute when 1", () => {
    const serializeChildren = () => "<li>Item</li>";
    expect(
      serializeOrderedList(
        {
          type: "orderedList",
          attrs: { start: 1 },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe("<ol><li>Item</li></ol>");
  });
});

describe("serializeListItem", () => {
  it("serializes list item with nested content", () => {
    const serializeChildren = () => "<p>Content</p>";
    expect(
      serializeListItem(
        {
          type: "listItem",
          content: [],
        },
        serializeChildren,
      ),
    ).toBe("<li><p>Content</p></li>");
  });
});

describe("serializeBlockquote", () => {
  it("serializes blockquote", () => {
    const serializeChildren = () => "<p>Quoted text</p>";
    expect(
      serializeBlockquote(
        {
          type: "blockquote",
          content: [],
        },
        serializeChildren,
      ),
    ).toBe("<blockquote><p>Quoted text</p></blockquote>");
  });
});

describe("serializeHorizontalRule", () => {
  it("serializes horizontal rule", () => {
    expect(serializeHorizontalRule({ type: "horizontalRule" }, () => "")).toBe(
      "<hr />",
    );
  });
});
