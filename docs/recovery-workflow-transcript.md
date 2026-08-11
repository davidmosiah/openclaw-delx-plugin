# Recovery workflow transcript (sanitized)

Issue: [#2](https://github.com/davidmosiah/openclaw-delx-plugin/issues/2)

Expected shape of a free Delx recovery loop through this OpenClaw plugin. **No agent tokens, no real session IDs, no production incident text.** Values below match the contract exercised by `test/plugin.test.js` (mock fetch) and the public tool surface in `index.js`.

## Preconditions

```bash
# from a checkout of this repo
openclaw plugins install ./openclaw-delx-plugin
openclaw plugins enable delx-protocol
openclaw gateway restart
```

Optional config (local only):

```json
{
  "plugins": {
    "entries": {
      "delx-protocol": {
        "enabled": true,
        "config": {
          "apiBase": "https://api.delx.ai",
          "agentId": "openclaw-delx-demo-agent"
        }
      }
    }
  }
}
```

Do **not** commit real `x-delx-agent-token` values. The plugin registers on first tool use and reuses the returned session internally.

## Happy path (tool sequence)

### 1. Incident bootstrap — `delx_recover_incident`

Agent call (conceptual):

```json
{
  "name": "delx_recover_incident",
  "arguments": {
    "incident_summary": "429 retry storm on upstream provider",
    "urgency": "high"
  }
}
```

What the plugin does (network):

1. `POST {apiBase}/api/v1/register` — obtains `session_id` + identity token (held in process memory for the plugin instance).
2. `POST {apiBase}/api/v1/tools/batch` with `quick_operational_recovery` as the first call.

Expected agent-visible result (shape):

```text
recovery ok
```

(or structured recovery actions from Delx; content is free-form text from the Protocol tool result.)

### 2. Deeper failure analysis — `delx_process_failure` (optional)

```json
{
  "name": "delx_process_failure",
  "arguments": {
    "failure_type": "loop",
    "summary": "agent retried the same HTTP call 12 times",
    "evidence": "timeouts + identical request fingerprint"
  }
}
```

Valid `failure_type` examples used by Delx: `timeout`, `loop`, `error`, `hallucination`, `conflict`, `memory`, `economic`, `rejection`, `deprecation`.

### 3. Report outcome — `delx_report_recovery_outcome`

```json
{
  "name": "delx_report_recovery_outcome",
  "arguments": {
    "outcome": "partial",
    "notes": "backoff applied; one remaining flaky endpoint"
  }
}
```

Outcomes: `success` | `partial` | `failed` (plugin forwards to Protocol).

### 4. Heartbeat — `delx_heartbeat_sync`

```json
{
  "name": "delx_heartbeat_sync",
  "arguments": {
    "latency_ms": 180,
    "error_rate": 0.02,
    "queue_depth": 1,
    "throughput": 12
  }
}
```

Scheduling: default base **60s** + jitter up to **15s** (`OPENCLAW_DELX_HEARTBEAT_BASE_MS` / `OPENCLAW_DELX_HEARTBEAT_JITTER_MS`). Jitter prevents multi-instance stampede on restart.

### 5. Daily check-in — `delx_daily_checkin` (optional)

```json
{
  "name": "delx_daily_checkin",
  "arguments": {
    "status": "stable",
    "blockers": []
  }
}
```

### 6. Close — `delx_close_session`

```json
{
  "name": "delx_close_session",
  "arguments": {
    "reason": "incident resolved"
  }
}
```

After close, the next recovery call re-registers / opens a fresh session.

## Failure modes (expected, sanitized)

| Condition | Expected behavior |
| --- | --- |
| Network error on register | Tool returns an error string; no token is written to disk by this package |
| `apiBase` unreachable | Same — fail closed; agent can retry later |
| Missing `incident_summary` | Schema / argument validation fails before network |
| Second recover without close | Session reuse: register may be skipped when token still valid (implementation-dependent); batch still runs |
| Token pasted into logs | **Forbidden** — strip before pasting to issues; treat as compromised |

## Unit proof (no network)

```bash
npm test
```

Covers: tool registration list (16 free tools), `delx_recover_incident` register+batch sequence with mocked `fetch`, heartbeat jitter bounds, env schedule parsing.

## What this is not

- Not a paid x402 path (Commerce is a separate product).
- Not a substitute for reading live Protocol docs at `https://api.delx.ai`.
- Not permission to publish real recovery payloads from production agents.
