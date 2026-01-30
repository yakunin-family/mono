---
type: tool
id: search_tool
description: "Search a knowledge base for documents matching a query"
args:
  - name: query
    type: string
    required: true
    description: "Search query"
  - name: limit
    type: number
    required: false
    description: "Maximum number of results"
    default: 5
---

Use this tool to find documents relevant to a user's question.
