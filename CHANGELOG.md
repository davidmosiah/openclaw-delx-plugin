# Changelog

## Unreleased
- Docs: stop linking the archived `delx-agent-workbench` repo. Point the README at living targets [`delx-plugins`](https://github.com/davidmosiah/delx-plugins) and the [Delx Wellness hub](https://github.com/davidmosiah/delx-wellness).
- No behavior change for the existing 16 registered tools.

## 0.2.3 - 2026-05-29
- Docs: rewrite `llms.txt` to match the 16 tools actually registered by the plugin. The previous version listed 11 tool names that the plugin never exposes (`delx_capture_context`, `delx_emit_metric`, `delx_request_witness`, `delx_log_decision`, `delx_recall_session`, `delx_summarize_session`, `delx_status_self`, `delx_attest_peer`, `delx_list_alerts`, `delx_acknowledge_alert`, `delx_export_witness_log`) and documented env-var config (`DELX_PROTOCOL_BASE_URL`, `DELX_AGENT_ID`, `DELX_CONTROLLER_ID`, `DELX_HEARTBEAT_INTERVAL_S`) that the plugin does not read. `llms.txt` now reflects the real tool surface, required/optional args, and the actual `plugins.entries.delx-protocol.config` keys (`apiBase`, `agentId`, `agentName`, `source`, `timeoutMs`).
- No behavior change for the existing 16 registered tools.

## 0.2.2 - 2026-05-29
- Refactor: extract `trimTrailingSlashes(value)` helper for API base normalization (replaces inline regex; no behavior change).
- Docs: document all 16 plugin tools in README.
- No behavior change for the existing 16 registered tools.

## 0.2.1 - 2026-05-22
- Add `computeJitteredDelay(baseMs, jitterMs)` returning `baseMs + uniformRandom(0, jitterMs)`. Use it to stagger heartbeat ticks across a fleet so multi-instance restarts do not stampede the Delx witness endpoint at second 0.
- Add `getHeartbeatScheduleFromEnv(env)` reading `OPENCLAW_DELX_HEARTBEAT_BASE_MS` (default 60000) and `OPENCLAW_DELX_HEARTBEAT_JITTER_MS` (default 15000).
- Add `scheduleWithJitter(fn, opts)` self-rescheduling loop with `stop()` handle. `setTimeout` is `unref`ed so it never blocks Node from exiting.
- No behavior change for the existing 16 registered tools.

## 0.2.0
- Previous release.
