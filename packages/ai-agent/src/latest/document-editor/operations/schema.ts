/**
 * Zod Schemas for Document Operations
 *
 * These schemas validate AI-generated operations at runtime.
 * They mirror the TypeScript types in types.ts.
 */

import { z } from "zod";

import type {
  BlockNode,
  DocumentOperation,
  InlineContent,
  ListItem,
} from "./types";

// =============================================================================
// Mark Types
// =============================================================================

export const MarkTypeSchema = z.enum([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
]);

// =============================================================================
// Inline Content
// =============================================================================

export const TextContentSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  marks: z.array(MarkTypeSchema).optional(),
});

export const BlankContentSchema = z.object({
  type: z.literal("blank"),
  correctAnswer: z.string(),
  alternativeAnswers: z.array(z.string()).optional(),
  hint: z.string().optional(),
});

export const HardBreakContentSchema = z.object({
  type: z.literal("hardBreak"),
});

export const InlineContentSchema: z.ZodType<InlineContent> =
  z.discriminatedUnion("type", [
    TextContentSchema,
    BlankContentSchema,
    HardBreakContentSchema,
  ]);

// =============================================================================
// Block Nodes (recursive, so we use z.lazy with explicit type annotation)
// =============================================================================

// Forward declaration for recursive types
export const BlockNodeSchema: z.ZodType<BlockNode> = z.lazy(() =>
  z.union([
    // Paragraph
    z.object({
      type: z.literal("paragraph"),
      content: z.array(InlineContentSchema).optional(),
    }),
    // Heading
    z.object({
      type: z.literal("heading"),
      level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      content: z.array(InlineContentSchema).optional(),
    }),
    // Bullet List
    z.object({
      type: z.literal("bulletList"),
      items: z.array(ListItemSchema),
    }),
    // Ordered List
    z.object({
      type: z.literal("orderedList"),
      items: z.array(ListItemSchema),
    }),
    // Blockquote
    z.object({
      type: z.literal("blockquote"),
      content: z.array(BlockNodeSchema),
    }),
    // Horizontal Rule
    z.object({
      type: z.literal("horizontalRule"),
    }),
    // Exercise
    z.object({
      type: z.literal("exercise"),
      content: z.array(BlockNodeSchema),
    }),
    // Group
    z.object({
      type: z.literal("group"),
      content: z.array(BlockNodeSchema),
    }),
    // Note Block
    z.object({
      type: z.literal("noteBlock"),
      content: z.array(BlockNodeSchema),
    }),
    // Writing Area
    z.object({
      type: z.literal("writingArea"),
      lines: z.number().optional(),
      placeholder: z.string().optional(),
    }),
  ]),
);

export const ListItemSchema: z.ZodType<ListItem> = z.lazy(() =>
  z.object({
    content: z.array(BlockNodeSchema),
  }),
);

// =============================================================================
// Wrapper Types
// =============================================================================

export const WrapperTypeSchema = z.enum(["exercise", "group", "blockquote"]);

// =============================================================================
// Operations
// =============================================================================

export const InsertAfterOperationSchema = z.object({
  op: z.literal("insert_after"),
  id: z.string(),
  block: BlockNodeSchema,
});

export const InsertBeforeOperationSchema = z.object({
  op: z.literal("insert_before"),
  id: z.string(),
  block: BlockNodeSchema,
});

export const ReplaceBlockOperationSchema = z.object({
  op: z.literal("replace_block"),
  id: z.string(),
  block: BlockNodeSchema,
});

export const DeleteBlockOperationSchema = z.object({
  op: z.literal("delete_block"),
  id: z.string(),
});

export const SetContentOperationSchema = z.object({
  op: z.literal("set_content"),
  id: z.string(),
  content: z.array(InlineContentSchema),
});

export const SetAttrsOperationSchema = z.object({
  op: z.literal("set_attrs"),
  id: z.string(),
  attrs: z.record(z.string(), z.unknown()),
});

export const WrapOperationSchema = z.object({
  op: z.literal("wrap"),
  ids: z.array(z.string()),
  wrapper: WrapperTypeSchema,
});

export const UnwrapOperationSchema = z.object({
  op: z.literal("unwrap"),
  id: z.string(),
});

export const DocumentOperationSchema: z.ZodType<DocumentOperation> =
  z.discriminatedUnion("op", [
    InsertAfterOperationSchema,
    InsertBeforeOperationSchema,
    ReplaceBlockOperationSchema,
    DeleteBlockOperationSchema,
    SetContentOperationSchema,
    SetAttrsOperationSchema,
    WrapOperationSchema,
    UnwrapOperationSchema,
  ]);

// =============================================================================
// Array of operations (what AI returns)
// =============================================================================

export const DocumentOperationsSchema = z.array(DocumentOperationSchema);
