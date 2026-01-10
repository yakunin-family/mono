import { z } from "zod";

/**
 * Schema for AI auto-tagging library items
 * Used to extract metadata from content for search/filtering
 */

export const cefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const autoTagConfidenceSchema = z.object({
  language: z.number().min(0).max(1),
  levels: z.number().min(0).max(1),
  topic: z.number().min(0).max(1),
});

export const autoTagResponseSchema = z.object({
  // Core metadata fields
  language: z.string().nullable().describe("Target language being taught"),
  levels: z
    .array(cefrLevelSchema)
    .describe("CEFR levels suitable for this content"),
  topic: z.string().nullable().describe("Main topic/theme"),
  exerciseTypes: z
    .array(z.string())
    .describe("Types of exercises detected in content"),
  tags: z
    .array(z.string())
    .describe(
      "Relevant keywords: grammar focus, vocabulary themes, skill areas"
    ),

  // Confidence scores for filtering low-confidence results
  confidence: autoTagConfidenceSchema,
});

export type AutoTagResponse = z.infer<typeof autoTagResponseSchema>;
export type CEFRLevel = z.infer<typeof cefrLevelSchema>;
export type AutoTagConfidence = z.infer<typeof autoTagConfidenceSchema>;

/**
 * Processed metadata after filtering by confidence
 * This is what gets stored in the database
 */
export interface ProcessedMetadata {
  language: string | undefined;
  levels: CEFRLevel[] | undefined;
  topic: string | undefined;
  exerciseTypes: string[] | undefined;
  tags: string[] | undefined;
  autoTagged: boolean;
}

/**
 * Minimum confidence threshold for accepting AI-generated values
 */
export const CONFIDENCE_THRESHOLD = 0.5;

/**
 * Process raw AI response and filter by confidence
 */
export function processAutoTagResponse(
  response: AutoTagResponse
): ProcessedMetadata {
  return {
    language:
      response.confidence.language >= CONFIDENCE_THRESHOLD && response.language
        ? response.language
        : undefined,
    levels:
      response.confidence.levels >= CONFIDENCE_THRESHOLD &&
      response.levels.length > 0
        ? response.levels
        : undefined,
    topic:
      response.confidence.topic >= CONFIDENCE_THRESHOLD && response.topic
        ? response.topic
        : undefined,
    exerciseTypes:
      response.exerciseTypes.length > 0 ? response.exerciseTypes : undefined,
    tags: response.tags.length > 0 ? response.tags : undefined,
    autoTagged: true,
  };
}
