#!/usr/bin/env bash
# GAIA/NEXUS Drive Enclave — read-only mount and explicit local staging
# This does NOT run without the user's manual execution.
set -Eeuo pipefail
COMMAND="${1:-help}"
ARCHIVE="${2:-}"
REMOTE="${3:-}"
ROOT="${GAIA_ENCLAVE_ROOT:-$HOME/Æ/enclaves}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
usage() {
cat <<'HELP'
GAIA/NEXUS SPARSEBUNDLE DRIVE MOUNTKIT — READ-ONLY
Usage:
  bash drive_enclave.sh list
  bash drive_enclave.sh inspect <chimera|synapse|nexus> <configured_rclone_drive_remote_name>
  bash drive_enclave.sh mount   <chimera|synapse|nexus> <configured_rclone_drive_remote_name>
  bash drive_enclave.sh audit   <chimera|synapse|nexus>
  bash drive_enclave.sh stage   <chimera|synapse|nexus> <configured_rclone_drive_remote_name>
  bash drive_enclave.sh attach  <chimera|synapse|nexus>   # macOS only, staged local copy
  bash drive_enclave.sh unmount <chimera|synapse|nexus>
No automatic installation, payment, disk modification, or authentication.
A chat connection to Google Drive does not configure rclone on your device.
The archive is NOT directly mountable as a filesystem merely via Google Drive or HttpFS.
HELP
}
if [[ "$COMMAND" == list ]]; then
    command -v rclone >/dev/null && rclone listremotes || echo 'rclone unavailable'
    exit 0
fi
if [[ "$COMMAND" == help || -z "$ARCHIVE" ]]; then usage; exit 0; fi
case "$ARCHIVE" in
 chimera) DRIVE_ID='1iCMrVNvBC_PKdfjSwt_2dwrWqHA7REy9'; FOLDER='ChimeraSystem.sparsebundle' ;;
 synapse) DRIVE_ID='1IOMTN5BSstsiKheAAfpKwcrplgc0kU2v'; FOLDER='Synapse.sparsebundle' ;;
 nexus) DRIVE_ID='1u82FTrp-d3ZPLwzjG5DGLqu12Amh4XEm'; FOLDER='Nexus.sparsebundle' ;;
 *) usage >&2; exit 2 ;;
esac
mkdir -p "$ROOT" "$ROOT/mounted" "$ROOT/staging" "$ROOT/reports" "$ROOT/cache"
MOUNT="$ROOT/mounted/$FOLDER"
STAGED="$ROOT/staging/$FOLDER"
if [[ "$COMMAND" == audit ]]; then
  if [[ -e "$STAGED/Info.plist" ]]; then python3 "$script_dir/enclave_audit.py" "$STAGED" --output "$ROOT/reports/${ARCHIVE}_local_audit.json"
  elif [[ -e "$MOUNT/Info.plist" ]]; then python3 "$script_dir/enclave_audit.py" "$MOUNT" --output "$ROOT/reports/${ARCHIVE}_drive_audit.json"
  else echo '[BLOCKED] Mount or stage the archive first.' >&2; exit 1; fi
  exit 0
fi
if [[ "$COMMAND" == attach ]]; then
  if [[ "$(uname -s)" != Darwin ]]; then echo '[BLOCKED] hdiutil requires macOS. Linux FUSE only exposes the band files.' >&2; exit 1; fi
  if [[ ! -f "$STAGED/Info.plist" ]]; then echo '[BLOCKED] Stage the complete archive locally first.' >&2; exit 1; fi
  python3 "$script_dir/enclave_audit.py" "$STAGED" --output "$ROOT/reports/${ARCHIVE}_pre_attach.json"
  hdiutil attach -readonly -nobrowse "$STAGED"
  exit 0
fi
if [[ "$COMMAND" == unmount ]]; then
  if [[ "$(uname -s)" == Darwin ]]; then umount "$MOUNT"
  elif command -v fusermount3 >/dev/null; then fusermount3 -u "$MOUNT"
  elif command -v fusermount >/dev/null; then fusermount -u "$MOUNT"
  else umount "$MOUNT"; fi
  exit 0
fi
if [[ "$COMMAND" != inspect && "$COMMAND" != mount && "$COMMAND" != stage ]]; then usage >&2; exit 2; fi
if ! command -v rclone >/dev/null; then echo '[BLOCKED] rclone is not installed on this device.' >&2; exit 1; fi
if [[ ! "$REMOTE" =~ ^[a-zA-Z0-9_-]+$ ]]; then echo '[BLOCKED] Supply a configured rclone remote name (no colon).' >&2; exit 1; fi
if ! rclone listremotes | grep -Fxq "${REMOTE}:"; then echo "[BLOCKED] rclone remote '${REMOTE}' not configured." >&2; exit 1; fi
if [[ "$COMMAND" == inspect ]]; then
  rclone lsf "${REMOTE}:" --drive-root-folder-id "$DRIVE_ID" --max-depth 2 --files-only
elif [[ "$COMMAND" == mount ]]; then
  mkdir -p "$MOUNT"
  if [[ -n "$(ls -A "$MOUNT")" ]]; then echo '[BLOCKED] Existing nonempty mount point.' >&2; exit 1; fi
  rclone mount "${REMOTE}:" "$MOUNT" --drive-root-folder-id "$DRIVE_ID" \
    --read-only --vfs-cache-mode full --vfs-cache-max-size 2G \
    --cache-dir "$ROOT/cache" --daemon
  echo "[MOUNTED] Read-only Google Drive band directory: $MOUNT"
  echo "[NOTE] This exposes bands and Info.plist; it does not attach APFS/HFS volume."
elif [[ "$COMMAND" == stage ]]; then
  mkdir -p "$STAGED"
  echo "[STAGING] Copying full archive to private local directory: $STAGED"
  rclone copy "${REMOTE}:" "$STAGED" --drive-root-folder-id "$DRIVE_ID" --checkers 4 --transfers 2 --retries 5
  python3 "$script_dir/enclave_audit.py" "$STAGED" --output "$ROOT/reports/${ARCHIVE}_staged_audit.json"
  echo '[STAGED] Inspect audit then, only on macOS: bash drive_enclave.sh attach' "${ARCHIVE}"
fi
