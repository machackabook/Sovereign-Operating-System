# S.O.S Emergency Recovery Runtime

**Status:** portable terminal recovery layer (Phase A). This is not yet a bootable ISO/USB image.

## Purpose
Provide a small, offline-capable, non-destructive recovery command in each supported user terminal. It gathers diagnostics, creates a timestamped recovery bundle, checks available storage and core commands, and opens an interactive rescue shell. It does not repartition disks, reinstall operating systems, change boot records, or upload private data.

## Install
Run the bootstrap from a trusted checkout or downloaded copy:

```sh
sh scripts/install-sos-recovery.sh
```

The installer places `sos-recover` in a user-owned bin directory and adds that directory to supported shell PATH startup files. It does not need root. On Termux it uses `$HOME/Æ/bin`; elsewhere it uses `$HOME/.local/bin`.

## Commands
- `sos-recover status` — platform and tool inventory.
- `sos-recover collect` — create a local diagnostic bundle under `$HOME/SOS-Recovery/reports`.
- `sos-recover shell` — enter an interactive rescue shell.
- `sos-recover help` — usage.

## Safety contract
- No automatic disk writes to block devices.
- No automatic mount, format, partition, bootloader, firmware, or OS-install actions.
- No secrets, environment variables, browser profiles, SSH keys, or credential stores are collected.
- Reports remain local; the operator decides whether to share them.
- Missing privileges or tools are reported, never silently bypassed.
- All operations are user-scoped and may be removed by deleting the installed launcher and its PATH line.

## Bootable SOS roadmap (Phase B)
A real bootable recovery medium requires a reproducible Linux distribution build, signed boot artifacts, UEFI bootloader, kernel, initramfs, root filesystem, hardware/firmware compatibility matrix, persistence policy, installer, and tested recovery workflows. The portable terminal runtime in Phase A is not a substitute for these artifacts. Build and test the live image in CI before claiming bootability.

## Device roles
- Chromebook Crostini: user-space diagnostics; raw USB access may not be exposed.
- Android Termux: user-space diagnostics; no root or raw block access assumed.
- Debian/Ubuntu/Linux: user-space diagnostics; privileged repair remains manual.
- Windows PowerShell: future native adapter; current POSIX installer does not target PowerShell.
