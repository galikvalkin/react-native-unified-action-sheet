#!/usr/bin/env bash
# Prints "true" when the Android builds need to run for the changes between
# two commits, "false" when nothing they build from changed.
#
#   .github/scripts/android-changed.sh <base-sha> <head-sha>
#
# Errs toward building: an unknown or missing base (a new branch, a
# force-push) prints "true".
set -euo pipefail

base="${1:-}"
head="${2:-HEAD}"

if [[ -z "$base" || "$base" =~ ^0+$ ]] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo true
  exit 0
fi

# What a debug Android build compiles: native sources, the codegen spec,
# the manifests and lockfiles that pick the native dependencies, autolinking
# config, and CI itself. JS (src/index.tsx, example-shared/) and docs are not
# compiled into a debug build, which loads its JS from Metro.
native='^(android/|example/android/|example-legacy/android/|src/Native[^/]*\.ts$|package\.json$|yarn\.lock$|turbo\.json$|example/(package\.json|react-native\.config\.js)$|example-legacy/(package\.json|package-lock\.json|react-native\.config\.js)$|\.github/(workflows/ci\.yml|actions/|scripts/android-changed\.sh))'

# Three dots: only what the head side changed since the merge base, not
# whatever landed on the base branch in the meantime.
if git diff --name-only "${base}...${head}" | grep -qE "$native"; then
  echo true
else
  echo false
fi
