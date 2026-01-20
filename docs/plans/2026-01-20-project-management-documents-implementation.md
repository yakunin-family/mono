# Implementation Plan: Project Management Documents & Unified Reference System

**Design Document:** [2026-01-20-project-management-documents-design.md](./2026-01-20-project-management-documents-design.md)

## Phase 1: Setup & Cleanup

### 1.1 Remove Example Files
- Delete `project-management/tasks/example-task.md`
- Delete `project-management/tasks/example-task-1.md`
- Delete `project-management/initiatives/example-initiative/` folder

### 1.2 Create New Folder Structure
- Create `project-management/docs/` directory
- Create `project-management/_meta/` directory
- Create `project-management/archive/docs/` directory

### 1.3 Initialize Counter File
- Create `project-management/_meta/counters.json` with initial values:
```json
{
  "t": 0,
  "d": 0,
  "i": 0
}
```

## Phase 2: Type Definitions

### 2.1 Update `tooling/project-management/src/types.ts`

**Add new types:**
```typescript
// Entity prefixes
type EntityPrefix = "t" | "d" | "i";

// Parsed filename info
interface ParsedFilename {
  prefix: EntityPrefix;
  id: number;
  fullId: string;  // e.g., "t-1"
  title: string;   // kebab-case from filename
  displayTitle: string;  // Title Case for display
}

// Document type
interface Document {
  id: string;  // e.g., "d-1"
  title: string;
  description?: string;
  tags?: string[];
  references?: string[];
  filePath: string;
  content: string;
}

interface DocumentFrontmatter {
  description?: string;
  tags?: string[];
  references?: string[];
}

// Counter file structure
interface Counters {
  t: number;
  d: number;
  i: number;
}

// Reference types
interface ParsedReference {
  raw: string;           // Original string, e.g., "blocked-by:i-1/t-3"
  relationship?: "blocked-by";  // Only blocking supported for now
  initiative?: string;   // e.g., "i-1" if scoped to initiative
  targetId: string;      // e.g., "t-3", "d-1", "i-1"
  targetType: EntityPrefix;
}
```

**Update existing types:**
- Remove `id` and `title` from `TaskFrontmatter` (derived from filename)
- Remove `assignee`, `dueDate` from `Task` and `TaskFrontmatter`
- Add `description` and `references` to `Task` and `TaskFrontmatter`
- Remove `blockedBy`, `blocks`, `relatedTo`, `initiative` from `Task` (replaced by `references`)
- Remove `id`, `title`, `owner`, `startDate`, `targetDate` from `InitiativeFrontmatter`
- Add `references` to `Initiative` and `InitiativeFrontmatter`

## Phase 3: Utility Functions

### 3.1 Update `tooling/project-management/src/utils.ts`

**Add filename parsing:**
```typescript
// Parse filename like "[t-1]-implement-auth.md"
function parseFilename(filename: string): ParsedFilename | null

// Convert kebab-case to Title Case
function toDisplayTitle(kebabCase: string): string

// Validate filename format
function isValidFilename(filename: string, expectedPrefix?: EntityPrefix): boolean
```

**Add reference parsing:**
```typescript
// Parse reference string like "blocked-by:i-1/t-3"
function parseReference(ref: string): ParsedReference | null

// Parse references array from frontmatter
function parseReferences(refs: string[] | string | undefined): ParsedReference[]

// Validate reference exists
function validateReference(ref: ParsedReference, context: ValidationContext): ValidationError | null
```

**Add counter utilities:**
```typescript
// Read counters file
function readCounters(metaPath: string): Promise<Counters>

// Write counters file
function writeCounters(metaPath: string, counters: Counters): Promise<void>

// Validate ID against counter
function validateIdAgainstCounter(id: string, counters: Counters): ValidationError | null
```

**Update validation functions:**
- Update `validateTaskFrontmatterWithErrors` for new schema (no id/title, add description/references)
- Add `validateDocumentFrontmatterWithErrors`
- Update `validateInitiativeFrontmatterWithErrors` for new schema

## Phase 4: Collector Updates

### 4.1 Update `tooling/project-management/src/collector.ts`

**Update `CollectionResult`:**
```typescript
interface CollectionResult {
  tasks: Task[];
  documents: Document[];  // NEW
  initiatives: Initiative[];
  taskMap: Map<string, Task>;
  documentMap: Map<string, Document>;  // NEW
  counters: Counters;  // NEW
  warnings: string[];
  validationErrors: ValidationError[];
}
```

**Add document collection:**
- Add `findDocumentFiles()` method to find `docs/[d-x]-*.md` files
- Add `parseDocumentFile()` method to parse document frontmatter and content
- Extract id/title from filename instead of frontmatter

**Update task collection:**
- Update `parseTaskFile()` to extract id/title from filename
- Update `findTaskFiles()` patterns to match `[t-x]-*.md` format
- Handle tasks in both `tasks/` and `initiatives/[i-x]-*/` folders

**Update initiative collection:**
- Update `parseInitiativeFile()` to extract id/title from folder name
- Update `findInitiativeFiles()` to match `initiatives/[i-x]-*/README.md` format

**Add validation:**
- Validate all filenames match expected patterns
- Validate no duplicate IDs across all entities
- Validate all references point to existing entities
- Validate IDs don't exceed counter values
- Read and validate against `_meta/counters.json`

**Update `collect()` method:**
- Collect documents alongside tasks and initiatives
- Build document map for reference validation
- Cross-validate references between all entity types

## Phase 5: Generator Updates

### 5.1 Update `tooling/project-management/src/generator.ts`

**Add documents view generation:**
```typescript
// Generate _views/documents.md
function generateDocumentsView(documents: Document[]): string
```

Format as simple table:
```markdown
# Documents

**Last Updated:** {timestamp}

| ID | Title | Description | Tags |
|----|-------|-------------|------|
| [d-1](../docs/[d-1]-auth-design.md) | Auth Design | ... | design, auth |
```

**Update dashboard generation:**
- Update task links to use new filename format
- Update initiative links to use new filename format
- Update blocked tasks section to parse `references` field for `blocked-by:` relationships
- Show blocker location context (standalone vs in initiative)

**Update errors generation:**
- Add filename format errors
- Add duplicate ID errors
- Add invalid reference errors
- Add counter mismatch errors

## Phase 6: Main Entry Point

### 6.1 Update `tooling/project-management/src/index.ts`

- Update to generate `documents.md` alongside `dashboard.md` and `errors.md`
- Read counters file during collection
- Pass counters to validation

## Phase 7: Agent Documentation

### 7.1 Update `project-management/agents.md`

Update the entire guide to reflect:
- New file naming convention with examples
- New frontmatter schemas (task, document, initiative)
- Reference syntax with examples
- Counter file workflow
- Updated agent workflows for creating/updating entities
- Emphasis on checking `errors.md` after changes

### 7.2 Update template
- Update `tooling/project-management/templates/agents-guide.md` (source for agents.md)

## Phase 8: Testing

### 8.1 Create Test Files
Create sample files to verify the system works:
- `project-management/tasks/[t-1]-sample-task.md`
- `project-management/docs/[d-1]-sample-doc.md`
- `project-management/initiatives/[i-1]-sample-initiative/README.md`
- `project-management/initiatives/[i-1]-sample-initiative/[t-2]-initiative-task.md`
- Update `_meta/counters.json` to `{"t": 2, "d": 1, "i": 1}`

### 8.2 Verify
- Run generator and check `_views/dashboard.md` renders correctly
- Check `_views/documents.md` is generated
- Check `_views/errors.md` shows no errors
- Test validation by creating intentional errors

## Implementation Order

1. **Phase 1** - Setup (quick, no code changes)
2. **Phase 2** - Types (foundation for everything else)
3. **Phase 3** - Utils (parsing/validation functions)
4. **Phase 4** - Collector (most complex, core logic)
5. **Phase 5** - Generator (depends on collector changes)
6. **Phase 6** - Entry point (wire everything together)
7. **Phase 7** - Documentation (can be done in parallel)
8. **Phase 8** - Testing (verify everything works)

## Estimated Complexity

| Phase | Files Changed | Complexity |
|-------|---------------|------------|
| 1. Setup | 0 (file ops) | Low |
| 2. Types | 1 | Low |
| 3. Utils | 1 | Medium |
| 4. Collector | 1 | High |
| 5. Generator | 1 | Medium |
| 6. Entry | 1 | Low |
| 7. Docs | 2 | Low |
| 8. Testing | 4-5 | Low |
