#!/usr/bin/env bash
# Copies one run (and the Jev screening files of its tasks) into submission/<run-id>/ so it can be committed.
set -euo pipefail
run_dir="${1:?usage: scripts/bundle-run.sh runs/<run-id>}"
run_id="$(basename "$run_dir")"
target="submission/$run_id"
[[ -f "$run_dir/summary.json" ]] || { echo "No summary.json in $run_dir" >&2; exit 1; }
mkdir -p "$target/screening"
cp -R "$run_dir/artifacts" "$run_dir/proposals" "$target/"
cp "$run_dir/summary.json" "$run_dir/metrics.json" "$run_dir/trace.jsonl" "$run_dir/trace.md" "$run_dir/inference.jsonl" "$target/"
for extra in stars-report.md stars-screening.json; do [[ -f "$run_dir/$extra" ]] && cp "$run_dir/$extra" "$target/"; done
dataset_version="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).datasetVersion)' "$run_dir/summary.json")"
[[ -f "$run_dir/stars-screening.json" ]] || for task in $(node -e 'for (const r of JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).results) console.log(r.taskId)' "$run_dir/summary.json"); do
  for screening in "runs/screening/$dataset_version/$task.json" "runs/screening/$dataset_version/$task".prefilter-*.json "runs/screening/$dataset_version/company-${task%%-*}.json"; do
    [[ -f "$screening" ]] && cp "$screening" "$target/screening/"
  done
done
if grep -rq "sk-or-" "$target"; then echo "Refusing: an API key pattern was found in $target" >&2; rm -rf "$target"; exit 1; fi
echo "Bundled $run_dir -> $target ($(du -sh "$target" | cut -f1))"
