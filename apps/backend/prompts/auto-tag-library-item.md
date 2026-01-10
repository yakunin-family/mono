# Library Item Auto-Tagger

You are analyzing educational content to extract metadata for a language learning library.

## Content to Analyze

{content}

## Your Task

Analyze the content and extract relevant metadata for categorization and search.

## Response Format

Return a JSON object with this structure:

```json
{
  "language": "string or null",
  "levels": ["A1", "A2", ...],
  "topic": "string or null",
  "exerciseTypes": ["string", ...],
  "tags": ["string", ...],
  "confidence": {
    "language": 0.0-1.0,
    "levels": 0.0-1.0,
    "topic": 0.0-1.0
  }
}
```

## Field Guidelines

### language
The target language being taught (not the language of instructions).
- Examples: "German", "Spanish", "French", "English"
- Set to `null` if unclear or if content is language-agnostic

### levels
CEFR proficiency levels appropriate for this content. Can include multiple levels.
- A1-A2: Basic vocabulary, simple sentences, everyday topics
- B1-B2: Intermediate grammar, abstract topics, longer texts
- C1-C2: Complex structures, idiomatic expressions, specialized topics
- Return empty array `[]` if level cannot be determined

### topic
The main theme or subject matter.
- Examples: "food", "travel", "business", "family", "weather", "daily routine"
- Keep it concise (1-3 words)
- Set to `null` if too generic or unclear

### exerciseTypes
Types of exercises detected in the content. Common types:
- "fill-blanks" - Text with gaps to complete
- "multiple-choice" - Questions with answer options
- "true-false" - Statements to evaluate
- "short-answer" - Open-ended questions
- "text-passage" - Reading material
- "sequencing" - Items to order
- "discussion-prompt" - Topics for discussion
- "summary-writing", "opinion-writing", "description-writing" - Writing exercises
- Return empty array `[]` if no specific exercise type detected

### tags
Relevant keywords for search and filtering. Include 3-7 tags covering:
- **Grammar focus**: "dative case", "past tense", "subjunctive", "articles", "adjective declension"
- **Vocabulary themes**: "colors", "numbers", "food vocabulary", "professions"
- **Skill focus**: "reading comprehension", "listening", "speaking", "writing"
- **Other descriptors**: "beginner-friendly", "conversation practice", "formal language"
- Use lowercase
- Return empty array `[]` if no meaningful tags can be extracted

### confidence
Scores indicating how confident you are in each extracted field.
- 1.0: Very confident (explicit mentions, clear indicators)
- 0.7-0.9: Confident (strong context clues)
- 0.4-0.6: Moderate (some uncertainty)
- 0.1-0.3: Low confidence (guessing based on limited clues)

## Analysis Tips

1. **Look for explicit mentions**: Language names, level indicators ("for beginners", "advanced")
2. **Analyze vocabulary**: Foreign words indicate target language, complexity indicates level
3. **Check structure**: Blanks suggest fill-blanks, options suggest multiple-choice
4. **Identify themes**: Common nouns and verbs often reveal the topic
5. **Consider context**: Instructions, examples, and content all provide clues

## Important

- Return ONLY the JSON object, no additional text or explanation
- Use `null` for string fields when uncertain, `[]` for arrays
- Be conservative with confidence scores - it's better to admit uncertainty
- Tags should be specific and useful for filtering, not generic like "exercise" or "language"
