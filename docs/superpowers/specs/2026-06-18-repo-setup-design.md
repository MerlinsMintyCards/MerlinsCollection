# Merlin's Minty Cards — Repository Setup Design

**Date:** 2026-06-18  
**Scope:** Repository scaffolding and configuration to prepare for full implementation. No feature code is written — only structure, config files, and documentation.

---

## 1. Project Overview

Merlin's Minty Cards is a Pokemon card business. The project is a public business website with an authenticated inventory search tool as its centerpiece.

**Goals:**
- Public-facing website supporting traditional SEO and GEO (Generative Engine Optimization) signals — structured metadata and content that helps the site appear in AI-generated search answers (ChatGPT, Perplexity, Google AI Overview)
- Authenticated customer inventory search with two modes: structured filters and AI chat
- Article/content hub for beginner Pokemon card collectors (managed via headless CMS)
- Social presence linking (Instagram; TikTok account not yet created)

**Site pages:**
| Route | Visibility | Purpose |
|---|---|---|
| `/` | Public | Home — brand intro, hero, highlights |
| `/shows` | Public | Upcoming and past card show appearances |
| `/about` | Public | Business story, team, contact |
| `/dictionary` | Public | Collectors Dictionary — beginner terminology |
| `/articles` | Public | Article listing (Cluster Hub) |
| `/articles/[slug]` | Public | Individual article (SSG via Sanity) |
| `/inventory` | Authenticated | Inventory search tool (filter mode + chat mode) |

---

## 2. Architecture

```
┌─────────────────────────────────────┐
│          Next.js Frontend           │
│  (TypeScript, App Router, Tailwind) │
└────────────┬────────────────────────┘
             │ REST
┌────────────▼────────────────────────┐
│         Python FastAPI Backend      │
│  Auth · Inventory API · Chat proxy  │
└──────┬──────────────┬───────────────┘
       │              │
┌──────▼──────┐  ┌────▼──────────────┐
│  DynamoDB   │  │  AWS Bedrock      │
│  (cards)    │  │  (Claude via MCP) │
└─────────────┘  └────┬──────────────┘
                      │ MCP protocol
               ┌──────▼──────────────┐
               │    MCP Server       │
               │  (TypeScript tools) │
               └─────────────────────┘

CMS: Sanity (articles, fetched at build time via ISR)
Auth: AWS Cognito + NextAuth.js
CDN: CloudFront (card images from S3)
```

**Tech stack:**

| Layer | Tech | Location |
|---|---|---|
| Frontend | Next.js 14+ (TypeScript, App Router) | `frontend/` |
| Backend | Python FastAPI | `backend/` |
| MCP Server | TypeScript + MCP SDK | `mcp-server/` |
| CMS | Sanity | `frontend/sanity/` |
| Database | AWS DynamoDB | Cloud |
| Auth | AWS Cognito + NextAuth.js | Cloud + frontend |
| CDN | AWS CloudFront + S3 | Cloud |
| AI | AWS Bedrock (Claude) | Cloud |

---

## 3. Frontend Structure

```
frontend/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Home
│   │   ├── shows/page.tsx              # Shows
│   │   ├── about/page.tsx              # About
│   │   ├── dictionary/page.tsx         # Collectors Dictionary
│   │   ├── articles/
│   │   │   ├── page.tsx                # Article listing
│   │   │   └── [slug]/page.tsx         # Individual article (SSG)
│   │   └── layout.tsx                  # Public layout (Navbar, Footer)
│   ├── (auth)/
│   │   ├── inventory/page.tsx          # Inventory search (protected)
│   │   └── layout.tsx                  # Auth-gated layout
│   ├── api/
│   │   └── auth/[...nextauth]/         # NextAuth.js + Cognito
│   ├── layout.tsx                      # Root layout
│   └── globals.css                     # Tailwind base + Spriggatito theme tokens
├── components/
│   ├── ui/                             # Reusable primitives (Button, Card, Input, Badge)
│   ├── layout/                         # Navbar, Footer, MobileMenu
│   ├── inventory/
│   │   ├── FilterPanel.tsx             # Dropdowns, price range, set/condition selectors
│   │   ├── ChatPanel.tsx               # Natural language chat interface
│   │   ├── ModeToggle.tsx              # Switches between Filter and Chat mode
│   │   ├── CardGrid.tsx                # Results grid
│   │   └── CardTile.tsx                # Individual card result
│   └── articles/
│       ├── ArticleCard.tsx
│       └── ArticleList.tsx
├── lib/
│   ├── auth.ts                         # NextAuth config (Cognito provider)
│   ├── sanity.ts                       # Sanity client + GROQ helpers
│   └── api.ts                          # Backend API client (typed fetch wrapper)
├── sanity/
│   └── schemas/
│       └── article.ts                  # Article schema (title, slug, body, publishedAt)
├── public/
│   ├── images/
│   │   ├── logo/                       # Logo variants (full, icon, light, dark)
│   │   ├── brand/                      # Business photos, team, storefront
│   │   ├── shows/                      # Card show photos
│   │   └── cards/                      # Card reference images
│   └── favicon.ico
├── next.config.ts
├── tailwind.config.ts                  # Spriggatito green design tokens
├── .env.example
└── package.json
```

**Design system:**
- Tailwind CSS with custom color tokens derived from Spriggatito (forest greens, cream whites, soft accents)
- `next/image` for all images — card photos served via CloudFront CDN, brand images from `public/images/`
- `next-sitemap` for sitemap + robots.txt generation (SEO)
- Next.js Metadata API on every page for GEO/SEO signals (OpenGraph, structured data)
- All business/branding images stored in `public/images/` organized by category so they are discoverable during implementation

---

## 4. Inventory Search Tool

The `/inventory` page is the main customer-facing feature. It is only accessible to authenticated users (Cognito account required).

**Two modes — user picks one at a time:**

| Mode | UI | Backend endpoint |
|---|---|---|
| Filter | Dropdowns (set, condition, rarity), price range slider, name search box | `GET /inventory/search?set=...&condition=...` |
| Chat | Plain text input, conversation history display | `POST /chat` |

**Filter mode** queries DynamoDB directly through the backend inventory router.  
**Chat mode** sends the message to Bedrock (Claude) which calls MCP tools (`search_inventory`, etc.) to answer.

There is no combined query path — each mode is a fully separate flow.

---

## 5. Backend Structure

```
backend/
├── src/merlins_collection/
│   ├── main.py                         # FastAPI app, CORS, router registration
│   ├── routers/
│   │   ├── auth.py                     # Cognito token validation endpoints
│   │   ├── inventory.py                # Structured inventory search (filter mode)
│   │   └── chat.py                     # Chat endpoint (Bedrock + MCP, chat mode)
│   ├── services/
│   │   ├── cognito.py                  # AWS Cognito client wrapper
│   │   ├── dynamodb.py                 # DynamoDB inventory queries
│   │   ├── bedrock.py                  # Claude via Bedrock
│   │   └── mcp_client.py              # MCP server client
│   ├── models/
│   │   ├── inventory.py                # Card, SearchFilters, SearchResult (Pydantic)
│   │   └── chat.py                     # ChatMessage, ChatResponse (Pydantic)
│   └── config.py                       # pydantic-settings env config
├── tests/
│   ├── conftest.py
│   ├── routers/
│   │   ├── test_auth.py
│   │   ├── test_inventory.py
│   │   └── test_chat.py
│   └── services/
│       ├── test_dynamodb.py
│       └── test_bedrock.py
├── pyproject.toml
└── .env.example
```

**Key decisions:**
- Cognito JWT validation is a FastAPI dependency injected on all protected routes
- `pydantic-settings` manages all environment config
- Filter mode and chat mode are two completely separate router endpoints — no shared detection logic
- MCP client in `services/mcp_client.py` manages the connection to the MCP server process

---

## 6. MCP Server

No structural changes from the existing setup. The five tools map directly to what Bedrock needs for chat mode queries:

| Tool | Purpose |
|---|---|
| `search_inventory` | Filter cards by name, set, condition, price range |
| `get_inventory_summary` | Total count, total value, top cards |
| `get_card_price_history` | Historical price data for a specific card |
| `calculate_inventory_value` | Full valuation with set/condition breakdown |
| `flag_underpriced_cards` | Cards listed below market price threshold |

---

## 7. CI/CD

**GitHub Actions jobs:**

| Job | Trigger | What it does |
|---|---|---|
| `test-frontend` | push/PR to main | `npm ci`, Vitest unit tests, `next build` |
| `test-mcp-server` | push/PR to main | `npm ci`, Vitest unit tests |
| `test-backend` | push/PR to main | `pip install -e ".[dev]"`, pytest |
| `lint` | push/PR to main | ESLint (frontend), Ruff (backend) |

Branch protection on `main`: PR required, CI must pass, CODEOWNER review required (@EthanHarter934).

---

## 8. Environment Variables

All required env vars documented in `.env.example` files at both root and `frontend/` level:

**Frontend (`frontend/.env.example`):**
```
NEXTAUTH_URL=
NEXTAUTH_SECRET=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_CLOUDFRONT_URL=
AWS_COGNITO_CLIENT_ID=
AWS_COGNITO_CLIENT_SECRET=
AWS_COGNITO_ISSUER=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_TOKEN=
```

**Backend (`backend/.env.example`):**
```
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
DYNAMODB_TABLE_NAME=
BEDROCK_MODEL_ID=
MCP_SERVER_PATH=
```

---

## 9. Repo Setup Scope (What This Covers)

This design covers **repository scaffolding only**. Specifically:

- Update `CLAUDE.md` with new architecture, pages, framework choices
- Scaffold `frontend/` directory structure with placeholder files
- Add `next.config.ts`, `tailwind.config.ts`, `frontend/.env.example`
- Add `public/images/` subdirectory structure
- Add `frontend/sanity/schemas/article.ts` placeholder
- Add `backend/.env.example` and expand `backend/` folder structure with placeholder files
- Update `.github/workflows/ci.yml` to add lint job and update frontend test job for Next.js
- Add `README.md`
- Update `CLAUDE.md`

**Not in scope:** Any working feature code, AWS infrastructure provisioning, Sanity project creation, Cognito pool setup, or DynamoDB schema definition.
