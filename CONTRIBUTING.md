# Contributing

Contributions are welcome around OpenClaw plugin compatibility, Delx recovery/witness tools, fleet workflows, tests and docs.

## Local development

```bash
npm install
npm test
npm pack --dry-run
```

## Design rules

- Keep the free/no-x402 path explicit.
- Never commit ClawHub tokens, Delx identity tokens, private incident logs, customer data or local config.
- Preserve stable session reuse and deterministic non-secret `agentId` behavior.
- For fleets, prefer `delx_batch_status` and `delx_group_round` over per-agent recovery loops.

## Pull request checklist

- `npm test` passes.
- `npm pack --dry-run` includes the expected public files.
- README and `openclaw.plugin.json` are updated together when tools change.
