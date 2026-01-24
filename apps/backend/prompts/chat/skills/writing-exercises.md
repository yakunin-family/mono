# Writing Exercise Rules

## XML Structure

Writing exercises provide prompts and space for extended written responses:

```xml
<exercise id="ex-wr-123">
  <h3>Opinion Essay</h3>
  <p>Write a short essay (100-150 words) on the following topic:</p>

  <blockquote>
    <p>"Social media has more negative effects than positive effects on teenagers."</p>
    <p>Do you agree or disagree with this statement? Give reasons and examples to support your opinion.</p>
  </blockquote>

  <writing-area id="wa-essay-1" lines="15" placeholder="Write your essay here..."><p></p></writing-area>

  <note>
    <p><b>Assessment criteria:</b></p>
    <ul>
      <li><p>Clear thesis statement (2 points)</p></li>
      <li><p>At least 2 supporting arguments (4 points)</p></li>
      <li><p>Relevant examples (2 points)</p></li>
      <li><p>Logical organization (2 points)</p></li>
      <li><p>Grammar and vocabulary (2 points)</p></li>
    </ul>
    <p>Total: 12 points</p>
  </note>
</exercise>
```

## Writing Exercise Types

### Summary Writing

```xml
<exercise id="ex-wr-sum">
  <h3>Summary Writing</h3>
  <p>Read the article above and write a summary in 50-75 words. Include:</p>
  <ul>
    <li><p>The main topic</p></li>
    <li><p>Key points (2-3)</p></li>
    <li><p>The conclusion</p></li>
  </ul>
  <writing-area id="wa-sum" lines="8" placeholder="Write your summary..."><p></p></writing-area>
</exercise>
```

### Opinion Writing

```xml
<exercise id="ex-wr-op">
  <h3>Express Your Opinion</h3>
  <p>Topic: "Everyone should learn a second language."</p>
  <p>Write 80-100 words explaining whether you agree or disagree. Support your opinion with at least two reasons.</p>
  <writing-area id="wa-op" lines="10" placeholder="I believe that..."><p></p></writing-area>
</exercise>
```

### Description Writing

```xml
<exercise id="ex-wr-desc">
  <h3>Describe a Place</h3>
  <p>Describe your favorite place to visit. Use descriptive language and include:</p>
  <ul>
    <li><p>What you can see there</p></li>
    <li><p>Sounds and smells</p></li>
    <li><p>How it makes you feel</p></li>
  </ul>
  <p>Write 100-120 words.</p>
  <writing-area id="wa-desc" lines="12" placeholder="My favorite place is..."><p></p></writing-area>
</exercise>
```

### Sentence Completion

```xml
<exercise id="ex-wr-sent">
  <h3>Complete the Sentences</h3>
  <p>Complete each sentence with your own ideas. Write full sentences.</p>

  <p>1. If I could travel anywhere, I would go to...</p>
  <writing-area id="wa-s1" lines="2" placeholder=""><p></p></writing-area>

  <p>2. The most important thing I learned this year was...</p>
  <writing-area id="wa-s2" lines="2" placeholder=""><p></p></writing-area>

  <p>3. In the future, I hope to...</p>
  <writing-area id="wa-s3" lines="2" placeholder=""><p></p></writing-area>
</exercise>
```

## Guidelines

1. **Clear word count**: Always specify expected length
2. **Guiding structure**: Provide bullet points or questions to guide writing
3. **Appropriate lines**: Match `lines` attribute to expected length
4. **Rubrics**: Include assessment criteria in `<note>` for teachers
5. **Scaffolding**: For lower levels, provide sentence starters

## Word Count to Lines Mapping

| Words   | Lines |
| ------- | ----- |
| 25-50   | 4-6   |
| 50-75   | 6-8   |
| 75-100  | 8-10  |
| 100-150 | 10-15 |
| 150-200 | 15-20 |
| 200+    | 20+   |

## CEFR Level Guidelines

### A1-A2

- 30-60 words
- Simple prompts with clear structure
- Provide sentence starters
- Focus on familiar topics (family, hobbies, daily routine)

```xml
<p>Write about your best friend (40-50 words). Include:</p>
<ul>
  <li><p>Name and age</p></li>
  <li><p>What they look like</p></li>
  <li><p>Why you like them</p></li>
</ul>
<p><b>Start like this:</b> My best friend's name is...</p>
```

### B1-B2

- 80-150 words
- Opinion or narrative prompts
- Less scaffolding needed
- Can handle abstract topics

### C1-C2

- 150-250 words
- Complex argumentative or analytical tasks
- Minimal scaffolding
- Sophisticated topics and vocabulary expected

## Assessment Criteria Template

```xml
<note>
  <p><b>Marking scheme:</b></p>
  <ul>
    <li><p><b>Content (40%):</b> Addresses all parts of the prompt, relevant ideas</p></li>
    <li><p><b>Organization (20%):</b> Clear structure, logical flow, paragraphing</p></li>
    <li><p><b>Language (25%):</b> Grammar accuracy, vocabulary range</p></li>
    <li><p><b>Communication (15%):</b> Clear meaning, appropriate register</p></li>
  </ul>
</note>
```
