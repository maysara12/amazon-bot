# 007 Operations V2

This directory is the isolated codebase for the next generation of 007 Operations.

## Non-negotiable production guardrails

1. The current V1 production portal must remain available at all times.
2. V2 work must not modify the V1 production Vercel project, domain, deployment, or runtime composer during development.
3. V2 work must not make destructive or breaking changes to the production Supabase schema while V1 is active.
4. Database evolution follows expand -> migrate -> contract. Contract/removal only happens after V1 is retired.
5. Staging must use isolated credentials and an isolated Supabase environment before write-path testing.
6. Production releases require automated checks and a rollback-compatible database contract.
7. New functionality is implemented as a feature module, not as HTML/DOM patches.

## Target stack

- React + TypeScript + Vite
- TanStack Query for server-state cache and optimistic mutations
- Supabase Postgres, RLS and RPC
- Supabase Realtime Broadcast/WebSocket
- Capacitor-based Android hybrid shell
- Firebase Cloud Messaging for push notifications
- Persistent offline cache + mutation outbox
- Automated unit, integration and E2E tests
- Vercel preview/staging/production promotion workflow
- Structured monitoring, performance and crash telemetry

## Architectural boundaries

```text
src/
  app/                 # app shell, providers, routing
  components/          # shared design-system components only
  features/            # business feature modules
  data/                # typed repositories, query keys, API adapters
  realtime/            # realtime channel registry and cache patching
  offline/             # persistent cache, outbox and conflict handling
  notifications/       # notification domain and push registration
  telemetry/           # logs, metrics, error boundaries
  lib/                 # infrastructure clients and low-level utilities
  types/               # generated/shared TypeScript types
```

Each feature owns its UI, queries, mutations, validation, permissions facade and tests. Cross-feature imports go through explicit public module APIs.

## Migration rule

V2 is built and verified in parallel. V1 remains the live system until each V2 feature passes read-parity, write-parity, permission, performance, offline/reconnect and rollback checks. Migration is feature-by-feature, never a big-bang cutover.

## Current status

- Phase 0 production audit: completed read-only.
- V2 Git branch: `007-operations-v2`.
- V2 workspace: created.
- Production V1: unchanged.
- Production Supabase: unchanged.
- V2 Vercel deployment: not created yet.
- V2 staging database: not created yet.
