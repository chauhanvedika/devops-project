terraform {
  required_version = ">= 1.5.0"

    required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # State is kept local for this solo portfolio project.
  # In a real team setting, this would point to an S3 backend with
  # DynamoDB state locking - worth knowing even though we keep it
  # simple here to avoid extra always-on cost (S3 storage is cheap,
  # but it's one more moving part not needed for a single learner).
}

provider "aws" {
  region = var.aws_region
}
