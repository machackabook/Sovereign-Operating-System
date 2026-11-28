#!/bin/sh
# S.O.S emergency runtime. Read-only diagnostics; no privileged repair.
set -u
VERSION="1.0.0"
BASE="$HOME/SOS-Recovery"
REPORTS="$BASE/reports"
mkdir -p "$REPORTS" 2>/dev/null || true
say(){ printf '%s\n' "$*"; }
status(){
  say "S.O.S RECOVERY RUNTIME $VERSION"
  say "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date)"
  say "Kernel: $(uname -srmo 2>/dev/null || uname -a)"
  say "User: ${USER:-unknown}"
  say "Home: $HOME"
  say "Prefix: ${PREFIX:-not-set}"
  say "Shell: ${SHELL:-unknown}"
  for c in sh bash python3 git curl ssh tar gzip sha256sum lsblk df; do
    command -v "$c" >/dev/null 2>&1 && say "AVAILABLE $c" || say "MISSING   $c"
  done
  say "--- storage ---"
  df -h "$HOME" 2>/dev/null || true
  if command -v lsblk >/dev/null 2>&1; then
    lsblk -o NAME,SIZE,TYPE,RM,RO,MOUNTPOINTS 2>/dev/null || true
  else
    say "lsblk unavailable; no raw-device inventory possible."
  fi
}
collect(){
  stamp="$(date -u '+%Y%m%dT%H%M%SZ' 2>/dev/null || date '+%Y%m%d%H%M%S')"
  out="$REPORTS/recovery-$stamp.txt"
  {
    say "S.O.S RECOVERY REPORT — $stamp"
    say "This report intentionally excludes credentials and environment values."
    say ""
    status
    say "--- network interfaces (addresses omitted where practical) ---"
    if command -v ip >/dev/null 2>&1; then ip -brief link 2>/dev/null || true; fi
    say "--- mounted filesystems ---"
    if command -v mount >/dev/null 2>&1; then mount 2>/dev/null | sed -E 's/(password|token|secret)=[^ ,]+/\1=[REDACTED]/Ig' || true; fi
    say "--- recent kernel messages (may be unavailable) ---"
    if command -v dmesg >/dev/null 2>&1; then dmesg 2>/dev/null | tail -n 80 || true; fi
  } > "$out"
  chmod 600 "$out" 2>/dev/null || true
  say "Local report created: $out"
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$out"; fi
}
case "${1:-help}" in
  status) status ;;
  collect) collect ;;
  shell) say "Entering user rescue shell. Type exit to return."; exec "${SHELL:-/bin/sh}" ;;
  help|-h|--help)
    say "Usage: sos-recover {status|collect|shell|help}"
    say "No disk formatting, partitioning, boot repair, or OS installation is performed."
    ;;
  *) say "Unknown command: $1"; exit 2 ;;
esac
