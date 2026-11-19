#!/usr/bin/env bash
# Runs the whole stack on a local k3s-in-Docker cluster. Cost: Rs 0.
# Requires: docker, k3d, kubectl
set -euo pipefail
cd "$(dirname "$0")/.."
for t in docker k3d kubectl; do command -v "$t" >/dev/null || { echo "missing tool: $t"; exit 1; }; done

if ! k3d cluster list | grep -q '^eims '; then
  k3d cluster create eims --port "8080:80@loadbalancer" --agents 0
fi
kubectl config use-context k3d-eims >/dev/null

docker build -t eims-backend:local ./backend
docker build -t eims-frontend:local ./frontend
k3d image import eims-backend:local eims-frontend:local -c eims

kubectl apply -f k8s/base/namespace.yaml
./scripts/create-secrets.sh
kubectl apply -k k8s/overlays/local

kubectl -n eims rollout status statefulset/postgres --timeout=180s
kubectl -n eims rollout status deployment/eims-backend --timeout=180s
kubectl -n eims rollout status deployment/eims-frontend --timeout=120s
echo "EIMS is up: http://localhost:8080   (user: admin, password: see create-secrets output)"
echo "Tear down: k3d cluster delete eims"
