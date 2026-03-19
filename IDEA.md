TODO:

# Wallet Intelligence Agent

An autonomous agent that takes a wallet address as input and builds a comprehensive profile by spending money across paid services.

## Core Flow

1. Receive a wallet address as input
2. Resolve the address to an externally owned account (EOA)
3. Look up on-chain identity (ENS, Lens, Farcaster, etc.)
4. If a Twitter/X username is found, search the internet for public info
5. Query paid data services to enrich the profile:
   - **coldvision.xyz** — whale confidence scores, trade history, bot detection
   - **Bloomberg / news subscriptions** — relevant financial news tied to the address or its owner
   - **Other MPP services** — Dune queries, Allium analytics, Codex token data
6. Aggregate findings into a single intelligence report

## Agent Capabilities

- Holds its own Tempo wallet for making MPP payments autonomously
- Can visit service websites, authenticate, and make paid API calls
- Can pay for memberships or subscriptions when needed (e.g. Bloomberg, premium data feeds)
- Manages a budget — decides which services are worth paying for based on the query

## First Step

- Resolve wallet address to EOA
- Look up linked social accounts (ENS text records, on-chain identity protocols)
- Search Twitter/X username on the internet if present
- Return basic profile with links and public info before deeper paid enrichment
