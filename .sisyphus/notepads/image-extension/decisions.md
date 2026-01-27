# Architectural Decisions

## [2026-01-27T19:30] Initial Plan

### Storage Strategy

- **Decision**: Store `storageId` in node attributes, resolve URL at render time
- **Rationale**: Convex URLs may expire; storageId provides stable reference

### Extension Type

- **Decision**: Block node with no nested content
- **Rationale**: Images are atomic elements, simpler than container pattern

### Upload Flow

- **Decision**: Three entry points (toolbar, slash, paste)
- **Rationale**: Maximize user flexibility and discoverability
