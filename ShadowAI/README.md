# VerifyWise Shadow AI Module

Shadow AI is a governance module that transforms customer's existing security telemetry into actionable AI usage oversight. It connects to the security tools the organization already operates (SWG, CASB, SIEM, proxies, firewalls), ingests AI-related events, normalizes them, evaluates against policies, and produces governance intelligence.

## Architecture

```
External Sources          ShadowAI Core Engine          Governance Outputs
┌─────────────┐     ┌───────────────────────────┐     ┌─────────────────┐
│ SWG (Zscaler│     │ Connectors → Normalizer   │     │ AI Inventory    │
│ Netskope)   │────▶│ → Identity Enricher       │────▶│ Risk Findings   │
│ SIEM (Splunk│     │ → Policy Engine           │     │ Policy Violations│
│ Sentinel,   │     │ → Risk Engine             │     │ Review Workflows│
│ QRadar)     │     │ → Inventory Engine        │     │ Audit Evidence  │
│ Firewall/EDR│     └───────────────────────────┘     │ Exec Reports    │
└─────────────┘                                        └─────────────────┘
```

## Module Structure

```
ShadowAI/
├── types/                    # Core TypeScript types
│   ├── shadow-ai-event.ts    # Normalized event model
│   ├── connector-config.ts   # Connector configuration
│   ├── policy.ts             # Policy & violation types
│   ├── risk.ts               # Risk scoring types
│   ├── inventory.ts          # AI tool inventory types
│   └── review.ts             # Review workflow types
├── connectors/               # Data source adapters
│   ├── base.connector.ts     # Abstract base class
│   ├── siem/
│   │   ├── splunk.connector.ts
│   │   ├── sentinel.connector.ts
│   │   └── qradar.connector.ts
│   ├── gateway/
│   │   ├── zscaler.connector.ts
│   │   └── netskope.connector.ts
│   └── generic/
│       ├── webhook.connector.ts
│       └── syslog.connector.ts
├── normalization/
│   ├── event.normalizer.ts   # Raw event → ShadowAIEvent
│   └── ai-tool.registry.ts   # 200+ known AI tools catalog
├── enrichment/
│   └── identity.enricher.ts  # User/IP → org identity
├── engine/
│   ├── policy.engine.ts      # Policy evaluation
│   ├── risk.engine.ts        # Risk scoring
│   └── inventory.engine.ts   # Auto-inventory management
└── index.ts                  # Module exports
```

## Supported Connectors

| Connector | Type | Method |
|-----------|------|--------|
| **Webhook** | Generic | HTTP push (any SIEM can forward events) |
| **Syslog** | Generic | Syslog protocol (TCP/UDP) |
| **Splunk** | SIEM | REST API search/jobs |
| **Microsoft Sentinel** | SIEM | Log Analytics API (KQL) |
| **IBM QRadar** | SIEM | Ariel Query Language (AQL) |
| **Zscaler ZIA** | Gateway | Web Insights API |
| **Netskope** | CASB | REST API v2 |

## AI Tool Registry

The registry contains 200+ known AI tools across categories:
- Generative AI (ChatGPT, Claude, Gemini, etc.)
- Code Assistants (GitHub Copilot, Cursor, Tabnine, etc.)
- Image Generation (DALL-E, Midjourney, Stable Diffusion, etc.)
- Video Generation (Sora, Runway, Synthesia, etc.)
- Voice AI, Translation, Data Analysis, ML Platforms, and more

## Integration Points

- **Backend**: Controllers, routes, and utils in `Servers/` (mounted at `/api/shadow-ai/`)
- **Frontend**: Pages in `Clients/src/presentation/pages/ShadowAI/`
- **Database**: 8 tables via Sequelize migration

## API Endpoints

- `GET/POST /api/shadow-ai/connectors` - Connector management
- `POST /api/shadow-ai/events/ingest` - Event ingestion
- `GET /api/shadow-ai/events` - Event querying
- `GET/PATCH /api/shadow-ai/inventory` - AI tool inventory
- `CRUD /api/shadow-ai/policies` - Policy management
- `GET/PATCH /api/shadow-ai/violations` - Violation management
- `CRUD /api/shadow-ai/exceptions` - Exception handling
- `CRUD /api/shadow-ai/reviews` - Review workflows
- `POST /api/shadow-ai/evidence/export` - Evidence export
- `GET /api/shadow-ai/dashboard/summary` - Dashboard stats
- `GET /api/shadow-ai/dashboard/trends` - Usage trends
