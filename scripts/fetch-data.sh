#!/usr/bin/env bash
set -euo pipefail
dataset_root="${1:-data}"
dataset_commit="4fb99b3749adf0d10b5977089ff4c73f4f522240"
if [[ -e "$dataset_root" ]]; then
  if [[ ! -e "$dataset_root/.git" ]]; then
    echo "Destination exists without dataset git metadata: $dataset_root" >&2
    exit 1
  fi
else
  git clone --no-checkout https://github.com/jigjoy-ai/einstein-matchmaker-data.git "$dataset_root"
  git -C "$dataset_root" checkout --detach "$dataset_commit"
fi
actual_commit="$(git -C "$dataset_root" rev-parse HEAD)"
[[ "$actual_commit" == "$dataset_commit" ]] || { echo "Dataset revision differs from the pinned version" >&2; exit 1; }
echo "Dataset ready at $dataset_root/data ($actual_commit)"
