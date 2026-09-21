#!/bin/bash
set -euxo pipefail

# Update system
dnf update -y

# Install Docker
dnf install -y docker
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Install k3s (lightweight Kubernetes) - single node, disable the bundled
# Traefik ingress since we're keeping networking simple with NodePort services
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable=traefik" sh -

# Make kubectl usable without sudo for ec2-user via SSM sessions
mkdir -p /home/ec2-user/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ec2-user/.kube/config
chown -R ec2-user:ec2-user /home/ec2-user/.kube
chmod 600 /home/ec2-user/.kube/config

echo "Bootstrap complete: Docker + k3s installed" > /var/log/user-data-complete.log
