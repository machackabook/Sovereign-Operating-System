# S.O.S (SOVEREIGN OPERATING SYSTEMS) - Comprehensive Permissions & Architecture Matrix

## Copyright & Governance
© 2026 Cryptic News. All rights reserved. Sovereign Operating Systems Substrate.

---

## 1. Executive Summary & Architectural Topology
S.O.S operates on an abstracted **Sovereign Telemetry Bus** connecting physical device hardware, hypermedia runtimes, and local neural substrates. To guarantee device independence across mobile, desktop, and embedded platforms, the system provides zero-barrier driverless access across all modern Web, Chromium, and native OS interfaces.

---

## 2. Universal Permission & Hardware Capability Matrix

| Capability / API | Protocol / Standard | Access Scope | Status / Grant Mechanism | Subsystem Consumer |
| :--- | :--- | :--- | :--- | :--- |
| **Microphone Audio** | Web Audio API / `getUserMedia` | Operator Root | `perm grant` / Prompt | Oscilloscope waveform, voice commands, acoustic Shazam |
| **Camera Video** | MediaDevices / `getUserMedia` | Operator Root | `perm grant` / Prompt | Biometric verification, optical QR scanning, IP camera matrices |
| **System Notifications** | Web Notifications API | Operator Root | `Notification.requestPermission` | Background alerts, Gemini task completion broadcasts |
| **Screen Wake Lock** | Screen Wake Lock API | Operator Root | `navigator.wakeLock.request` | Prevents display sleep during neural generation & quine loops |
| **Geolocation (GPS)** | Geolocation API | Operator Root | `getCurrentPosition` | TerraSphere orbital mapping, NASA Earth coordinate sync |
| **Clipboard Read/Write**| Clipboard API | Operator Root | Authorized / User gesture | W3C text fragments (`:~:text=`), quine HTML export |
| **WebUSB / ADB** | WebUSB (W3C standard) | Hardware Bridge | Direct picker (`requestDevice`) | Android ADB debug bridge, Fastboot, hardware FPGA boards |
| **Web Bluetooth (BLE)** | Web Bluetooth / HCI | Hardware Bridge | Direct picker (`requestDevice`) | 2.4 GHz ISM beacons, V380 IP cameras, AirCast RSSI tracking |
| **Web Serial / SDR** | Web Serial API | Hardware Bridge | Direct picker (`requestPort`) | RTL-SDR wideband FM (Part 15.239), USB-UART microcontrollers |
| **WebHID Peripherals** | WebHID API | Hardware Bridge | Direct picker (`requestDevice`) | Stream decks, flight simulator controllers, macro keypads |
| **Web MIDI Controller**| Web MIDI API (SysEx) | Operator Root | `requestMIDIAccess` | Solfeggio 963 harmonic modulation, hardware synthesizers |
| **Sovereign Matrix Auth**| Monolithic RAM VFS | Operator Root | `voiceAuthGateService` | All 9 kernel editions, `/docs/protected`, hot-swap sectors |

---

## 3. Sovereign Operational Recommendations

### Recommendation A: Chromium Experimental Flag Optimization
For maximum hardware bandwidth, zero-driver Android ADB debugging, and direct RTL-SDR serial dongle access without origin sandbox isolation:
1. Open your Chromium-based browser (Google Chrome, Brave, Chromium, Edge).
2. Navigate to: `chrome://flags`
3. Locate and enable:
   - `#enable-experimental-web-platform-features` -> **Enabled**
   - `#enable-webusb-on-any-page` -> **Enabled**
4. Relaunch the browser. WebUSB, WebSerial, and WebBluetooth APIs will operate without cross-origin device filtering.

### Recommendation B: Standalone PWA (Progressive Web App) Installation
Running S.O.S as an installed standalone PWA provides:
- Unobstructed 100% viewport canvas (eliminates browser navigation bars and omnibox).
- Persistent Screen Wake Lock that remains active without background suspension.
- Native mobile haptic feedback (`navigator.vibrate`) on Android and touch devices.
- Immediate offline startup with service worker caching.
- **Install Flow**: Click the browser install icon in the URL bar (or *Add to Home Screen* in mobile Chrome).

### Recommendation C: Universal "Grant All Permissions" Sequencer
To authorize all supported permissions in a single coordinated sequence:
- In HyperTerminal, run:
  ```bash
  perm grant
  ```
  *(or shortcut: `perm all` / `perm grant-all`)*
- From the UI:
  - Press `Ctrl+K` (or `⌘K`) -> Select **⚡ Grant All Permissions**.
  - Or click the **Device Control** button in the dock and tap **⚡ GRANT ALL PERMISSIONS**.

### Recommendation D: Hardware Pairing Workflows
Certain hardware APIs (`WebUSB`, `WebBluetooth`, `WebSerial`, `WebHID`) require direct user device selection per modern browser security models.
- **Android ADB**: Run `adb devices` or click **Pair WebUSB (ADB)** in the Device Control panel.
- **RTL-SDR FM Receiver**: Click **Open Web Serial (RTL-SDR)** in the Device Control panel.
- **BLE Proximity Beacons**: Click **Scan Web Bluetooth** in the Device Control panel.

---

## 4. API Trigger Scope

All server-side proxy routes and local endpoints are protected under the Sovereign Operator scope:

| Endpoint | Method | Scope | Description |
| :--- | :--- | :--- | :--- |
| `/api/chat` | POST | Operator | Primary AI reasoning & Gemini proxy interface. |
| `/api/navigator` | POST | Operator | VFS navigation and file system telemetry. |
| `/api/score/update` | POST | Operator | Real-time user trivia and dynamic listening score sync. |
| `/api/score/:userId` | GET | Operator | Retrieve user score and acoustic verification ledger. |
| `/api/history` | POST | Operator | Persistent operational action history storage. |
| `/api/history/:userId` | GET | Operator | Historical session replay and telemetry trace. |
| `/api/compute/mine-arx` | POST | Operator | High-performance ARX cryptographic compute substrate. |
| `/api/alphafold/query` | GET | Operator | 3D AlphaFold protein structure and CA residue coordinates. |
| `/api/gemini/media-trivia`| POST | Operator | Acoustic Shazam classification and trivia metadata. |
| `/api/tvguide/search` | GET | Operator | Live TV Guide catalog and broadcast frequency mapping. |
| `/api/key-status` | GET | Admin | Server-side Gemini API key pool health and failover metrics. |
| `/api/runtime-status` | GET | Public | Node.js host gateway and WebSocket bridge status. |

---

## 5. Security Posture & Zero-Trust Guarantees
- **No Secret Leakage**: All upstream API keys remain strictly server-side in `server.ts`.
- **Local Sovereignty**: All audio demodulation, text fragment targeting, and quine replication execute client-side inside the browser or paired edge daemon.
- **Cryptographic Audit**: All sensitive documentation paths are sealed with Fermat digests in the `voiceAuthGateService`.

---

## 6. ChromeOS Experiments Audit (Build 158.0.8127.5) & System Recommendations

Audited from user-provided Chromium Experiments manifest (`Experiments_0790ed36.html`):

| Chrome Flag | Status | Recommendation & Operational Capability |
| :--- | :--- | :--- |
| `#enable-unrestricted-usb` | Recommended | Allows WebUSB to bypass OS blocklists and interface reservations. Required for zero-driver RTL-SDR bulk endpoint `0x81` streaming and direct Android ADB transport without native `adb_server` conflicts. |
| `#enable-web-bluetooth-new-permissions-backend` | Recommended | Unlocks persistent BLE device grants, `navigator.bluetooth.getDevices()`, and `BluetoothDevice.watchAdvertisements()`. Enables continuous BLE beacon and RSSI cataloging without repeating UI permission modals. |
| `#bluetooth-btsnoop-internals` | Recommended | Enables raw Bluetooth traffic capture into HCI packet logs (`/sys/kernel/debug/bluetooth`), permitting carrier wave anomaly diagnosis. |
| `#direct-sockets-in-service-workers` | Recommended | Unlocks raw TCP/UDP socket streaming in Service Workers. Allows web applets to connect directly to `rtl_tcp` (`127.0.0.1:1234`) and local ADB daemons (`127.0.0.1:5555`) in background threads. |
| `#tethering-experimental-functionality` | Recommended | Enables ChromeOS experimental Wi-Fi carrier hotspot multiplexing and multi-AP tethering aggregation. |
| `#enable-experimental-web-platform-features` | Recommended | Core toggle for Web Serial, WebHID, WebUSB, and modern AudioWorklet zero-latency buffer pipelines. |
| `#symphonia-audio-decoding` | Optimal | High-efficiency Rust-based audio decoder backend for low-latency PCM playback. |

---

## 7. SDR Demodulator & Polar Discriminator Architecture (`sdrDemodulatorBridge.ts`)

The sovereign SDR receiver implements a hardware-abstracted digital signal processor:
1. **Raw I/Q Ingestion**: Ingests interleaved 8-bit unsigned I/Q pairs ($I_n, Q_n \in [0, 255]$) via Web Serial (`navigator.serial`) at 921,600 baud or WebUSB bulk transfers.
2. **Polar Discriminator**:
   $$\Delta \theta_n = \text{atan2}(I_n Q_{n-1} - Q_n I_{n-1},\ I_n I_{n-1} + Q_n Q_{n-1})$$
3. **Decimation & Downsampling**: Decimates the RF baseband rate (240 kSps) down to 48 kHz audio rate ($D = 5$).
4. **De-Emphasis Filter**: Single-pole IIR filter ($75\ \mu\text{s}$ time constant for North American FM broadcast, $50\ \mu\text{s}$ for EU):
   $$\alpha = \exp\left(-\frac{1}{f_s \cdot \tau}\right), \quad y_n = (1 - \alpha) x_n + \alpha y_{n-1}$$
5. **Web Audio Worklet Pipe**: Ingested audio frames are dispatched directly into `/audio-demodulator-processor.js` via `workletNode.port.postMessage(audioData)`, bypassing main-thread GC audio stutter.
6. **Synthetic Carrier Fallback**: Generates realistic simulated FM broadcast carrier signals with atmospheric noise, frequency deviation ($\Delta f = 75\ \text{kHz}$), and tone lock for immediate testing without attached USB hardware.

---

## 8. Wireless Beacon, Bluetooth Catalog & Wi-Fi Carrier Aggregation (`wirelessBeaconBridge.ts`)

- **Bluetooth Peripheral Catalog**: Scans, pairs, and monitors BLE devices (V380 cameras, FCC Part 15 beacons, FHSS transceivers) with real-time RSSI, battery telemetry, and GATT services.
- **802.11 Multiplexed Beacon Generator**: Generates synthesized 802.11 beacon management frames across multiple virtual BSSIDs (e.g. `GAIA_SOVEREIGN_MESH_AP`, `FCC15_CARRIER_AGGREGATOR`) at 100 TU intervals.
- **Multi-AP Wi-Fi Bonding**: Virtualizes and bonds multiple upstream access points and cellular tether interfaces into a unified sovereign data pipe.

---

## 9. Bidirectional ADB Bus & USB Hardware Hub Subsystem

- **WebUSB ADB Protocol Engine**: Establishes raw bulk transfers (`EP 0x01 IN / OUT`) to connected Android devices.
- **Bus/Hub Hierarchy**: Enumerates USB descriptors, interface classes (`0xFF` Vendor Specific, Subclass `0x42` ADB), and packet sizing.
- **Bidirectional Shell & Reverse Tunnels**: Supports executing `adb shell` diagnostics (`getprop`, `ip a`, `dumpsys battery`, `logcat`) and abstracting `adb reverse tcp:8080 tcp:8080` for bidirectional host-to-device streaming.


