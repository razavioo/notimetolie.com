
# **Project: No Time To Lie - A Living Knowledge Infrastructure**
---

## **Table of Contents**

1.  [**Core Vision & Strategy**](#1-core-vision--strategy)
    *   [1.1. Mission Statement](#11-mission-statement)
    *   [1.2. Core Value Propositions](#12-core-value-propositions)
    *   [1.3. Content Scope](#13-content-scope)
2.  [**Information Architecture & Data Model**](#2-information-architecture--data-model)
    *   [2.1. Official Glossary](#21-official-glossary)
    *   [2.2. Content Architecture: A Flexible Two-Level Hierarchy](#22-content-architecture)
    *   [2.3. Block Types Specification](#23-block-types-specification)
    *   [2.4. Database Schema Design](#24-database-schema-design)
3.  [**Technical Architecture & Technology Stack**](#3-technical-architecture--technology-stack)
    *   [3.1. High-Level System Architecture](#31-high-level-system-architecture)
    *   [3.2. Final Technology Stack (Q4 2025 Stable Releases)](#32-final-technology-stack)
    *   [3.3. Model Context Protocol (MCP) Implementation](#33-model-context-protocol-mcp-implementation)
4.  [**Key Systems & Integration Strategy**](#4-key-systems--integration-strategy)
    *   [4.1. Event-Driven Architecture for Seamless Integration](#41-event-driven-architecture)
    *   [4.2. Permission System: Hybrid RBAC + ABAC Model](#42-permission-system)
5.  [**User Experience & Operational Flows**](#5-user-experience--operational-flows)
    *   [5.1. Content Creation Flow](#51-content-creation-flow)
    *   [5.2. Edit Suggestion Flow](#52-edit-suggestion-flow)
    *   [5.3. Content Embedding Flow](#53-content-embedding-flow)
6.  [**Content Strategy & Quality Control**](#6-content-strategy--quality-control)
    *   [6.1. Quality Assurance (QA) Process](#61-quality-assurance-qa-process)
    *   [6.2. The Role of AI: The Smart Assistant](#62-the-role-of-ai)
7.  [**Monetization & Gamification Model**](#7-monetization--gamification-model)
    *   [7.1. Gamification Engine: Progression through Contribution](#71-gamification-engine)
    *   [7.2. Multi-Layered Monetization Strategy](#72-multi-layered-monetization-strategy)
8.  [**Project Structure & Implementation Guidelines**](#8-project-structure--implementation-guidelines)
    *   [8.1. Monorepo Directory Structure](#81-monorepo-directory-structure)
    *   [8.2. Coding Standards & Conventions](#82-coding-standards--conventions)
9.  [**Operational Requirements & SLA**](#9-operational-requirements--sla)
10. [**Why Build From Scratch? A Strategic Analysis**](#10-why-build-from-scratch)
11. [**Appendix: Core API Endpoints**](#11-appendix-core-api-endpoints)

---

## **1. Core Vision & Strategy**

### **1.1. Mission Statement**
"No Time To Lie" is a **Living Knowledge Infrastructure** designed to deliver verifiable, factual knowledge in a modular, perpetually up-to-date, and embeddable format. We are the **Single Source of Truth (SSoT)** for procedural "How-To" guides and factual knowledge.

### **1.2. Core Value Propositions**
*   **For End-Users (B2C):**
    *   **Guaranteed Accuracy:** Every piece of information is traceable and verifiable.
    *   **Continuous Updates:** Content evolves in sync with real-world changes.
    *   **Seamless Experience:** No more jumping between multiple, often conflicting, websites to get a complete answer.

*   **For Businesses & Websites (B2B):**
    *   **Content-as-a-Service (CaaS):** Production-ready, embeddable content via API or SDK.
    *   **Zero Maintenance:** Eliminates the need for an in-house content team to create or maintain guides.
    *   **Guaranteed SLA:** 99.9% uptime and dedicated technical support.

### **1.3. Content Scope**
*   ✅ **Allowed Content:** Software and technical tutorials, administrative and legal guides, step-by-step processes with clear outcomes, and verifiable factual information.
*   ❌ **Disallowed Content:** Personal opinions, controversial or political articles, non-expert health advice, sexually explicit or violent material, and any content whose veracity cannot be objectively proven.

## **2. Information Architecture & Data Model**

### **2.1. Official Glossary**
*   **Block:** The smallest atomic unit of knowledge. Each Block is self-contained, meaningful, and has a unique URL.
*   **Path:** An ordered collection of Blocks that form a complete guide or learning journey. A Path is analogous to a "page" or a "course."
*   **Builder:** A registered and verified user who contributes to the knowledge ecosystem.
*   **Revision:** A snapshot of a Block's history. Every change, major or minor, is stored as a new Revision.
*   **Edit Suggestion:** A proposed change to a Block, similar to a Pull Request in Git.

### **2.2. Content Architecture: A Flexible Two-Level Hierarchy**
The data architecture is based on a self-referencing model, currently constrained to two levels to ensure simplicity and performance:
*   **Level 0 (Path):** An entity that serves as a container for children.
*   **Level 1 (Block):** An entity that cannot have its own children.
This model is implemented to be flexible; the depth constraint can be increased in the future with a single configuration change (`MAX_DEPTH`) if the product strategy requires it, without needing a fundamental data model migration.

### **2.3. Block Types Specification**
The content editor will support a rich set of block types, including: Text (with full formatting), Image (with optimization), Video (embeds), Code Snippet (with syntax highlighting), External Link, Internal Link, **Embedded Block** (transclusion), Callouts, and Tables.

### **2.4. Database Schema Design**
The core schema is centered around a `content_nodes` table, supported by tables for revisions, suggestions, and user feedback. All tables will use UUIDs as primary keys. Timestamps will follow the ISO 8601 standard and be stored in UTC.

*(For detailed SQL `CREATE TABLE` statements, refer to the previous response's comprehensive schema design, which remains valid for this version.)*

## **3. Technical Architecture & Technology Stack**

### **3.1. High-Level System Architecture**
The architecture is a multi-layered system designed for scalability and maintainability. It features a decoupled frontend, a central API Gateway, a business logic layer composed of logical microservices, and a robust data layer. An **Event Bus** orchestrates asynchronous communication between services.

*(A visual diagram representing this architecture would be placed here in a real README.)*

### **3.2. Final Technology Stack (Q4 2025 Stable Releases)**
*   **Backend:**
    *   **Language:** Python 3.14
    *   **Framework:** FastAPI ~0.115.0
    *   **ORM:** SQLAlchemy 2.1 (async)
    *   **Validation:** Pydantic 2.8

*   **Frontend:**
    *   **Framework:** Next.js 16 (App Router)
    *   **Language:** TypeScript 5.7
    *   **Styling:** Tailwind CSS 4.x
    *   **Editor:** **BlockNote**

*   **Data Tier:**
    *   **Primary DB:** PostgreSQL 18
    *   **Search Engine:** Meilisearch 1.9
    *   **Cache & Queue:** Redis 8.0
    *   **File Storage:** MinIO (S3-compatible, self-hosted)

*   **Infrastructure & DevOps:**
    *   **Containerization:** Docker Engine + Docker Compose
    *   **Reverse Proxy:** Nginx (Mainline)
    *   **Monitoring:** Prometheus, Grafana (LTS)
    *   **Operations:** Sentry, Plausible Analytics, Apprise (self-hosted)
    *   **CI/CD:** GitHub Actions

### **3.3. Model Context Protocol (MCP) Implementation**
Our REST APIs will serve as the foundation. To support MCP, a FastAPI middleware will be developed to automatically wrap Pydantic-based responses into a rich, structured JSON-LD format compliant with schema.org. This facilitates machine-to-machine interaction and enhances SEO.

## **4. Key Systems & Integration Strategy**

### **4.1. Event-Driven Architecture for Seamless Integration**
To manage complexity and ensure decoupling, all inter-service communication is handled by an Event Bus.
*   **Key Events:** `BlockCreated`, `BlockUpdated`, `SuggestionSubmitted`, `FlagRaised`, `UserLeveledUp`, `RevisionCreated`.
*   **Listener Services:**
    *   **Search Service:** Subscribes to content events to keep Meilisearch in sync.
    *   **Gamification Service:** Subscribes to contribution events to award XP.
    *   **Notification Service:** Subscribes to key events to notify users.
    *   **Audit Service:** Subscribes to all events to maintain a comprehensive audit log.

### **4.2. Permission System: Hybrid RBAC + ABAC Model**
A hybrid model provides both broad role-based access and fine-grained, attribute-based control.
*   **Roles (RBAC):** Guest, Builder, Trusted Builder, Moderator, Admin.
*   **Attribute-Based Logic (ABAC):** Complex permissions are determined dynamically based on user attributes (e.g., XP score) and content attributes (e.g., "locked" status).

## **5. User Experience & Operational Flows**

### **5.1. Content Creation Flow**
A streamlined, two-step process:
1.  **Create Block:** The Builder creates a new unit of knowledge in a focused, distraction-free block editor.
2.  **Compose Path:** The Builder uses a visual interface to search for, select, and arrange Blocks into a coherent Path using drag-and-drop.

### **5.2. Edit Suggestion Flow**
1.  A Builder clicks "Suggest an Edit" on a Block.
2.  A sandboxed version of the editor opens with the Block's content.
3.  The Builder makes changes and writes a mandatory "Change Summary."
4.  The suggestion is submitted, triggering notifications to the content owner and moderators.
5.  Upon approval, a new Revision is created, and the original Block is updated. Moderators can approve or reject suggestions via `/v1/moderation/suggestions/{id}/approve` and `/v1/moderation/suggestions/{id}/reject`. Approved suggestions award XP to the author and update the block content.

### **5.3. Content Embedding Flow**
Every public Path and Block will have a "Share" panel providing a simple `iframe` snippet and a more advanced JavaScript SDK for embedding. The content served is always the latest approved revision.

## **6. Content Strategy & Quality Control**

### **6.1. Quality Assurance (QA) Process**
*   **Pre-Moderation:** New content from standard Builders requires approval from a Moderator or Trusted Builder before publication.
*   **Stale Content Review:** An automated system flags content that hasn't been updated for a set period (e.g., 6 months) for mandatory review.
*   **Community Feedback Loop:** Flags submitted by any user are triaged in a moderation dashboard, prioritized by severity and frequency.

### **6.2. The Role of AI: The Smart Assistant**
AI functions as a powerful **assistant** to empower human Builders, not replace them.
*   **Use Cases:** Brainstorming, structuring content, improving clarity, and generating translation drafts.
*   **Golden Rule:** Every piece of AI-assisted content must be reviewed, edited, and explicitly approved by a human Builder before publication.

## **7. Monetization & Gamification Model**

### **7.1. Gamification Engine: Progression through Contribution**
*   **Core System:** Based on Experience Points (XP), Levels, and Badges.
*   **Progression Logic:** Earning XP through positive contributions unlocks higher permission levels, granting more autonomy and trust within the system.

### **7.2. Multi-Layered Monetization Strategy**
*   **Primary Model (B2B):** A subscription-based CaaS model for embedding content. Includes a generous free tier (e.g., up to 1,000 views/month) and paid plans for higher traffic.
*   **Secondary Model (B2C - Future):** Introduction of a Premium subscription for end-users, offering access to exclusive content, advanced AI tools, and in-depth analytics.
*   **XP vs. Money:**
    *   **XP:** Used for reputation, unlocking permissions, and earning discounts on subscriptions.
    *   **Real Money:** Required for purchasing subscriptions.
    *   **Revenue Sharing:** Any rev-share model with top Builders will be based solely on actual revenue generated.

## **8. Project Structure & Implementation Guidelines**

### **8.1. Monorepo Directory Structure**
A monorepo structure will be used to manage the entire project, facilitating code sharing and streamlined CI/CD.

```
/notimetolie
├── .github/              # CI/CD workflows
├── apps/
│   ├── api/              # FastAPI application
│   └── web/              # Next.js application
├── packages/
│   ├── ui/               # Shared React components (shadcn/ui)
│   ├── config/           # Shared configurations (ESLint, TSConfig)
│   └── shared-types/     # Shared Pydantic/Zod types
├── infrastructure/
│   ├── docker/           # Dockerfiles and docker-compose.yml
│   └── terraform/        # Infrastructure as Code (optional)
├── docs/                 # Project documentation
├── .gitignore
├── package.json
└── README.md
```

### **8.2. Coding Standards & Conventions**
*   **Backend:** PEP 8, Black for formatting, isort for imports, and type hinting via Pydantic.
*   **Frontend:** Prettier for formatting, ESLint for linting, and Conventional Commits for Git messages.
*   **API:** Adherence to RESTful principles. All endpoints will be versioned (`/v1/...`).

## **9. Operational Requirements & SLA**

*   **Service Level Agreement (SLA):** A 99.9% uptime guarantee for the embedding service will be offered to all B2B customers on paid plans.
*   **Backup & Recovery:** Daily automated backups of the PostgreSQL database, stored in a separate, geo-redundant location. Disaster recovery drills will be conducted quarterly.
*   **Security:** Adherence to OWASP Top 10 best practices, mandatory security code reviews, regular dependency scanning, and annual third-party penetration testing.

## **10. Why Build From Scratch? A Strategic Analysis**

A common question is why not leverage existing open-source platforms like wikis or headless CMSs. The answer lies in the unique synthesis of our requirements, which no single platform provides out-of-the-box.

| Feature | Traditional Wiki (e.g., MediaWiki) | Headless CMS (e.g., Strapi) | No Time To Lie (Our Solution) |
| :--- | :--- | :--- | :--- |
| **Content Unit** | Monolithic Page | Flexible Data Models | **Atomic, Reusable Blocks** |
| **Structure** | Unstructured (Hyperlinks) | Unstructured (API-driven) | **Structured, Hierarchical Paths** |
| **Delivery Model** | Destination Website | Headless API | **Embeddable Content-as-a-Service** |
| **Quality Control** | Post-moderation | Admin-driven | **Pre-moderation & Community Review** |
| **Core Philosophy** | Encyclopedia | Content Repository | **Living Knowledge Playbooks** |

Attempting to force a wiki to be a CaaS platform or a headless CMS to have a wiki-style contribution model would result in a fragile, unmaintainable system. **Building from scratch is a strategic decision** to create a purpose-built, highly optimized platform that can deliver on our unique value proposition without compromise.

## **11. Appendix: Core API Endpoints**

*   `POST /v1/blocks`: Create a new Block.
*   `GET /v1/blocks/{slug}`: Retrieve a public Block.
*   `POST /v1/blocks/{id}/suggestions`: Submit an Edit Suggestion for a Block.
*   `POST /v1/paths`: Create a new Path with an ordered list of Block IDs.
*   `GET /v1/paths/{slug}`: Retrieve a full Path with its Blocks.
*   `GET /v1/search?q={query}`: Perform a search across content.
*   `GET /v1/embed/{node_type}/{id}`: The endpoint for the embedding service.
