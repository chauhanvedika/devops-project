variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Name prefix used for tagging all resources"
  type        = string
  default     = "eims"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet (hosts the EC2/k3s instance)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (RDS requires 2+ AZs for its subnet group)"
  type        = list(string)
  default     = ["10.0.2.0/24", "10.0.3.0/24"]
}

variable "availability_zones" {
  description = "Availability zones to spread subnets across"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "my_ip" {
  description = "Your home/office public IP in CIDR form (e.g. 1.2.3.4/32) - used to restrict SSH access. Get yours at https://checkip.amazonaws.com"
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 instance type for the k3s node"
  type        = string
  default     = "t3.small" 
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro" # free-tier eligible
}

variable "db_name" {
  description = "Name of the application database"
  type        = string
  default     = "eims"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "eimsadmin"
}

variable "db_password" {
  description = "Master password for RDS - set via terraform.tfvars (gitignored) or TF_VAR_db_password env var, never commit this"
  type        = string
  sensitive   = true
}
