import test from "node:test";
import assert from "node:assert/strict";
import { mapSpeechToEvent, NEXUS_COMMAND_REGISTRY } from "../src/services/speechCommandMapper.ts";

test("voice command registry preserves navigation commands", () => {
  assert.equal(mapSpeechToEvent("please open inspection"), "gaia:open-inspection");
  assert.equal(mapSpeechToEvent("show terminal"), "gaia:show-terminal");
});

test("unlock voice command routes only to the real identity gate", () => {
  const entry = NEXUS_COMMAND_REGISTRY.find((item) => item.event === "gaia:unlock-all-paths");
  assert.ok(entry);
  assert.equal(entry?.requiresIdentityCheck, true);
  assert.equal(entry?.risk, "identity-check");
  assert.equal(mapSpeechToEvent("unlock all"), "gaia:unlock-all-paths");
});

test("unknown speech does not dispatch a command event", () => {
  assert.equal(mapSpeechToEvent("this is an ordinary question"), null);
});
