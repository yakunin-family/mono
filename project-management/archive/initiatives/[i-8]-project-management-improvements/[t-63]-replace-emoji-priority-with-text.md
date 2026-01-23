---
status: done
priority: low
---

# Replace Emoji Priority Display with Plain Text

The dashboard currently uses emojis to display task priorities. Replace these with plain text labels for better compatibility and readability.

## Current Behavior

Priority is shown with emojis (e.g., 🔴 for critical, 🟡 for medium).

## Expected Behavior

Priority should be shown as plain text (e.g., "critical", "high", "medium", "low").

## Implementation

Update the dashboard template in `tooling/project-management/templates/` to use text instead of emoji indicators.
