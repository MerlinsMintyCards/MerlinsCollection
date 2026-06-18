# TDD Guidelines
Always follow the outside-in Test-Driven Development (TDD) process.
1. RED: Write failing tests first. Do NOT implement the feature.
2. GREEN: Write minimal code to make the tests pass.
3. REFACTOR: Improve code quality, ensuring tests remain green.
Never combine phases. Wait for user confirmation after confirming tests fail.

# Project Overview
Merlin's Minty Cards — a Pokemon card business website.
- Public website: Home, Shows, About, Collectors Dictionary, Articles
- Authenticated inventory search tool (filter mode + AI chat mode)
- Article/content hub for beginner collectors, managed via Sanity CMS

# Architecture

| Layer       | Language   | Framework       | Location       |
|-------------|------------|-----------------|----------------|
| Frontend    | TypeScript | Next.js 14      | `frontend/`    |
| Backend API | Python     | FastAPI         | `backend/`     |
| MCP Server  | TypeScript | MCP SDK         | `mcp-server/`  |
| CMS         | -          | Sanity          | `frontend/sanity/` |

# Site Pages

| Route                | Auth Required | Purpose                              |
|----------------------|---------------|--------------------------------------|
| `/`                  | No            | Home — brand intro, highlights       |
| `/shows`             | No            | Upcoming and past card show events   |
| `/about`             | No            | Business story, team, contact        |
| `/dictionary`        | No            | Collectors Dictionary (beginner terminology) |
| `/articles`          | No            | Article listing (Cluster Hub)        |
| `/articles/[slug]`   | No            | Individual article (SSG via Sanity)  |
| `/inventory`         | Yes           | Inventory search (filter + chat)     |

# Test Commands

| Layer      | Command                                        |
|------------|------------------------------------------------|
| All        | `npm test` (from repo root)                    |
| Frontend   | `npm test --workspace=frontend`                |
| MCP Server | `npm test --workspace=mcp-server`              |
| Backend    | `python -m pytest backend/tests -q --tb=short` |
| Lint (FE)  | `cd frontend && npm run lint`                  |
| Lint (BE)  | `ruff check backend/src`                       |

# Inventory Search Tool
Located at `/inventory` — authenticated customers only.
Two distinct modes (user picks one at a time):
- **Filter mode**: dropdowns (set, condition, rarity), price range, name search → `GET /inventory/search`
- **Chat mode**: plain text to Claude via Bedrock + MCP tools → `POST /chat`

# MCP Tools
- `get_inventory_summary` — total count, value, top cards
- `search_inventory` — filter by name, set, condition, value range
- `get_card_price_history` — historical price data for a card
- `calculate_inventory_value` — full valuation with breakdown by set/condition
- `flag_underpriced_cards` — cards listed below market price threshold

# AWS Services
| Service         | Purpose                                              |
|-----------------|------------------------------------------------------|
| S3              | Card image storage, inventory data exports           |
| CloudFront      | CDN for serving card images                          |
| DynamoDB        | Card inventory database (flexible schema)            |
| Lambda          | Serverless price lookup and image processing         |
| API Gateway     | REST API gateway for the backend                     |
| Cognito         | Customer authentication                              |
| Rekognition     | Image analysis (future: identify cards from photos)  |
| Bedrock         | Claude AI integration for chat mode queries          |

# Design System
- Color scheme based on Spriggatito (forest greens, cream whites)
- Business/brand images stored in `frontend/public/images/` organized by:
  - `logo/` — logo variants
  - `brand/` — business photos, team, storefront
  - `shows/` — card show photos
  - `cards/` — card reference images

# Code Review
All PRs require review. CODEOWNERS enforces review by @EthanHarter934.
Branch protection rules must be enabled in GitHub Settings > Branches:
- Require a pull request before merging
- Require status checks (CI) to pass
- Require review from Code Owners
