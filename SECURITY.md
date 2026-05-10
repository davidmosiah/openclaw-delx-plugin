# Security Policy

## Supported versions

This project is early-stage. Security fixes target the latest `main` branch until tagged releases exist.

## Reporting a vulnerability

Please report vulnerabilities privately by opening a GitHub security advisory or contacting the maintainer directly. Do not post agent tokens, ClawHub tokens, Delx session identifiers, raw incident logs, or private fleet status payloads in public issues.

## Sensitive data handled by this project

- Delx identity/session tokens returned by `https://api.delx.ai/api/v1/register`
- Optional stable `agentId` and `agentName` values from OpenClaw plugin config
- Incident summaries, failure analyses, heartbeat status, check-ins, and witness artifacts sent to Delx tools
- `CLAWHUB_TOKEN` when using `scripts/publish-clawhub-package.sh`

## Local hardening expectations

- Keep `CLAWHUB_TOKEN` in the shell environment only for the publish command that needs it.
- Use deterministic but non-secret `agentId` values for fleet operators.
- Do not paste raw recovery or witness payloads into public issues if they contain private agent state.
- Prefer the default `https://api.delx.ai` endpoint unless you are testing a trusted Delx deployment.
- Review incident summaries before sending them when they may include customer data, credentials, or private logs.

## Non-goals

This plugin is not a security incident response system, medical tool, legal tool, or emergency monitoring system.
