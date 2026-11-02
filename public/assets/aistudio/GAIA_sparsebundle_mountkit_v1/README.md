# GAIA / SYNAPSE sparsebundle forensic mount kit (v1)

This package is **not evidence that an archive is mounted**, is not an APFS/HFS recovery tool, and does not repair or write to any disk image. It provides a constrained, read-only Google Drive band-file FUSE view, an optional explicit local copy, and metadata inventory.

## Verified connected Drive records (2026-10-29)

| Archive | Google Drive folder ID | Band count | Bytes reported by Drive |
|---|---|---:|---:|
| ChimeraSystem.sparsebundle | `1iCMrVNvBC_PKdfjSwt_2dwrWqHA7REy9` | 21 | 145,244,160 |
| Synapse.sparsebundle | `1IOMTN5BSstsiKheAAfpKwcrplgc0kU2v` | 5 | 25,018,368 |
| Nexus.sparsebundle | `1u82FTrp-d3ZPLwzjG5DGLqu12Amh4XEm` | 823 | 6,856,358,912 |

The archives contain Apple sparsebundle structures: `Info.plist`, `Info.bckup`, `token`, and a `bands/` directory. A sparsebundle **is a virtual block device**, not a browsable folder of documents. Missing band indices can represent intentionally sparse zero regions. A zero-length band needs further investigation, not automatic corruption claims. **No archive's internal filesystem or arbitrage files have been verified.**

## What works on which computer

- **Chromebook Crostini / Linux:** `rclone mount` with FUSE exposes the Drive folder **read-only**. Linux does not gain macOS `hdiutil` functionality; viewing APFS requires separate compatible tooling.
- **macOS:** use rclone to stage an exact archive locally; use `hdiutil attach -readonly -nobrowse` to attach and mount the filesystem (subject to permissions, intact bands, encryption/passphrase).
- **Samsung Termux:** terminal can browse Drive via rclone, but Android without FUSE privileges generally cannot kernel-mount that Drive or an Apple sparsebundle. A remote Mac can present a read-only share after mounting.
- **Windows:** use rclone/WinFsp for Drive exposure; macOS image attachment requires compatible additional software or a Mac. This kit does not claim Windows-native APFS support.

## Use (after reviewing these files)

Install/configure rclone separately on the target device using an account authorized to read the indicated Drive folders. The ChatGPT Drive connector's authentication is not transferred to rclone automatically.

```bash
bash drive_enclave.sh list
bash drive_enclave.sh inspect chimera gdrive
bash drive_enclave.sh mount chimera gdrive
bash drive_enclave.sh audit chimera
# Optional explicit download to a private local staging directory:
bash drive_enclave.sh stage chimera gdrive
# macOS only, after validating staging and backups:
bash drive_enclave.sh attach chimera
```

Repeat `chimera` with `synapse` and `nexus` when desired. Replace `gdrive` with **your** configured rclone remote name. To disconnect a band-file mount, run `bash drive_enclave.sh unmount chimera`. To detach a macOS disk image, use `hdiutil detach` with the device identifier returned by `hdiutil attach`.

*Practical note:* A FUSE-based Google Drive folder can be too slow/unreliable for Apple's many random block reads. Always prefer a **local verified copy** before attaching the image, and never use a read-write attachment during first forensic analysis. The Nexus folder alone has ~6.86 GB of band data, so confirm free disk space first.

## About HTTPDFS / HttpFS

Apache Hadoop HttpFS is a WebHDFS-compatible HTTP gateway for HDFS, **not** a direct Google Drive or macOS sparsebundle mounting protocol. Use Google Drive's supported API/rclone for this task. An authenticated HTTP/WebDAV frontend can be layered on later if needed; do not publish private sparsebundle bands using a public HTTP endpoint.

## Integrity requirements

1. Confirm Drive account and folder permissions independently on each device.
2. Do not run any uploaded packed 'repair' script merely to mount the archive. Only execute code after inspection.
3. Use SHA-256 hashes of full local band files (`python3 enclave_audit.py ARCHIVE --hash`) when strong file evidence is needed; this can read multiple gigabytes.
4. No production/ADAM promotion until disk-image attachment **and** actual file listing are verified with timestamped receipts.
5. Never upload original unencrypted disk images, private keys, or account tokens into a public GitHub repository.
