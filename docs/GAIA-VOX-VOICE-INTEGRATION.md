# GAIA VOX — Natural Speech, Recognition, and Identity Boundaries

## Runtime contract

- **Speech output:** browser-native `SpeechSynthesis` / `SpeechSynthesisUtterance`, using the installed voices returned by `speechSynthesis.getVoices()`.
- **Voice selection:** `VoiceProfileModal` lists the actual voices installed on the current device. The selected `voiceURI`, voice profile, pitch and rate are stored in device-local browser preferences. No voice recording is uploaded or stored by this preference flow.
- **Speech input:** browser `SpeechRecognition` / `webkitSpeechRecognition`, started only after the user activates the microphone control or the optional phrase challenge. The wake-word parser and `NEXUS_COMMAND_REGISTRY` mapper run before mapped UI events are dispatched.
- **Canonical response:** terminal display and TTS use the same complete `reply` string. The shorter `speechText` projection is not allowed to replace the displayed answer.
- **Word highlighting:** uses actual browser speech boundary events when available. If the browser does not emit boundary events, the UI does not invent word timing.
- **Waveform honesty:** the Web Speech API does not expose the output PCM stream. `getVoiceAudioData()` therefore reports speech activity and word state with `samplesAvailable: false`, zero measured output level, and no claimed carrier frequency. Real microphone analyser data remains available when the microphone is active.
- **Sensor honesty:** orientation and motion values are shown only when received from device events. Unsupported proximity, echo-latency, RF and calibrated dBFS values remain `null` and are displayed as unavailable.

## Identity boundary

The optional spoken phrase is a UI activation challenge, not a secret, voiceprint, biometric, or identity factor. It cannot authorize protected documents.

Protected paths require a successful `crypticMeshService.connect()` exchange, which combines:

1. Existing Firebase Google sign-in with a verified email and `google.com` provider.
2. A Cloudflare Access JWT injected by the protected same-origin edge route.
3. Cryptic-side signature, issuer, audience, expiry and identity validation.

The bridge token remains in the shared service's memory. Signing out or changing Firebase identity locks the local gate and attempts bridge-token revocation. The `auth`, `login`, `unlock`, command-palette and inspection flows all use this same identity check. There is no manual bypass and no default operator identity.

The spoken phrase can open the verification panel, but only the real Google + Access exchange unlocks protected paths.

## Command registry and event flow

`src/services/speechCommandMapper.ts` exports `NEXUS_COMMAND_REGISTRY`. The terminal applies wake-word gating before mapping a transcript to a UI event. The `gaia:unlock-all-paths` event is classified as `identity-check` and invokes the real verification flow; it does not set authorization state directly.

The CrypticBus adapter in `crypticMeshService.ts` forwards only:

- `nexus.health`
- `nexus.echo`
- `sos.mesh.status`

Cryptic independently enforces the same action allowlist. Unknown commands and terminal command strings are not forwarded as remote actions.

## Personal audio asset boundary

The existing `banks_default.txt` asset is instrument-bank/program metadata, not a spoken-voice recording or trained voice model. The existing `speechutter.js` sample is a generic Web Speech example, not a personalized voice model. They are not misrepresented as custom speech data or silently uploaded. The current personalized behavior comes from the actual device voice list and locally saved voice preferences.

A custom audio pack can be integrated separately when a real, supported pack is explicitly supplied. Until then, the system uses the device's installed speech engine rather than fabricating a personal voice.

## Verification commands

```bash
npm run check:html
npm run test:audio
npm run test:security
npm run test:mesh
npm run lint
npm run build
```

The CI workflow runs these checks. A green local/CI build still does not prove a live Cloudflare Access session or a private NEXUS agent is connected; those require the real browser session and private host pairing.
