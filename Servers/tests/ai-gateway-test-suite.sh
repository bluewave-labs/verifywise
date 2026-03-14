#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# AI Gateway — Comprehensive Test Suite
#
# Prerequisites:
#   - Backend running on port 3000
#   - Frontend running on port 5173 (for Playground tests)
#   - AIGateway (FastAPI) running on port 8100
#   - PostgreSQL with verifywise schema + gateway tables
#
# Environment variables (set before running):
#   VW_EMAIL       — VerifyWise login email (default: gorkem.cetin@verifywise.ai)
#   VW_PASSWORD    — VerifyWise login password
#   ANTHROPIC_KEY  — Anthropic API key (optional, for real LLM tests)
#   OPENAI_KEY     — OpenAI API key (optional, for real LLM tests)
#   OPENROUTER_KEY — OpenRouter API key (optional, for multi-model tests)
#
# Usage:
#   chmod +x tests/ai-gateway-test-suite.sh
#   VW_PASSWORD=xxx ./tests/ai-gateway-test-suite.sh
#   VW_PASSWORD=xxx ANTHROPIC_KEY=sk-ant-... ./tests/ai-gateway-test-suite.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BASE_URL="${VW_BASE_URL:-http://localhost:3000/api}"
GATEWAY_URL="${VW_GATEWAY_URL:-http://localhost:8100}"
EMAIL="${VW_EMAIL:-gorkem.cetin@verifywise.ai}"
PASSWORD="${VW_PASSWORD:-}"

if [ -z "$PASSWORD" ]; then
  echo "ERROR: VW_PASSWORD is required"
  exit 1
fi

PASS=0; FAIL=0; SKIP=0

# ─── Helpers ──────────────────────────────────────────────────────────────────

get_token() {
  curl -s -X POST "$BASE_URL/users/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["token"])'
}

run_test() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $name"; PASS=$((PASS + 1))
  else
    echo "  ❌ $name (expected=$expected, got=$actual)"; FAIL=$((FAIL + 1))
  fi
}

skip_test() {
  echo "  ⏭️  $1 (skipped: $2)"; SKIP=$((SKIP + 1))
}

api() {
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -s --max-time 30 -X "$method" "$BASE_URL$path" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s --max-time 30 -X "$method" "$BASE_URL$path" \
      -H "Authorization: Bearer $TOKEN"
  fi
}

http_status() {
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X "$method" "$BASE_URL$path" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X "$method" "$BASE_URL$path" \
      -H "Authorization: Bearer $TOKEN"
  fi
}

echo "==========================================="
echo "  AI GATEWAY — TEST SUITE"
echo "==========================================="
echo ""

TOKEN=$(get_token)
echo "Auth token obtained."
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1: API KEY MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 1. API Key Management ──"

S=$(http_status GET /ai-gateway/keys); run_test "List keys" "200" "$S"
S=$(http_status POST /ai-gateway/keys '{"provider":"openai","key_name":"Test Key","api_key":"sk-test-12345"}'); run_test "Create key" "201" "$S"
S=$(http_status POST /ai-gateway/keys '{"provider":"openai"}'); run_test "Missing fields → 400" "400" "$S"

KEY_ID=$(api GET /ai-gateway/keys | python3 -c 'import sys,json; keys=json.load(sys.stdin).get("data",[]); print(keys[-1]["id"] if keys else "")' 2>/dev/null)
if [ -n "$KEY_ID" ]; then
  S=$(http_status PATCH "/ai-gateway/keys/$KEY_ID" '{"key_name":"Updated"}'); run_test "Update key" "200" "$S"
  S=$(http_status DELETE "/ai-gateway/keys/$KEY_ID"); run_test "Delete key" "200" "$S"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2: ENDPOINT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 2. Endpoint Management ──"

# Create a temp key for endpoint tests
TEMP_KEY_ID=$(api POST /ai-gateway/keys '{"provider":"openai","key_name":"Temp","api_key":"sk-temp"}' | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("id",""))' 2>/dev/null)

S=$(http_status POST /ai-gateway/endpoints "{\"display_name\":\"Test\",\"slug\":\"test-ep\",\"provider\":\"openai\",\"model\":\"gpt-4o\",\"api_key_id\":$TEMP_KEY_ID}"); run_test "Create endpoint" "201" "$S"
S=$(http_status GET /ai-gateway/endpoints); run_test "List endpoints" "200" "$S"
S=$(http_status POST /ai-gateway/endpoints "{\"display_name\":\"Bad\",\"slug\":\"has spaces\",\"provider\":\"openai\",\"model\":\"gpt-4o\",\"api_key_id\":$TEMP_KEY_ID}"); run_test "Invalid slug → 400" "400" "$S"
S=$(http_status POST /ai-gateway/endpoints '{"display_name":"Test"}'); run_test "Missing fields → 400" "400" "$S"

# Cleanup
EP_ID=$(api GET /ai-gateway/endpoints | python3 -c 'import sys,json; eps=json.load(sys.stdin).get("data",[]); print(next((e["id"] for e in eps if e["slug"]=="test-ep"),""))' 2>/dev/null)
[ -n "$EP_ID" ] && api DELETE "/ai-gateway/endpoints/$EP_ID" > /dev/null
[ -n "$TEMP_KEY_ID" ] && api DELETE "/ai-gateway/keys/$TEMP_KEY_ID" > /dev/null
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3: BUDGET MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 3. Budget Management ──"

S=$(http_status PUT /ai-gateway/budget '{"monthly_limit_usd":100,"alert_threshold_pct":80,"is_hard_limit":false}'); run_test "Set budget" "200" "$S"
S=$(http_status GET /ai-gateway/budget); run_test "Get budget" "200" "$S"
S=$(http_status PUT /ai-gateway/budget '{"monthly_limit_usd":-50}'); run_test "Negative amount → 400" "400" "$S"
S=$(http_status PUT /ai-gateway/budget '{"monthly_limit_usd":100,"alert_threshold_pct":150}'); run_test "Threshold > 100 → 400" "400" "$S"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4: SPEND ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 4. Spend Analytics ──"

S=$(http_status GET "/ai-gateway/spend?period=7d"); run_test "Spend summary" "200" "$S"
S=$(http_status GET "/ai-gateway/spend/by-endpoint?period=7d"); run_test "By endpoint" "200" "$S"
S=$(http_status GET "/ai-gateway/spend/by-user?period=7d"); run_test "By user" "200" "$S"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5: PROVIDERS
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 5. Providers ──"

PCOUNT=$(api GET /ai-gateway/providers | python3 -c 'import sys,json; print(len(json.load(sys.stdin).get("data",{}).get("providers",[])))' 2>/dev/null)
run_test "Provider list ($PCOUNT providers)" "True" "$([ "$PCOUNT" -gt 0 ] && echo True || echo False)"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6: GUARDRAIL RULES
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 6. Guardrail Rules ──"

S=$(http_status POST /ai-gateway/guardrails '{"guardrail_type":"pii","name":"Test PII","action":"block","config":{"entities":{"EMAIL_ADDRESS":"block"},"score_thresholds":{"ALL":0.5}}}'); run_test "Create PII rule" "201" "$S"
S=$(http_status POST /ai-gateway/guardrails '{"guardrail_type":"content_filter","name":"Test Keyword","action":"block","config":{"type":"keyword","pattern":"confidential"}}'); run_test "Create keyword filter" "201" "$S"
S=$(http_status POST /ai-gateway/guardrails '{"guardrail_type":"content_filter","name":"Test Regex","action":"mask","config":{"type":"regex","pattern":"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"}}'); run_test "Create regex filter" "201" "$S"
S=$(http_status POST /ai-gateway/guardrails '{"guardrail_type":"invalid","name":"Bad"}'); run_test "Invalid type → 400" "400" "$S"
S=$(http_status POST /ai-gateway/guardrails '{"guardrail_type":"content_filter","name":"Bad Regex","config":{"type":"regex","pattern":"[invalid"}}'); run_test "Invalid regex → 400" "400" "$S"
S=$(http_status GET /ai-gateway/guardrails); run_test "List rules" "200" "$S"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 7: GUARDRAIL SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 7. Guardrail Settings ──"

S=$(http_status PUT /ai-gateway/guardrails/settings '{"pii_on_error":"block","content_filter_on_error":"allow","log_retention_days":90}'); run_test "Upsert settings" "200" "$S"
S=$(http_status GET /ai-gateway/guardrails/settings); run_test "Get settings" "200" "$S"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 8: GUARDRAIL TEST (requires AIGateway on 8100)
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 8. Guardrail Test ──"

GW_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/health" 2>/dev/null || echo "000")
if [ "$GW_HEALTH" = "200" ]; then
  BLOCKED=$(api POST /ai-gateway/guardrails/test '{"text":"This is confidential info"}' | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("would_block",False))' 2>/dev/null)
  run_test "Keyword 'confidential' → blocked" "True" "$BLOCKED"

  MASKED=$(api POST /ai-gateway/guardrails/test '{"text":"Email me at test@example.com"}' | python3 -c 'import sys,json; d=json.load(sys.stdin).get("data",{}); print("True" if d.get("masked_preview") else "False")' 2>/dev/null)
  run_test "Email regex → masked" "True" "$MASKED"

  CLEAN=$(api POST /ai-gateway/guardrails/test '{"text":"Hello world"}' | python3 -c 'import sys,json; print(len(json.load(sys.stdin).get("data",{}).get("detections",[])))' 2>/dev/null)
  run_test "Clean text → 0 detections" "0" "$CLEAN"

  S=$(http_status POST /ai-gateway/guardrails/test '{}'); run_test "Missing text → 400" "400" "$S"
else
  skip_test "Guardrail test" "AIGateway not running on $GATEWAY_URL"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 9: GUARDRAIL LOGS & STATS
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 9. Guardrail Logs & Stats ──"

S=$(http_status GET "/ai-gateway/guardrails/logs?limit=10"); run_test "Logs endpoint" "200" "$S"
S=$(http_status GET "/ai-gateway/guardrails/stats?period=7d"); run_test "Stats endpoint" "200" "$S"
S=$(http_status POST /ai-gateway/guardrails/logs/purge); run_test "Purge endpoint" "200" "$S"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 10: AUTH
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 10. Auth ──"

S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ai-gateway/endpoints" -H "Authorization: Bearer invalid-token")
run_test "Invalid token → 401" "401" "$S"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 11: REAL LLM COMPLETIONS (optional, requires API keys)
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 11. Real LLM Completions ──"

if [ -n "${OPENAI_KEY:-}" ]; then
  # Create OpenAI key + endpoint
  OAI_KEY_ID=$(api POST /ai-gateway/keys "{\"provider\":\"openai\",\"key_name\":\"Test OpenAI\",\"api_key\":\"$OPENAI_KEY\"}" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("id",""))' 2>/dev/null)
  api POST /ai-gateway/endpoints "{\"display_name\":\"Test GPT\",\"slug\":\"test-gpt\",\"provider\":\"openai\",\"model\":\"openai/gpt-4o-mini\",\"api_key_id\":$OAI_KEY_ID}" > /dev/null 2>&1

  # Disable guardrails for clean test
  RULES=$(api GET /ai-gateway/guardrails | python3 -c 'import sys,json; [print(r["id"]) for r in json.load(sys.stdin).get("data",[])]' 2>/dev/null)
  for RID in $RULES; do api PATCH "/ai-gateway/guardrails/$RID" '{"is_active":false}' > /dev/null; done

  CONTENT=$(api POST /ai-gateway/chat '{"endpoint_slug":"test-gpt","messages":[{"role":"user","content":"Say hi"}]}' | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",d).get("choices",[{}])[0].get("message",{}).get("content","NONE"))' 2>/dev/null)
  run_test "OpenAI completion" "True" "$([ "$CONTENT" != "NONE" ] && [ -n "$CONTENT" ] && echo True || echo False)"

  # Re-enable guardrails
  for RID in $RULES; do api PATCH "/ai-gateway/guardrails/$RID" '{"is_active":true}' > /dev/null; done

  # Test guardrail blocking on real LLM
  S=$(http_status POST /ai-gateway/chat '{"endpoint_slug":"test-gpt","messages":[{"role":"user","content":"This is confidential"}]}')
  run_test "Guardrail blocks real LLM call (HTTP $S)" "422" "$S"

  # Cleanup
  TEST_EP=$(api GET /ai-gateway/endpoints | python3 -c 'import sys,json; eps=json.load(sys.stdin).get("data",[]); print(next((e["id"] for e in eps if e["slug"]=="test-gpt"),""))' 2>/dev/null)
  [ -n "$TEST_EP" ] && api DELETE "/ai-gateway/endpoints/$TEST_EP" > /dev/null
  [ -n "$OAI_KEY_ID" ] && api DELETE "/ai-gateway/keys/$OAI_KEY_ID" > /dev/null
else
  skip_test "OpenAI completion" "OPENAI_KEY not set"
  skip_test "Guardrail blocks real LLM" "OPENAI_KEY not set"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 12: FASTAPI DIRECT
# ═══════════════════════════════════════════════════════════════════════════════
echo "── 12. FastAPI Direct ──"

S=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/health" 2>/dev/null || echo "000")
run_test "Health endpoint" "200" "$S"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# CLEANUP: Delete test guardrail rules
# ═══════════════════════════════════════════════════════════════════════════════
echo "── Cleanup ──"

TEST_RULES=$(api GET /ai-gateway/guardrails | python3 -c 'import sys,json; [print(r["id"]) for r in json.load(sys.stdin).get("data",[]) if r.get("name","").startswith("Test ")]' 2>/dev/null)
for RID in $TEST_RULES; do
  api DELETE "/ai-gateway/guardrails/$RID" > /dev/null
  echo "  Deleted guardrail rule $RID"
done

echo ""
echo "==========================================="
echo "  RESULTS: $PASS passed, $FAIL failed, $SKIP skipped"
echo "==========================================="
