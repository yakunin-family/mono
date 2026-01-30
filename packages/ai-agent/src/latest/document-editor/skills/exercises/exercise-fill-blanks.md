# Fill-in-the-Blank Exercise Rules

## XML Structure

Fill-in-the-blank exercises use the `<blank>` element inside paragraphs within an `<exercise>` container:

```xml
<exercise id="ex-abc123">
  <h3>Complete the sentences</h3>
  <p>Fill in the blanks with the correct form of the verb.</p>
  <ol>
    <li><p>The cat <blank answer="sleeps" hint="present tense verb" student-answer="" /> on the sofa every day.</p></li>
    <li><p>She <blank answer="went" alts="traveled,drove" hint="past tense of 'go'" student-answer="" /> to Paris last summer.</p></li>
    <li><p>They <blank answer="are playing" alts="are currently playing" student-answer="" /> soccer in the park right now.</p></li>
  </ol>
</exercise>
```

## Blank Attributes

| Attribute        | Required | Description                                    |
| ---------------- | -------- | ---------------------------------------------- |
| `answer`         | Yes      | The correct answer                             |
| `alts`           | No       | Comma-separated alternative correct answers    |
| `hint`           | No       | Hint text shown to students                    |
| `student-answer` | Yes      | Always set to empty string `""` for new blanks |

## Guidelines

1. **Context is key**: Ensure surrounding text provides enough context to determine the answer
2. **Match difficulty to level**: Use vocabulary and grammar appropriate for the target CEFR level
3. **Variety**: Mix different grammar points when appropriate
4. **Helpful hints**: Provide hints for harder blanks (grammar category, first letter, word type, etc.)
5. **Clear structure**: Use numbered lists (`<ol>`) for exercises with multiple sentences
6. **Instructions first**: Always include clear instructions before the blanks

## CEFR Level Guidelines

### A1-A2 (Beginner/Elementary)

- Simple present and past tense
- Basic vocabulary (500-1500 words)
- Short, clear sentences
- Obvious context clues

### B1-B2 (Intermediate)

- All basic tenses plus conditionals
- Broader vocabulary (1500-4000 words)
- More complex sentences
- Some inference required

### C1-C2 (Advanced)

- Full range of tenses and structures
- Sophisticated vocabulary
- Nuanced context
- Idiomatic expressions

## Common Mistakes to Avoid

- Don't create blanks where multiple unrelated answers could be correct
- Don't put blanks at the very start of a sentence (no context)
- Don't forget the `student-answer=""` attribute
- Don't create blanks that are too easy (single word with obvious answer)
- Don't create blanks that are too hard (requires specific knowledge not in context)

## Example: Good vs Bad

**Good:**

```xml
<p>Yesterday, she <blank answer="bought" hint="past tense of 'buy'" student-answer="" /> a new dress at the mall.</p>
```

Context makes it clear we need a past tense verb related to shopping.

**Bad:**

```xml
<p><blank answer="She" student-answer="" /> went to the store.</p>
```

No context at the start of the sentence - could be any subject.
