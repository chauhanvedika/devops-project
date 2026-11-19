#!/usr/bin/env bash
# Creates the eims-secrets Secret (never committed to git). Existing secret is kept,
# because changing the DB password would lock the app out of an existing database volume.
# Provide values via env (DB_USER, DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD) or let them be generated.
set -euo pipefail
NS=eims
rand() { head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c "$1"; }

if kubectl -n "$NS" get secret eims-secrets >/dev/null 2>&1 && [ "${FORCE:-}" != "1" ]; then
  echo "eims-secrets already exists - leaving it unchanged (FORCE=1 to replace)."; exit 0
fi

GEN_ADMIN=""
[ -z "${ADMIN_PASSWORD:-}" ] && ADMIN_PASSWORD="$(rand 20)" && GEN_ADMIN=1

kubectl -n "$NS" create secret generic eims-secrets \
  --from-literal=db-user="${DB_USER:-eimsuser}" \
  --from-literal=db-password="${DB_PASSWORD:-$(rand 32)}" \
  --from-literal=jwt-secret="${JWT_SECRET:-$(rand 64)}" \
  --from-literal=admin-password="$ADMIN_PASSWORD" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "eims-secrets created."
[ -n "$GEN_ADMIN" ] && echo "Generated admin password (shown once, store it safely): $ADMIN_PASSWORD"
exit 0
