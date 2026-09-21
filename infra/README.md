# Infrastructure — Terraform

Provisions the AWS infrastructure for EIMS: VPC, public + private subnets,
security groups, an EC2 instance running k3s, and an RDS PostgreSQL database.

## ⚠️ Cost management — read this first

None of these resources are fully free forever. To stay within a small budget:

- **Always run `terraform destroy` when you're done for the day.** Nothing
  here needs to run 24/7 while you're just working on the project.
- `t3.micro` (EC2) and `db.t3.micro` (RDS) are free-tier eligible for the
  first 12 months of a new AWS account, but only for a limited number of
  hours per month combined across your whole account.
- There is deliberately **no NAT Gateway** in this design (that's the
  single most common accidental cost in projects like this, at ~$32/month
  if left running) — see the comments in `vpc.tf` for why we don't need one.

## Prerequisites

- AWS CLI configured (`aws configure`) with an IAM user (not root)
- Terraform installed (`terraform -version` to check)
- Your public IP address (get it at https://checkip.amazonaws.com)

## First-time setup

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and fill in:
- `my_ip` — your public IP in CIDR form (e.g. `1.2.3.4/32`)
- `db_password` — a strong password for the RDS master user

## Usage

```bash
terraform init      # downloads the AWS provider, sets up local state
terraform plan       # shows what will be created - review before applying
terraform apply      # creates everything (type 'yes' to confirm)
```

When you're done working for the session:
```bash
terraform destroy    # tears everything down (type 'yes' to confirm)
```

## Connecting to the EC2 instance (no SSH key needed)

```bash
aws ssm start-session --target <instance-id> --region ap-south-1
```
(the exact command, with your instance ID filled in, is printed as an output
after `terraform apply` — look for `connect_via_ssm`)

## What gets created

| Resource | Purpose |
|---|---|
| VPC + 1 public + 2 private subnets | Network isolation across tiers |
| Internet Gateway | Public subnet's route to the internet |
| Security groups | EC2: web ports + k3s API restricted to your IP. RDS: Postgres reachable only from the EC2 security group |
| IAM role + instance profile | SSM access to EC2 - no SSH keys, all access IAM-authenticated and logged |
| EC2 (t3.micro) | Runs k3s, hosts the frontend + backend containers |
| RDS PostgreSQL (db.t3.micro) | Private, not publicly accessible, encrypted storage |
