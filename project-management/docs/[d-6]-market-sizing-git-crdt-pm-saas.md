---
status: draft
description: Market sizing analysis for spinning off project-management tooling as a standalone SaaS product
tags: [business, market-research, saas]
---

# Market Sizing: Git-Based CRDT Project Management SaaS

## Executive Summary

A market sizing analysis for spinning off the project-management tooling from this repository as a standalone SaaS product. The concept: a CLI-based, git-native, local-first project management tool that syncs via CRDT/Yjs, making project state instantly accessible to AI agents and visible to non-technical stakeholders.

## Problem Statement

- Development teams waste time context-switching between code/AI agents and traditional PM tools (Jira, Linear)
- AI agents cannot easily update project status in traditional PM tools
- Non-technical stakeholders lack real-time visibility into developer/AI progress
- Traditional PM tools are not optimized for AI-assisted workflows

## Target Customers

- Fast-moving engineering teams (startups, scale-ups, tech-forward enterprises)
- Teams heavily using AI coding assistants (Cursor, Copilot, Claude Code)
- Organizations with both technical and non-technical stakeholders needing visibility

## Market Sizing Results

### TAM (Total Addressable Market): ~$1.4B

Developer-focused PM tools for AI-native teams

### SAM (Serviceable Available Market): ~$65M

Early adopters open to git-based, CRDT-synced workflows

### SOM (Serviceable Obtainable Market): ~$3M ARR

Realistic 5-year target as a bootstrapped/small team

## Three Methodology Breakdown

### Top-Down Analysis

- Global PM software market: ~$7B (2024)
- Developer-focused segment: ~20% = $1.4B
- After filters (AI tools 30%, frustrated with Jira 50%, willing to switch 40%): SAM = $84M

### Bottom-Up Analysis

- Startups (5-50 eng): 150,000 companies x $2,400 ACV = $360M
- Scale-ups (50-500 eng): 30,000 companies x $24,000 ACV = $720M
- Enterprise teams: 5,000 companies x $120,000 ACV = $600M
- TAM = $1.68B, SAM after filters = $50.4M

### Value Theory

- Context switching cost: $9,375/dev/year
- Status meeting overhead: $7,500/dev/year
- AI integration friction: $3,750/dev/year
- Total problem cost: $20,625/dev/year
- Value at 40% efficiency gain: $8,250/dev
- Willingness to pay (15%): ~$100/month/seat

## Favorable Signals

1. **Strong tailwinds**: AI coding adoption accelerating exponentially
2. **Clear pain point**: Developer frustration with Jira is well-documented
3. **Differentiated positioning**: "AI-native" PM is an emerging category
4. **Low competition**: Linear is close but not git-based; no CRDT-first competitors
5. **Technical moat**: CRDT + Yjs expertise is hard to replicate

## Concerns

1. **SAM is relatively small** (~$65M) - Fine for bootstrapped, tight for VC
2. **Behavior change required** - Users must adopt markdown-first workflows
3. **Network effects weak** - Each team is independent
4. **Enterprise sales complexity** - Hard to sell "replace Jira" to large orgs

## Comparable Companies

| Company  | ARR          | Funding      | Notes                                |
| -------- | ------------ | ------------ | ------------------------------------ |
| Linear   | $30M+        | VC-backed    | Developer PM but not git-based       |
| Notion   | $500M+       | VC-backed    | Markdown-ish but not developer-first |
| Obsidian | ~$10M (est.) | Bootstrapped | Local-first markdown with paid sync  |
| Raycast  | Growing      | VC-backed    | Developer productivity, AI-first     |

## Recommendation

- **Bootstrapped indie SaaS**: Strong opportunity. $1-5M ARR is realistic.
- **VC-scale startup**: Would need to expand vision beyond PM (e.g., "operating system for AI agents")

The core insight—AI agents need first-class access to project state, and markdown/git is the natural interface—is solid and timely.
