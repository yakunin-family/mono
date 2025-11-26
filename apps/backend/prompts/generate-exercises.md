# Exercise Content Generator

You are generating high-quality language learning exercise content.

## Requirements

```json
{requirements}
```

## Approved Plan

```json
{approvedPlan}
```

## Exercise to Generate

From the approved plan, generate content for this exercise:

```json
{exerciseItem}
```

## Your Task

Generate the complete exercise content according to the type and parameters specified.

---

# Exercise Type Specifications

## 1. Multiple Choice (`multiple-choice`)

**Output Format:**
```json
{
  "type": "multiple-choice",
  "title": "Exercise title",
  "instructions": "Clear instructions in the target language",
  "questions": [
    {
      "id": "q1",
      "question": "Question text",
      "options": [
        { "id": "a", "text": "Option A" },
        { "id": "b", "text": "Option B" },
        { "id": "c", "text": "Option C" },
        { "id": "d", "text": "Option D" }
      ],
      "correctAnswer": "b",
      "explanation": "Why this answer is correct"
    }
  ]
}
```

**Guidelines:**
- One clearly correct answer
- Three plausible distractors
- Options should be similar in length
- Avoid "all/none of the above"

---

## 2. True/False (`true-false`)

**Output Format:**
```json
{
  "type": "true-false",
  "title": "Exercise title",
  "instructions": "Instructions in target language",
  "statements": [
    {
      "id": "s1",
      "statement": "Statement in target language",
      "correctAnswer": true,
      "explanation": "Why this is true/false (optional)"
    }
  ]
}
```

**Guidelines:**
- Make statements definitively true or false
- Mix true and false statements
- Avoid confusing negative phrasing

---

## 3. Fill in the Blanks (`fill-blanks`)

**Output Format:**
```json
{
  "type": "fill-blanks",
  "title": "Exercise title",
  "instructions": "Instructions in target language",
  "items": [
    {
      "id": "fb1",
      "sentence": "The cat is [[blank1]] on the sofa.",
      "blanks": [
        {
          "id": "blank1",
          "correctAnswer": "sleeping",
          "alternativeAnswers": ["resting", "lying"],
          "hint": "Present continuous verb (optional)"
        }
      ]
    }
  ]
}
```

**Guidelines:**
- Use `[[blank1]]`, `[[blank2]]` as placeholders
- Provide alternative correct answers if applicable
- Context should make the answer clear
- Focus on target grammar/vocabulary point

---

## 4. Sequencing (`sequencing`)

**Output Format:**
```json
{
  "type": "sequencing",
  "title": "Exercise title",
  "instructions": "Instructions in target language",
  "context": "Background information (optional)",
  "items": [
    {
      "id": "seq1",
      "content": "First event/step",
      "correctPosition": 1
    }
  ]
}
```

**Guidelines:**
- Include 5-10 items to sequence
- Clear logical ordering
- Each item should be distinct

---

## 5. Short Answer (`short-answer`)

**Output Format:**
```json
{
  "type": "short-answer",
  "title": "Exercise title",
  "instructions": "Instructions in target language",
  "questions": [
    {
      "id": "sa1",
      "question": "Question in target language",
      "expectedAnswerGuidelines": "What a good answer should include",
      "rubric": [
        {
          "criterion": "Content accuracy",
          "points": 2
        }
      ]
    }
  ]
}
```

**Guidelines:**
- Questions should elicit 2-5 sentence responses
- Provide clear rubric for assessment

---

## 6. Reading Passage (`text-passage`)

**Output Format:**
```json
{
  "type": "text-passage",
  "title": "Exercise title",
  "content": "The complete text in target language...",
  "metadata": {
    "wordCount": 250,
    "readingTime": 5,
    "source": "Original content"
  }
}
```

**Guidelines:**
- Match specified word count and difficulty level
- Use vocabulary appropriate for CEFR level
- Structure with clear paragraphs

**Level-Specific:**
- **A1-A2**: Simple sentences, present tense, everyday topics
- **B1-B2**: Mix of sentences, past/future tenses, abstract topics
- **C1-C2**: Complex sentences, sophisticated vocabulary

---

## 7. Discussion Prompt (`discussion-prompt`)

**Output Format:**
```json
{
  "type": "discussion-prompt",
  "title": "Exercise title",
  "prompt": "Main discussion topic in target language",
  "guidingQuestions": [
    "Question 1 to guide discussion"
  ],
  "context": "Background information (optional)"
}
```

**Guidelines:**
- Main prompt should be engaging
- Guiding questions progress from concrete to abstract
- No single "right answer"

---

## 8. Writing Exercises

Types: `summary-writing`, `opinion-writing`, `description-writing`, `sentence-completion`

**Output Format:**
```json
{
  "type": "opinion-writing",
  "title": "Exercise title",
  "instructions": "Clear instructions in target language",
  "prompt": "Writing prompt in target language",
  "wordCountTarget": {
    "min": 100,
    "max": 150
  },
  "rubric": [
    {
      "criterion": "Content & Ideas",
      "description": "Addresses prompt with relevant ideas",
      "maxPoints": 4
    }
  ]
}
```

---

# Quality Standards

## All Exercise Types Must:

1. **Match the Level**: Use vocabulary and grammar appropriate for the CEFR level
2. **Be Culturally Appropriate**: Avoid stereotypes and sensitive topics
3. **Use Target Language**: All student-facing content in the target language
4. **Be Achievable**: Students at the specified level should be able to complete it
5. **Be Clear**: Instructions and questions should be unambiguous

## Language Complexity by Level

### A1 (Beginner)
- **Vocabulary**: 500-1000 most common words
- **Grammar**: Present tense, basic pronouns
- **Sentences**: 5-10 words, simple structure
- **Topics**: Greetings, family, food, daily routines

### A2 (Elementary)
- **Vocabulary**: 1000-1500 words
- **Grammar**: Past/future tense, basic conjunctions
- **Sentences**: 10-15 words
- **Topics**: Shopping, travel, hobbies, work

### B1 (Intermediate)
- **Vocabulary**: 1500-2500 words
- **Grammar**: All basic tenses, conditionals, passive voice
- **Sentences**: 15-20 words, complex sentences
- **Topics**: Education, environment, technology, culture

### B2 (Upper-Intermediate)
- **Vocabulary**: 2500-4000 words, idiomatic expressions
- **Grammar**: Advanced tenses, subjunctive, reported speech
- **Sentences**: 20-25 words
- **Topics**: Politics, economics, abstract concepts

### C1-C2 (Advanced)
- **Vocabulary**: 4000+ words, specialized terminology
- **Grammar**: Full range including rare/literary forms
- **Sentences**: Variable length, stylistically sophisticated
- **Topics**: Any topic with depth and nuance

---

# Important Notes

- **Return Format**: You must return a response in the following format:
  ```json
  {
    "exercises": [
      {
        "planItemId": "the-id-from-exerciseItem",
        "content": {
          // The exercise content matching one of the exercise type schemas above
        }
      }
    ],
    "totalGenerated": 1,
    "errors": []
  }
  ```
  The planItemId should match the "id" field from the exerciseItem JSON provided above.

- **Schema Compliance**: Output must exactly match the Zod schema requirements
- **Dependencies**: If the exercise has dependencies, reference previous exercises
- **Parameters**: Follow all specific parameters provided

Generate engaging, pedagogically sound content that helps students learn effectively!
