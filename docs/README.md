# Lexly Documentation

Welcome to the Lexly project documentation. This directory contains comprehensive documentation organized by audience and purpose.

## Quick Navigation

### For Product & Business

- **[Product Vision](./01-product-vision.md)** - Product strategy, market analysis, business model
  - Problem statement and solution
  - Target users and pricing
  - Market analysis and competition
  - Growth strategy and metrics
  - Legal and compliance considerations

### For Engineering

- **[Technical Architecture](./02-technical-architecture.md)** - System design and technology choices
  - Current tech stack (implemented)
  - Planned collaboration architecture (Y.js + Hocuspocus)
  - Technology rationale and trade-offs

- **[Data Models](./03-data-models.md)** - Database schemas and data structures
  - Core entities (Convex schema)
  - Exercise and homework models
  - Y.js collaboration persistence

- **[Deployment Guide](./04-deployment-guide.md)** - Infrastructure and hosting
  - Hosting architecture diagram
  - Deployment options (Fly.io, Hetzner, VPS)
  - Multi-region strategy
  - Backup and disaster recovery

- **[Implementation Guide](./05-implementation-guide.md)** - Code examples and patterns
  - Hocuspocus server setup
  - JWT authentication flow
  - Frontend Y.js integration
  - Custom Tiptap nodes

- **[Development Roadmap](./06-development-roadmap.md)** - Features and timeline
  - Current implementation status
  - Feature roadmap (MVP → Launch → Growth)
  - Next steps and priorities

## Documentation Status

| Document | Status | Last Updated | Owner |
|----------|--------|--------------|-------|
| Product Vision | ✅ Current | 2025-01-24 | Product |
| Technical Architecture | ✅ Current | 2025-01-24 | Engineering |
| Data Models | ✅ Current | 2025-01-24 | Engineering |
| Deployment Guide | ✅ Current | 2025-01-24 | DevOps |
| Implementation Guide | ✅ Current | 2025-01-24 | Engineering |
| Development Roadmap | ✅ Current | 2025-01-24 | Product + Eng |

## Quick Reference

**"I want to understand..."**
- ...the product and market → [Product Vision](./01-product-vision.md)
- ...the technical architecture → [Technical Architecture](./02-technical-architecture.md)
- ...how data is structured → [Data Models](./03-data-models.md)
- ...how to deploy the system → [Deployment Guide](./04-deployment-guide.md)
- ...how to implement features → [Implementation Guide](./05-implementation-guide.md)
- ...what we're building next → [Development Roadmap](./06-development-roadmap.md)

## Contributing

When updating documentation:
1. Update the relevant document(s)
2. Update the "Last Updated" date in the document
3. Update the status table above if needed
4. Cross-link related sections between documents

## Archive

Previous documentation:
- `/PRODUCT.md` - Original monolithic documentation (deprecated, see redirect notice in file)
