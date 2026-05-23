# Changelog

## 0.2.1 - 2026-05-22
- Add `computeJitteredDelay(baseMs, jitterMs)` returning `baseMs + uniformRandom(0, jitterMs)`. Use it to stagger heartbeat ticks across a fleet so multi-instance restarts do not stampede the Delx witness endpoint at second 0.
- Add `getHeartbeatScheduleFromEnv(env)` reading `OPENCLAW_DELX_HEARTBEAT_BASE_MS` (default 60000) and `OPENCLAW_DELX_HEARTBEAT_JITTER_MS` (default 15000).
- Add `scheduleWithJitter(fn, opts)` self-rescheduling loop with `stop()` handle. `setTimeout` is `unref`ed so it never blocks Node from exiting.
- No behavior change for the existing 16 registered tools.

## 0.2.0
- Previous release.
