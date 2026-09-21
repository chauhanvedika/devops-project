# --- EC2 security group (public-facing app tier) ---
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Allow web traffic and restricted SSH to the k3s EC2 instance"
  vpc_id      = aws_vpc.main.id

  # Note: no SSH (port 22) ingress rule at all. Access to this instance is
  # via AWS Systems Manager Session Manager (IAM-authenticated, see iam.tf),
  # not SSH - so there's no need to open port 22 to the internet.

  # Frontend (nginx) - public
  ingress {
    description = "HTTP frontend"
    from_port   = 30080
    to_port     = 30080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend API - public (kept simple for this project; in a stricter setup
  # this would sit behind the frontend/ingress only, with no direct public access)
  ingress {
    description = "Backend API"
    from_port   = 30050
    to_port     = 30050
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # k3s API server - restricted to admin IP, used for kubectl access
  ingress {
    description = "k3s API server (kubectl access)"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  egress {
    description = "Allow all outbound (needed to pull Docker images, apt updates, etc.)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }
}

# --- RDS security group (data tier) ---
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow Postgres access only from the EC2 app tier"
  vpc_id      = aws_vpc.main.id

  # Key security control: reference the EC2 security group directly,
  # not a CIDR block. Only traffic actually originating from instances
  # in that SG can reach the database - not "anything in this subnet".
  ingress {
    description     = "Postgres from EC2 app tier only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}
