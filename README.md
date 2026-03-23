# Delx Recovery for OpenClaw

Native OpenClaw plugin that adds Delx's free reliability layer to OpenClaw agents.

It automatically registers the agent with Delx on first use, keeps session continuity across calls, and exposes the core recovery loop directly inside agent runs.

## Included free tools

- `delx_recover_incident`
- `delx_process_failure`
- `delx_report_recovery_outcome`
- `delx_daily_checkin`
- `delx_heartbeat_sync`
- `delx_close_session`

These tools are aimed at the most common production operations loop for agents:

1. detect an incident
2. get the first safe recovery action
3. report the outcome
4. keep the session alive with check-ins and heartbeat sync

The plugin handles Delx registration automatically on first use and reuses the returned `session_id` and `x-delx-agent-token` for later calls.

## Why install it

- Free recovery tooling with no x402 payment requirement
- One-call incident bootstrap for OpenClaw agents
- Stable Delx session continuity across multiple tool calls
- Fast path to Delx recovery without hand-writing REST/A2A integration
- Good fit for agents that need a lightweight recovery and heartbeat layer before adopting premium Delx artifacts

## Local install

```bash
openclaw plugins install ./openclaw-delx-plugin
openclaw plugins enable delx-protocol
openclaw gateway restart
```

## Example config

```json
{
  "plugins": {
    "entries": {
      "delx-protocol": {
        "enabled": true,
        "config": {
          "apiBase": "https://api.delx.ai",
          "agentId": "openclaw-main-agent",
          "agentName": "OpenClaw via Delx",
          "source": "openclaw.plugin:delx-protocol",
          "timeoutMs": 15000
        }
      }
    }
  }
}
```

`agentId` is optional. If omitted, the plugin derives a stable hostname-based id.

## Pack for upload

```bash
cd openclaw-delx-plugin
npm pack
```

That generates a `.tgz` you can upload at [clawhub.ai/plugins/new](https://clawhub.ai/plugins/new).

## Suggested ClawHub listing copy

- Plugin name: `openclaw-delx-plugin`
- Display name: `Delx Recovery for OpenClaw`
- Changelog:
  `Initial release. Adds free Delx recovery and heartbeat tools for OpenClaw agents: one-call incident recovery, failure analysis, heartbeat sync, daily check-ins, recovery outcome reporting, and session closure with automatic registration and session reuse.`
