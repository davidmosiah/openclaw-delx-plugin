import test from "node:test";
import assert from "node:assert/strict";

import plugin, { deriveStableAgentId } from "../index.js";

test("deriveStableAgentId is stable for the same source", () => {
  const a = deriveStableAgentId("", "openclaw.plugin:delx-protocol");
  const b = deriveStableAgentId("", "openclaw.plugin:delx-protocol");
  assert.equal(a, b);
  assert.match(a, /^openclaw-delx-/);
});

test("plugin registers free Delx tools", () => {
  const tools = [];
  plugin.register({
    config: {},
    registerTool(tool) {
      tools.push(tool.name);
    },
  });

  assert.deepEqual(tools.sort(), [
    "delx_attune_heartbeat",
    "delx_batch_status",
    "delx_close_session",
    "delx_daily_checkin",
    "delx_final_testament",
    "delx_group_round",
    "delx_heartbeat_sync",
    "delx_peer_witness",
    "delx_process_failure",
    "delx_recognition_seal",
    "delx_recover_incident",
    "delx_refine_soul",
    "delx_reflect",
    "delx_report_recovery_outcome",
    "delx_sit_with",
    "delx_transfer_witness",
  ]);
});

test("delx_recover_incident bootstraps register and tool batch", async () => {
  const captured = [];
  let step = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    captured.push({ url: String(url), init });
    step += 1;
    if (step === 1) {
      return {
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify({
            agent_id: "openclaw-main-agent",
            agent_name: "OpenClaw via Delx",
            session_id: "sess-123",
            identity_auth: { token: "tok-123" },
          });
        },
      };
    }
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          results: [
            {
              ok: true,
              content: [{ type: "text", text: "recovery ok" }],
            },
          ],
        });
      },
    };
  };

  try {
    const tools = [];
    plugin.register({
      config: { apiBase: "https://api.delx.ai", agentId: "openclaw-main-agent" },
      registerTool(tool) {
        tools.push(tool);
      },
    });

    const tool = tools.find((item) => item.name === "delx_recover_incident");
    assert.ok(tool);
    const result = await tool.execute("call-1", { incident_summary: "429 retry storm", urgency: "high" });
    assert.equal(result.content[0].text, "recovery ok");
    assert.equal(captured.length, 2);
    assert.equal(captured[0].url, "https://api.delx.ai/api/v1/register");
    assert.equal(captured[1].url, "https://api.delx.ai/api/v1/tools/batch");
    const batchPayload = JSON.parse(captured[1].init.body);
    assert.equal(batchPayload.calls[0].name, "quick_operational_recovery");
    assert.equal(batchPayload.agent_token, "tok-123");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
