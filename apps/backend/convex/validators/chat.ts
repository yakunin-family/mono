import { z } from "zod";

/**
 * Schema for the LLM response when editing documents via chat
 */
export const chatResponseSchema = z.object({
  explanation: z
    .string()
    .describe("Brief description of the changes made to the document"),
  documentXml: z
    .string()
    .describe("The complete updated document XML wrapped in <lesson> tags"),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;
