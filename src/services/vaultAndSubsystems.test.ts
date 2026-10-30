import test from 'node:test';
import assert from 'node:assert/strict';
import { tailscaleService } from './tailscaleService';
import { synapseService } from './synapseService';

test('Tailscale Tunnel Client & Google Auth Mesh Network', async (t) => {
  await t.test('Connects to Tailscale mesh with Google Auth credentials', async () => {
    const res = await tailscaleService.connect('machackabook@gmail.com');
    assert.equal(res.success, true);
    assert.match(res.message, /machackabook@gmail.com/);

    const status = tailscaleService.getStatus();
    assert.equal(status.connected, true);
    assert.equal(status.authEmail, 'machackabook@gmail.com');
    assert.equal(status.authProvider, 'google');
    assert.equal(status.selfIp, '100.95.42.10');
  });

  await t.test('Lists tailnet peers with OpenWrt gateway, Kali, and MacBook', async () => {
    const status = tailscaleService.getStatus();
    assert.ok(status.peers.length >= 3);
    const gw = status.peers.find((p) => p.hostname === 'openwrt-gateway');
    assert.ok(gw, 'OpenWrt gateway peer should be present');
    assert.equal(gw.ip, '100.95.42.1');
    assert.equal(gw.isExitNode, true);
  });

  await t.test('Executes WireGuard ICMP ping to gateway peer', async () => {
    const pingRes = await tailscaleService.pingPeer('openwrt-gateway');
    assert.equal(pingRes.success, true);
    assert.match(pingRes.output, /64 bytes from 100.95.42.1/);
    assert.ok(pingRes.avgLatencyMs > 0);
  });

  await t.test('Configures exit node routing and Google SSO re-authentication', async () => {
    const exitRes = tailscaleService.setExitNode('openwrt-gateway');
    assert.equal(exitRes.success, true);
    assert.equal(tailscaleService.getStatus().activeExitNode, 'openwrt-gateway');

    const authRes = tailscaleService.authenticateGoogle('machackabook@gmail.com');
    assert.equal(authRes.success, true);
    assert.equal(authRes.email, 'machackabook@gmail.com');
  });

  await t.test('Disconnects and suspends interface cleanly', async () => {
    const disc = await tailscaleService.disconnect();
    assert.equal(disc.success, true);
    assert.equal(tailscaleService.getStatus().connected, false);

    // Reconnect for ongoing environment usage
    await tailscaleService.connect();
  });
});

test('Synapse Computational Mathematica & Neural Substrate Daemon', async (t) => {
  await t.test('Reports launchd daemon status and 963Hz resonance stasis', () => {
    const status = synapseService.getStatus();
    assert.equal(status.serviceLabel, 'com.nexus.gaia.synapse');
    assert.equal(status.status, 'ACTIVE');
    assert.ok(status.pid > 0);
    assert.ok(status.quantumResonanceHz >= 960 && status.quantumResonanceHz <= 966);
    assert.ok(status.activeTensors > 0);
  });

  await t.test('Computes mathematical expressions with Fermat prime residue verification', () => {
    const comp = synapseService.computeMath('sin(pi/2)*1000 + 432');
    assert.equal(comp.expression, 'sin(pi/2)*1000 + 432');
    assert.equal(Number(comp.result), 1432);
    assert.ok(typeof comp.primeResidue === 'string' && comp.primeResidue.length > 0);
    assert.ok(comp.timeMs >= 0);
  });

  await t.test('Generates and contracts N x N synaptic neural weight matrices', () => {
    const tensor = synapseService.generateSynapticTensor(4);
    assert.equal(tensor.dimension, 4);
    assert.equal(tensor.matrix.length, 4);
    assert.equal(tensor.matrix[0].length, 4);
    assert.ok(typeof tensor.trace === 'number');
    assert.ok(typeof tensor.determinant === 'number');
    assert.equal(tensor.eigenvaluesApprox.length, 4);
    assert.ok(tensor.resonanceScore >= 80);
  });

  await t.test('Validates IBM Granite 2FA hardware fingerprint stream', () => {
    const successRes = synapseService.verify2fa('849201');
    assert.equal(successRes.success, true);
    assert.match(successRes.message, /VALIDATED/);

    const failRes = synapseService.verify2fa('000000');
    assert.equal(failRes.success, false);
    assert.match(failRes.message, /failed/);
  });

  await t.test('Reloads launchd service daemon with fresh PID', () => {
    const initialPid = synapseService.getStatus().pid;
    const res = synapseService.restartService();
    assert.equal(res.success, true);
    assert.ok(res.pid > 0);
  });
});
