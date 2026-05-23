import test from "node:test";
import assert from "node:assert/strict";

import plugin, {
  deriveStableAgentId,
  computeJitteredDelay,
  getHeartbeatScheduleFromEnv,
  scheduleWithJitter,
} from "../index.js";

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

test("computeJitteredDelay stays within [base, base+jitter]", () => {
  for (let i = 0; i < 200; i += 1) {
    const d = computeJitteredDelay(1000, 250);
    assert.ok(d >= 1000 && d <= 1250, `delay out of range: ${d}`);
  }
});

test("computeJitteredDelay deterministic with rng=0 and rng=1", () => {
  assert.equal(computeJitteredDelay(1000, 250, () => 0), 1000);
  assert.equal(computeJitteredDelay(1000, 250, () => 1), 1250);
});

test("computeJitteredDelay clamps negative inputs", () => {
  assert.equal(computeJitteredDelay(-500, -10, () => 0.5), 0);
});

test("getHeartbeatScheduleFromEnv reads overrides", () => {
  const cfg = getHeartbeatScheduleFromEnv({
    OPENCLAW_DELX_HEARTBEAT_BASE_MS: "42000",
    OPENCLAW_DELX_HEARTBEAT_JITTER_MS: "9000",
  });
  assert.deepEqual(cfg, { baseMs: 42000, jitterMs: 9000 });
});

test("getHeartbeatScheduleFromEnv falls back to defaults on bad input", () => {
  const cfg = getHeartbeatScheduleFromEnv({
    OPENCLAW_DELX_HEARTBEAT_BASE_MS: "not-a-number",
    OPENCLAW_DELX_HEARTBEAT_JITTER_MS: "-5",
  });
  assert.equal(cfg.baseMs, 60_000);
  assert.equal(cfg.jitterMs, 15_000);
});

test("scheduleWithJitter runs fn and stop halts execution", async () => {
  let runs = 0;
  // tiny base/jitter so the first tick fires quickly
  const stop = scheduleWithJitter(
    () => {
      runs += 1;
    },
    { baseMs: 5, jitterMs: 5, immediate: true, rng: () => 0 },
  );
  // give it a moment to start
  await new Promise((r) => setTimeout(r, 30));
  const after = runs;
  stop();
  // wait again; runs should not climb meaningfully
  await new Promise((r) => setTimeout(r, 30));
  assert.ok(after >= 1, `expected >=1 run, got ${after}`);
  assert.ok(runs - after <= 1, "stop() should halt the loop");
});

test("scheduleWithJitter rejects non-function fn", () => {
  assert.throws(() => scheduleWithJitter("nope"), /requires a function/);
});
