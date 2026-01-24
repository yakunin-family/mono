import { describe, it, expect } from "vitest";

import { validateXML } from "./validate-xml";

describe("validateXML", () => {
  describe("basic validation", () => {
    it("validates correct XML", () => {
      const result = validateXML("<lesson><p>Hello</p></lesson>");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects empty input", () => {
      const result = validateXML("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Empty XML input");
    });

    it("rejects whitespace-only input", () => {
      const result = validateXML("   ");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Empty XML input");
    });
  });

  describe("XML syntax errors", () => {
    it("rejects malformed XML", () => {
      const result = validateXML("<lesson><p>Unclosed");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid XML syntax");
    });

    it("rejects mismatched tags", () => {
      const result = validateXML("<lesson><p>Text</div></lesson>");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid XML syntax");
    });
  });

  describe("root element", () => {
    it("rejects non-lesson root", () => {
      const result = validateXML("<document><p>Hello</p></document>");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Expected <lesson> root element, got <document>",
      );
    });
  });

  describe("unknown tags", () => {
    it("rejects unknown tags", () => {
      const result = validateXML("<lesson><unknown>Content</unknown></lesson>");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Unknown tag: <unknown>");
    });

    it("rejects unknown nested tags", () => {
      const result = validateXML(
        "<lesson><exercise><custom>Stuff</custom></exercise></lesson>",
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Unknown tag: <custom>");
    });
  });

  describe("blank validation", () => {
    it("rejects blank without answer", () => {
      const result = validateXML("<lesson><p><blank /></p></lesson>");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("<blank> element must have 'answer' attribute");
    });

    it("accepts blank with answer", () => {
      const result = validateXML(
        '<lesson><p><blank answer="test" /></p></lesson>',
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("list validation", () => {
    it("rejects non-li children in ul", () => {
      const result = validateXML("<lesson><ul><p>Wrong</p></ul></lesson>");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "<ul> can only contain <li> elements, found <p>",
      );
    });

    it("rejects non-li children in ol", () => {
      const result = validateXML("<lesson><ol><p>Wrong</p></ol></lesson>");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "<ol> can only contain <li> elements, found <p>",
      );
    });

    it("accepts valid list structure", () => {
      const result = validateXML(
        "<lesson><ul><li><p>Item</p></li></ul></lesson>",
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("paragraph content validation", () => {
    it("rejects block elements inside paragraph", () => {
      const result = validateXML(
        "<lesson><p><exercise><p>Nested</p></exercise></p></lesson>",
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "<p> cannot contain block-level element <exercise>",
      );
    });

    it("accepts inline elements in paragraph", () => {
      const result = validateXML(
        '<lesson><p>Text <b>bold</b> <blank answer="a" /></p></lesson>',
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("heading content validation", () => {
    it("rejects block elements inside heading", () => {
      const result = validateXML(
        "<lesson><h1><p>Nested paragraph</p></h1></lesson>",
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe("<h1> cannot contain block-level element <p>");
    });

    it("accepts inline elements in heading", () => {
      const result = validateXML("<lesson><h1>Title <b>bold</b></h1></lesson>");
      expect(result.valid).toBe(true);
    });
  });

  describe("writing-area validation", () => {
    it("rejects invalid lines attribute", () => {
      const result = validateXML(
        '<lesson><writing-area lines="abc"><p></p></writing-area></lesson>',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "<writing-area> 'lines' attribute must be a positive number",
      );
    });

    it("rejects zero lines", () => {
      const result = validateXML(
        '<lesson><writing-area lines="0"><p></p></writing-area></lesson>',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "<writing-area> 'lines' attribute must be a positive number",
      );
    });

    it("accepts valid lines attribute", () => {
      const result = validateXML(
        '<lesson><writing-area lines="5"><p></p></writing-area></lesson>',
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("valid documents", () => {
    it("validates all element types", () => {
      const xml = `<lesson>
        <h1>Title</h1>
        <h2>Subtitle</h2>
        <h3>Section</h3>
        <p>Paragraph with <b>bold</b> and <i>italic</i>.</p>
        <ul>
          <li><p>Bullet</p></li>
        </ul>
        <ol>
          <li><p>Numbered</p></li>
        </ol>
        <blockquote><p>Quote</p></blockquote>
        <hr />
        <exercise id="ex-1">
          <p>She <blank answer="goes" /> to school.</p>
        </exercise>
        <note><p>Teacher note</p></note>
        <writing-area lines="5"><p></p></writing-area>
        <group><p>Grouped</p></group>
      </lesson>`;

      const result = validateXML(xml);
      expect(result.valid).toBe(true);
    });
  });
});
