# Agent Development Notes

## Scope

This repo is the OpenClaw plugin for Delx recovery, witness continuity and fleet operations.

## Commands

- Install: `npm install`
- Test: `npm test`
- Pack check: `npm pack --dry-run`

## Rules

- Never commit ClawHub tokens, Delx identity tokens, private incident logs, customer data, or local config.
- Keep the free/no-x402 path explicit.
- Preserve stable session reuse and deterministic non-secret `agentId` behavior.
- For fleets, prefer `delx_batch_status` and `delx_group_round` over per-agent recovery loops.
