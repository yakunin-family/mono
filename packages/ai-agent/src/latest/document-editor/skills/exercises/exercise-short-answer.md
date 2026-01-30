# Short Answer Exercise Rules

## XML Structure

Short answer exercises ask open-ended questions that require brief written responses:

```xml
<exercise id="ex-sa-123">
  <h3>Reading Comprehension Questions</h3>
  <p>Answer the following questions based on the text above. Write 1-2 sentences for each.</p>

  <p><b>1. Why did the main character decide to move to a new city?</b></p>
  <writing-area id="wa-sa-1" lines="3" placeholder="Write your answer here..."><p></p></writing-area>
  <note><p>Expected answer: Should mention the job opportunity and desire for a fresh start.</p></note>

  <p><b>2. How did this decision affect her relationship with her family?</b></p>
  <writing-area id="wa-sa-2" lines="3" placeholder="Write your answer here..."><p></p></writing-area>
  <note><p>Expected answer: Should discuss the initial tension but eventual support from her parents.</p></note>

  <p><b>3. What lesson can we learn from this story?</b></p>
  <writing-area id="wa-sa-3" lines="4" placeholder="Write your answer here..."><p></p></writing-area>
  <note><p>Expected answer: Answers may vary but should relate to following dreams, family support, or taking risks.</p></note>
</exercise>
```

## Guidelines

1. **Clear questions**: Questions should be unambiguous and focused
2. **Appropriate length**: Use `lines` attribute to suggest expected response length
3. **Teacher notes**: Include expected answer points or rubric in `<note>`
4. **Progressive difficulty**: Start with factual questions, move to inferential
5. **Varied question types**: Mix recall, inference, and opinion questions

## Question Types

### Factual (A1-B1)

- Who, what, when, where questions
- Answers directly stated in text
- Short responses expected

```xml
<p><b>Where does the story take place?</b></p>
<writing-area id="wa-1" lines="2" placeholder="Your answer..."><p></p></writing-area>
```

### Inferential (B1-C1)

- Why, how questions
- Requires reading between the lines
- Longer responses expected

```xml
<p><b>Why do you think the author chose to end the story this way?</b></p>
<writing-area id="wa-2" lines="4" placeholder="Your answer..."><p></p></writing-area>
```

### Evaluative (B2-C2)

- Opinion-based with justification
- Critical thinking required
- Longer, developed responses

```xml
<p><b>Do you agree with the main character's decision? Explain your reasoning.</b></p>
<writing-area id="wa-3" lines="5" placeholder="Your answer..."><p></p></writing-area>
```

## CEFR Level Guidelines

### A1-A2

- 1-2 sentences expected
- `lines="2"` or `lines="3"`
- Simple factual questions
- Vocabulary within their level

### B1-B2

- 2-4 sentences expected
- `lines="3"` or `lines="4"`
- Some inference required
- Can ask for opinions with simple justification

### C1-C2

- 4-6 sentences or more
- `lines="5"` or higher
- Complex analysis
- Sophisticated argumentation expected

## Rubric Elements for Teacher Notes

Include in your `<note>`:

1. **Key points**: What should be mentioned
2. **Acceptable variations**: Different valid approaches
3. **Common mistakes**: What to watch for
4. **Language focus**: Grammar/vocabulary to assess

```xml
<note>
  <p><b>Key points (1 point each):</b></p>
  <ul>
    <li><p>Identifies the main conflict</p></li>
    <li><p>Explains character motivation</p></li>
    <li><p>Uses evidence from text</p></li>
  </ul>
  <p><b>Language:</b> Look for correct use of past tense and reported speech.</p>
</note>
```
