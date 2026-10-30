#!/bin/sh
# Git Pre-Commit Hook — ABDA Pipeline Integration
# Validates source code integrity, TypeScript syntax, and cryptographic seals before finalizing commits.

echo "========================================================================"
echo "⚓ GIT PRE-COMMIT HOOK: TRIGGERING ABDA PIPELINE AUDIT"
echo "========================================================================"

npm run abda:check

if [ $? -ne 0 ]; then
  echo "\n❌ ABDA PIPELINE FAILED — COMMIT REJECTED FOR SECURITY INTEGRITY"
  exit 1
fi

echo "\n✓ ABDA PIPELINE PASSED — PROCEEDING WITH COMMIT"
exit 0
