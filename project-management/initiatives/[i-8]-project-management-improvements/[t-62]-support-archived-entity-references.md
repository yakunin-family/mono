---
status: todo
priority: low
---

# Support Referencing Archived Entities

Currently, referencing an archived entity (e.g., `d-4` after it's moved to `archive/docs/`) causes a validation error. Active documents should be able to reference archived entities without breaking validation.

## Requirements

- References to archived tasks, documents, and initiatives should be valid
- The compile tool should scan `archive/` subdirectories when resolving references
- Consider adding a visual indicator in dashboards for archived references (e.g., strikethrough or "(archived)" suffix)

## Implementation Notes

The reference validation logic is in `tooling/project-management/src/`. Update the entity collection to include archived items when validating references.
