#!/bin/sh
# S.O.S portable emergency recovery installer — user-space only
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
case "${PREFIX:-}" in
  *com.termux*) BIN="$HOME/Æ/bin" ;;
  *) BIN="$HOME/.local/bin" ;;
esac
mkdir -p "$BIN"
cp "$ROOT/scripts/sos-recover.sh" "$BIN/sos-recover"
chmod 700 "$BIN/sos-recover"
PROFILE=""
for f in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
  [ -f "$f" ] || continue
  if ! grep -Fq "$BIN" "$f"; then
    printf '\n# S.O.S Emergency Recovery PATH\ncase ":$PATH:" in *":%s:"*) ;; *) export PATH="%s:$PATH" ;; esac\n' "$BIN" "$BIN" >> "$f"
  fi
done
export PATH="$BIN:$PATH"
echo "Installed sos-recover to: $BIN/sos-recover"
"$BIN/sos-recover" status
echo "Open a new shell or run: . \"$HOME/.profile\" (if using a POSIX profile)"
