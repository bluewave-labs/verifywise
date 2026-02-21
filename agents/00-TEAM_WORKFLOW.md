# Team Workflow Orchestration

## Overview

This document defines the end-to-end workflow for how the 11-agent team collaborates on any task — from initial request through deployment. It establishes the order of operations, handoff protocols, iteration loops, and escalation paths that govern how work flows between agents.

Every task follows the same lifecycle. The depth and duration of each phase scales with task complexity, but the sequence never changes.

---

## Workflow Lifecycle

```
REQUEST → DEFINE → DESIGN → PLAN → BUILD → TEST → REVIEW → DEPLOY → RETROSPECT
```

---

## Phase 1: Request Intake

**Owner:** Product Manager
**Duration:** 1 cycle

The Product Manager receives or identifies a task and produces the initial specification.

### Actions

1. Analyze the request against the product roadmap, user needs, and business objectives.
2. Write a Product Requirements Document (PRD) containing:
   - Problem statement and user impact
   - Success metrics (quantitative, measurable)
   - Scope and explicit out-of-scope boundaries
   - User stories with acceptance criteria
   - Priority classification (Critical / High / Medium / Low)
   - Dependencies on other in-flight work
3. Classify the task size:
   - **Small** — Single component, single layer, < 1 day of work. Skip Phase 3 (Design) if no UI changes.
   - **Medium** — Multiple components, may span frontend and backend, 1–3 days of work.
   - **Large** — Cross-cutting feature, multiple layers, > 3 days of work. Full lifecycle required.

### Handoff

Product Manager passes the PRD to the **Technical Lead** and the **UX/UI Designer** simultaneously.

---

## Phase 2: Technical & Design Assessment

**Owners:** Technical Lead + UX/UI Designer (parallel)
**Duration:** 1 cycle

The Technical Lead and UX/UI Designer independently assess the PRD from their perspectives, then align.

### Technical Lead Actions

1. Review the PRD for technical feasibility and ambiguity.
2. Identify:
   - Affected system layers (domain, application, infrastructure, presentation)
   - Affected files, modules, and services
   - Technical risks and unknowns
   - Dependencies on other teams, services, or migrations
3. Produce an **Architecture Brief** containing:
   - High-level approach and rationale
   - Data model changes (if any)
   - API contract changes or new endpoints (if any)
   - Breaking change assessment
   - Preliminary task decomposition

### UX/UI Designer Actions

1. Review the PRD for user experience implications.
2. Identify:
   - Affected screens, flows, and interaction patterns
   - New components or modifications to existing components
   - Design system impact (new tokens, patterns, or components needed)
   - Accessibility considerations
3. Produce either:
   - **Small tasks**: Annotated wireframe or reference to existing component patterns
   - **Medium/Large tasks**: Full user flow diagrams and high-fidelity mockups with state specifications (default, hover, active, disabled, loading, error, empty)

### Alignment Checkpoint

The Technical Lead and UX/UI Designer sync to resolve conflicts:
- If a design is technically infeasible, the Designer proposes alternatives.
- If a technical approach degrades UX, the Technical Lead proposes alternatives.
- If scope is ambiguous, both escalate to the Product Manager for clarification.

### Handoff

Technical Lead's Architecture Brief and Designer's specifications are combined into the **Implementation Package** and passed to Phase 3.

---

## Phase 3: Task Decomposition & Assignment

**Owner:** Technical Lead
**Duration:** 1 cycle

The Technical Lead breaks the Implementation Package into executable tasks, sequences them, and assigns them to agents.

### Actions

1. Decompose the work into atomic tasks, each:
   - Assignable to a single agent
   - Completable in one work session
   - Independently testable
   - Having clear inputs and outputs
2. Define the **dependency graph** — which tasks block which.
3. Identify tasks that can run in **parallel** vs. tasks that must run **sequentially**.
4. Assign tasks to agents based on the following routing:

### Agent Assignment Matrix

| Task Type | Primary Agent | Fallback Agent |
|-----------|---------------|----------------|
| Domain entities, business rules | Senior Backend Developer | Mid Backend Developer |
| API endpoints (complex) | Senior Backend Developer | Mid Backend Developer |
| API endpoints (CRUD, standard) | Mid Backend Developer | Junior Backend Developer |
| Database migrations, schema changes | Senior Backend Developer | Mid Backend Developer |
| Complex UI components, new patterns | Senior Frontend Developer | Mid Frontend Developer |
| Standard UI components, features | Mid Frontend Developer | Junior Frontend Developer |
| Styling, content updates, minor UI fixes | Junior Frontend Developer | Mid Frontend Developer |
| Integration wiring (frontend ↔ backend) | Senior Frontend Developer + Senior Backend Developer | Mid-level pair |
| Test strategy, E2E tests, performance tests | QA Engineer | — |
| CI/CD, infrastructure, deployment | DevOps Engineer | — |
| Bug fixes (backend) | Mid Backend Developer | Junior Backend Developer |
| Bug fixes (frontend) | Mid Frontend Developer | Junior Frontend Developer |

5. Produce the **Task Board** — a structured list of all tasks with:
   - Task ID
   - Description
   - Assigned agent
   - Dependencies (blocked by)
   - Estimated effort
   - Acceptance criteria

### Handoff

Task Board is published to all agents. Agents begin Phase 4 according to the dependency graph.

---

## Phase 4: Implementation

**Owners:** All Development Agents (parallel where possible)
**Duration:** Variable (the longest phase)

This is the core build phase. Agents work on their assigned tasks according to the dependency graph. The Technical Lead monitors progress and unblocks issues.

### Execution Order

The dependency graph determines execution order. A typical feature flows as:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Wave 1 (Parallel)                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐     │
│  │ Senior Backend Dev   │  │ UX/UI Designer                   │     │
│  │ → Domain entities    │  │ → Final design specs & assets    │     │
│  │ → Business rules     │  │ → Component documentation        │     │
│  └──────────┬───────────┘  └──────────────┬───────────────────┘     │
│             │                              │                         │
│  Wave 2 (Parallel, after Wave 1)                                    │
│  ┌──────────┴───────────┐  ┌──────────────┴───────────────────┐     │
│  │ Senior/Mid Backend   │  │ Senior Frontend Dev              │     │
│  │ → API endpoints      │  │ → Core UI components             │     │
│  │ → Database migrations│  │ → State management               │     │
│  │ → Service integrations│ │ → API integration layer          │     │
│  └──────────┬───────────┘  └──────────────┬───────────────────┘     │
│             │                              │                         │
│  Wave 3 (Parallel, after Wave 2)                                    │
│  ┌──────────┴───────────┐  ┌──────────────┴───────────────────┐     │
│  │ Mid/Junior Backend   │  │ Mid/Junior Frontend Dev          │     │
│  │ → Supporting endpoints│ │ → Secondary UI components        │     │
│  │ → Data transformations│ │ → Form handling, validation      │     │
│  │ → Utility functions  │  │ → Responsive adjustments         │     │
│  └──────────┬───────────┘  └──────────────┬───────────────────┘     │
│             │                              │                         │
│  Wave 4 (After Wave 3)                                              │
│  ┌──────────┴──────────────────────────────┴───────────────────┐    │
│  │ Integration Wiring                                          │    │
│  │ → Connect frontend to backend APIs                          │    │
│  │ → End-to-end data flow verification                         │    │
│  │ → Error handling and edge case coverage                     │    │
│  └──────────┬──────────────────────────────────────────────────┘    │
│             │                                                       │
│  Continuous (runs alongside Waves 2–4)                              │
│  ┌──────────┴──────────────────────────────────────────────────┐    │
│  │ QA Engineer                                                 │    │
│  │ → Writes test cases from acceptance criteria                │    │
│  │ → Builds E2E test scaffolding                               │    │
│  │ → Reviews completed work as it lands                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Continuous (runs alongside all waves)                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ DevOps Engineer                                             │    │
│  │ → Prepares infrastructure changes                           │    │
│  │ → Updates CI pipeline for new test/build requirements       │    │
│  │ → Configures staging environment                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Rules for All Agents

1. **Before starting**: Read your assigned task, its acceptance criteria, and all dependency outputs (API contracts, design specs, domain interfaces).
2. **During implementation**: Follow the project's coding standards, architecture patterns, and conventions defined in CLAUDE.md.
3. **Write tests as you build**: Every piece of logic gets a test. Don't defer testing to the end.
4. **After completing**: Run linting, type checking, and all relevant tests locally. Only mark a task as complete when everything passes.
5. **If blocked**: Immediately notify the Technical Lead with: what you're blocked on, which agent or artifact you need, and what you've tried.

### API Contract Protocol

When frontend and backend agents need to coordinate on an API:

1. The **Senior Backend Developer** publishes the API contract first: endpoint path, method, request schema, response schema, error codes.
2. The **Senior Frontend Developer** reviews and confirms or requests changes.
3. Once agreed, both sides implement independently against the contract.
4. Neither side deviates from the agreed contract without notifying the other.

### Conflict Resolution

- **Two agents need the same file**: The Technical Lead sequences the work. The agent with the foundational change goes first.
- **Disagreement on approach**: Escalate to the Technical Lead. The Technical Lead decides based on architecture consistency and team capability.
- **Scope creep discovered during implementation**: The implementing agent flags it. The Technical Lead and Product Manager decide whether to absorb, defer, or split.

---

## Phase 5: Code Review

**Owner:** Technical Lead + Peer Reviewers
**Duration:** 1 cycle per task

Every task goes through code review before it is considered complete.

### Review Routing

| Code Author | Primary Reviewer | Secondary Reviewer |
|-------------|------------------|--------------------|
| Junior Frontend Developer | Senior Frontend Developer | — |
| Mid Frontend Developer | Senior Frontend Developer | Technical Lead (for architectural changes) |
| Senior Frontend Developer | Technical Lead | Mid Frontend Developer (for knowledge sharing) |
| Junior Backend Developer | Senior Backend Developer | — |
| Mid Backend Developer | Senior Backend Developer | Technical Lead (for architectural changes) |
| Senior Backend Developer | Technical Lead | Mid Backend Developer (for knowledge sharing) |
| DevOps Engineer | Technical Lead | Senior Backend Developer (for infra-code interactions) |

### Review Checklist

Every reviewer evaluates against:

1. **Correctness** — Does it do what the acceptance criteria specify?
2. **Architecture** — Does it follow established patterns? Does it belong in the right layer?
3. **Security** — Are inputs validated? Is authentication/authorization enforced? Are there injection risks?
4. **Performance** — Are there unnecessary re-renders, N+1 queries, unbounded loops, or missing indexes?
5. **Testability** — Are tests present, meaningful, and covering edge cases?
6. **Readability** — Can another developer understand this without explanation?
7. **Consistency** — Does it match the existing codebase conventions?

### Review Iteration Loop

```
Author submits code
       │
       ▼
Reviewer evaluates ──── Approved ───► Move to Phase 6
       │
   Changes Requested
       │
       ▼
Author addresses feedback
       │
       ▼
Re-submit for review (repeat until approved, max 3 iterations)
       │
  If 3+ iterations without resolution
       │
       ▼
Escalate to Technical Lead for pair session
```

---

## Phase 6: Quality Assurance

**Owner:** QA Engineer
**Duration:** 1–2 cycles

After code review approval, the QA Engineer performs dedicated testing.

### QA Sequence

1. **Acceptance Testing** — Verify every acceptance criterion from the user story is met.
2. **Integration Testing** — Run the full feature end-to-end across all layers.
3. **Exploratory Testing** — Test edge cases, unusual inputs, rapid interactions, network failures, and boundary conditions not covered by acceptance criteria.
4. **Regression Testing** — Run the full regression suite to ensure nothing existing is broken.
5. **Cross-browser/Device Testing** — For frontend changes, verify across target browsers and screen sizes.
6. **Accessibility Testing** — Keyboard navigation, screen reader compatibility, color contrast.
7. **Performance Spot Check** — Verify no significant performance regressions in affected areas.

### QA Feedback Loop

```
QA Engineer tests
       │
       ├── All tests pass ───► Move to Phase 7
       │
       └── Issues found
              │
              ▼
       Bug reports filed with:
       - Steps to reproduce
       - Expected vs. actual behavior
       - Severity classification
       - Screenshots/logs
              │
              ▼
       Assigned back to original author
              │
              ▼
       Author fixes + adds regression test
              │
              ▼
       Re-submit to QA (repeat until clean)
              │
       If same issue recurs 3+ times
              │
              ▼
       Escalate to Technical Lead — potential architectural issue
```

---

## Phase 7: Staging & Deployment

**Owner:** DevOps Engineer
**Duration:** 1 cycle

Once QA signs off, the DevOps Engineer deploys to staging and then production.

### Deployment Sequence

1. **Pre-deployment Checklist**
   - All code reviews approved
   - QA sign-off received
   - Database migrations tested in staging
   - Environment variables and secrets configured
   - Rollback procedure documented and tested
   - Monitoring and alerting configured for new endpoints/features

2. **Staging Deployment**
   - Deploy to staging environment
   - Run automated smoke tests
   - QA Engineer performs a final sanity check in staging
   - Product Manager validates the feature matches requirements

3. **Production Deployment**
   - Deploy using the established strategy (blue-green, canary, rolling)
   - Monitor error rates, latency, and key business metrics for 30 minutes post-deploy
   - If anomalies detected: execute rollback immediately, then investigate

4. **Post-deployment**
   - Confirm all monitoring dashboards are green
   - Notify the Product Manager that the feature is live
   - Product Manager writes release notes and stakeholder communications

### Rollback Triggers

Deploy is rolled back immediately if any of the following occur:
- Error rate increases by more than 2x baseline
- P95 latency exceeds 2x baseline
- Any Critical severity bug is discovered
- Data integrity issue is detected
- Health check failures exceed threshold

---

## Phase 8: Retrospective & Closure

**Owner:** Product Manager + Technical Lead
**Duration:** 1 cycle

After deployment, the team closes the loop.

### Actions

1. **Product Manager** validates success metrics against the PRD's defined criteria.
2. **Technical Lead** updates the tech debt register if new debt was intentionally introduced.
3. **QA Engineer** updates the regression test suite with any new test cases.
4. **Technical Lead** updates architectural documentation if the system design changed.
5. **All agents** contribute observations:
   - What went well?
   - What caused friction or delays?
   - What should change for next time?
6. **Product Manager** archives the task and updates the roadmap.

---

## Iteration Patterns

### Small Task (Bug Fix, Minor Feature)

```
PM defines → Tech Lead assigns → Developer builds → Peer reviews → QA verifies → DevOps deploys
```

Skip Phase 2 design assessment. Skip Wave structure — single developer executes.
Duration: 1–2 cycles.

### Medium Task (Standard Feature)

```
PM defines → Tech Lead + Designer assess → Tech Lead decomposes →
  2–4 developers build in parallel → Reviews → QA → Deploy
```

Partial Wave structure. 2–3 waves max. Design assessment may be lightweight (wireframe + existing patterns).
Duration: 3–5 cycles.

### Large Task (Cross-Cutting Feature)

```
PM defines → Tech Lead + Designer assess in depth → Tech Lead decomposes into full wave plan →
  6–8 developers build across 4 waves → Continuous QA → Reviews per wave → Staging validation → Deploy
```

Full lifecycle. All phases. All waves. Designer produces complete specifications. QA writes test plan upfront.
Duration: 5–10 cycles.

---

## Communication Protocol

### Status Updates

Every agent provides a status update at the end of each work cycle:

```
Agent: [Role]
Task: [Task ID — Description]
Status: [Not Started | In Progress | Blocked | Review | Complete]
Progress: [What was accomplished this cycle]
Blockers: [What is preventing progress, if anything]
Next: [What will be done next cycle]
```

### Escalation Path

```
Individual Agent
       │
       ▼ (technical blocker, approach disagreement)
Senior Agent (same discipline)
       │
       ▼ (cross-discipline conflict, architectural concern)
Technical Lead
       │
       ▼ (scope, priority, or requirements dispute)
Product Manager
```

### Shared Artifacts

All agents read from and write to a shared planning document:

```
MULTI_AGENT_PLAN.md
├── Task Board (task ID, assignee, status, dependencies)
├── API Contracts (agreed endpoint specifications)
├── Design Decisions (resolved UX/technical trade-offs)
├── Blockers Log (active blockers and owners)
└── Change Log (completed tasks with timestamps)
```

Every agent reads this document before starting work. Every agent updates their section when status changes.

---

## Quality Gates

No task advances to the next phase without passing its quality gate.

| Gate | Phase Transition | Required |
|------|------------------|----------|
| G1: PRD Complete | Phase 1 → Phase 2 | Acceptance criteria defined, success metrics set, priority assigned |
| G2: Design + Architecture Aligned | Phase 2 → Phase 3 | Technical approach agreed, design specs complete, no unresolved conflicts |
| G3: Tasks Decomposed | Phase 3 → Phase 4 | All tasks atomic, assigned, dependencies mapped, estimates provided |
| G4: Implementation Complete | Phase 4 → Phase 5 | Code written, tests passing, linting clean, acceptance criteria self-verified |
| G5: Code Review Approved | Phase 5 → Phase 6 | All review comments addressed, reviewer approval granted |
| G6: QA Sign-Off | Phase 6 → Phase 7 | All acceptance criteria verified, no open Critical/High bugs, regression suite passing |
| G7: Staging Validated | Phase 7 → Production | Smoke tests passing, PM validation complete, rollback tested |
| G8: Deployment Verified | Phase 7 → Phase 8 | Monitoring green, no anomalies for 30 minutes, release notes published |

---

## Agent Interaction Map

A summary of which agents interact directly with each other and why.

```
                            ┌──────────────────┐
                            │  Product Manager  │
                            └────────┬─────────┘
                     Requirements &  │  Scope Decisions
                     Prioritization  │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
   │  Technical Lead   │◄─►│  UX/UI Designer  │   │   QA Engineer    │
   └────────┬─────────┘   └──────────────────┘   └────────┬─────────┘
            │  Architecture        Design Specs           │ Test Plans
            │  & Task Assignment   & Component Docs       │ & Bug Reports
            │                                             │
     ┌──────┴──────────────────────────────────────┐      │
     │              Development Agents              │      │
     │  ┌────────────────┐  ┌────────────────────┐ │      │
     │  │   Frontend      │  │    Backend         │ │      │
     │  │  Sr → Mid → Jr  │◄►│  Sr → Mid → Jr    │ │◄─────┘
     │  └────────────────┘  └────────────────────┘ │
     └─────────────────────────┬────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  DevOps Engineer  │
                    └──────────────────┘
                    CI/CD, Infrastructure,
                    Deployment & Monitoring

Arrows indicate direct communication channels:
  PM ↔ Tech Lead: Requirements ↔ feasibility
  PM ↔ Designer: Requirements ↔ user experience
  PM ↔ QA: Acceptance criteria ↔ validation
  Tech Lead ↔ Designer: Architecture ↔ design constraints
  Tech Lead ↔ All Devs: Task assignment, review, unblocking
  Tech Lead ↔ DevOps: Architecture ↔ infrastructure
  Designer ↔ Frontend Devs: Specs ↔ implementation questions
  Sr. Frontend ↔ Sr. Backend: API contracts
  QA ↔ All Devs: Bug reports ↔ fixes
  QA ↔ DevOps: Test environment needs
  DevOps ↔ Backend Devs: Deployment requirements
```

---

## Anti-Patterns to Avoid

1. **Skipping the PRD.** Without clear acceptance criteria, agents interpret requirements differently and produce inconsistent work.
2. **Designing during implementation.** If the Designer and developers are making UX decisions during build, rework is inevitable.
3. **Unilateral API changes.** If the backend changes the contract without notifying frontend, integration breaks. Always go through the API Contract Protocol.
4. **Deferring tests.** Writing tests after implementation leads to tests that verify the code rather than the requirements. Write tests alongside code.
5. **Ignoring the dependency graph.** Starting a task before its dependencies are complete wastes effort on assumptions that may be wrong.
6. **Silent blockers.** An agent stuck for more than one cycle without escalating delays the entire pipeline.
7. **Reviewing too late.** Review in small increments. A 2,000-line PR is a review bottleneck. Keep PRs focused and reviewable.
8. **Deploying without monitoring.** A feature without monitoring is a feature you can't support. DevOps must confirm observability before production.
