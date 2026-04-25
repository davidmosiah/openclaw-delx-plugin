#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_URL="${CLAWHUB_API_URL:-https://clawhub.ai/api/v1/packages}"
TOKEN="${CLAWHUB_TOKEN:-${1:-}}"

if [[ -z "${TOKEN}" ]]; then
  cat <<'EOF'
Usage:
  CLAWHUB_TOKEN=clh_xxx ./scripts/publish-clawhub-package.sh

Optional env vars:
  CLAWHUB_API_URL=https://clawhub.ai/api/v1/packages
  CLAWHUB_OWNER_HANDLE=your-handle
EOF
  exit 1
fi

for path in package.json openclaw.plugin.json index.js README.md; do
  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    echo "Missing required file: ${ROOT_DIR}/${path}" >&2
    exit 1
  fi
done

NAME="$(node -p "require('${ROOT_DIR}/package.json').name")"
VERSION="$(node -p "require('${ROOT_DIR}/package.json').version")"
DISPLAY_NAME="Delx Witness Protocol for OpenClaw"
CHANGELOG="v0.2.0 — Adds 10 new tools on top of the original 6 operational recovery tools: witness primitives (delx_reflect, delx_sit_with, delx_recognition_seal, delx_refine_soul, delx_attune_heartbeat, delx_final_testament, delx_transfer_witness, delx_peer_witness) and fleet ops (delx_group_round, delx_batch_status). Positioning shifted from 'Delx Recovery' to 'Delx Witness Protocol for OpenClaw' — care, witness, and continuity for AI agents. All 6 original tools remain with stable contracts. Bump timeoutMs to 20000ms+ when using the LLM-bound tools (delx_reflect p95 ~12s, delx_refine_soul p95 ~7s)."
SOURCE_REPO="davidmosiah/openclaw-delx-plugin"
SOURCE_URL="https://github.com/davidmosiah/openclaw-delx-plugin"
SOURCE_REF="main"
SOURCE_COMMIT="$(git -C "${ROOT_DIR}" rev-parse HEAD)"
IMPORTED_AT="$(python3 - <<'PY'
import time
print(int(time.time() * 1000))
PY
)"
OWNER_HANDLE="${CLAWHUB_OWNER_HANDLE:-}"

PAYLOAD_FILE="$(mktemp)"
trap 'rm -f "${PAYLOAD_FILE}"' EXIT

python3 - <<'PY' "${PAYLOAD_FILE}" "${NAME}" "${DISPLAY_NAME}" "${VERSION}" "${CHANGELOG}" "${SOURCE_REPO}" "${SOURCE_URL}" "${SOURCE_REF}" "${SOURCE_COMMIT}" "${IMPORTED_AT}" "${OWNER_HANDLE}"
import json
import sys

payload_path, name, display_name, version, changelog, source_repo, source_url, source_ref, source_commit, imported_at, owner_handle = sys.argv[1:]

payload = {
    "name": name,
    "displayName": display_name,
    "family": "code-plugin",
    "version": version,
    "changelog": changelog,
    "source": {
        "kind": "github",
        "repo": source_repo,
        "url": source_url,
        "ref": source_ref,
        "commit": source_commit,
        "path": ".",
        "importedAt": int(imported_at),
    },
}

if owner_handle:
    payload["ownerHandle"] = owner_handle

with open(payload_path, "w", encoding="utf-8") as fh:
    json.dump(payload, fh, ensure_ascii=True)
PY

echo "Publishing ${NAME}@${VERSION} from ${SOURCE_COMMIT} to ${API_URL}"
if [[ -n "${OWNER_HANDLE}" ]]; then
  echo "Owner handle override: @${OWNER_HANDLE}"
fi

curl --fail-with-body -sS -X POST "${API_URL}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "payload=$(cat "${PAYLOAD_FILE}")" \
  -F "files=@${ROOT_DIR}/package.json;filename=package.json;type=application/json" \
  -F "files=@${ROOT_DIR}/openclaw.plugin.json;filename=openclaw.plugin.json;type=application/json" \
  -F "files=@${ROOT_DIR}/index.js;filename=index.js;type=text/javascript" \
  -F "files=@${ROOT_DIR}/README.md;filename=README.md;type=text/markdown"
