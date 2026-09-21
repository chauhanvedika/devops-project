# Look up the latest Amazon Linux 2023 AMI automatically instead of
# hardcoding an AMI ID (which would go stale and vary by region).
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "k3s_node" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_ssm.name
  user_data              = file("${path.module}/user-data.sh")

  # No SSH key pair needed - access is via SSM Session Manager only
  root_block_device {
    volume_size           = 30
    volume_type            = "gp3"
    encrypted              = true
    delete_on_termination  = true
  }

  metadata_options {
    http_tokens   = "required" # enforce IMDSv2 - blocks a common SSRF-to-credential-theft path
    http_endpoint = "enabled"
  }

  # Prevents Terraform from silently destroying/recreating this instance
  # just because AWS published a newer AMI since we last applied.
  lifecycle {
    ignore_changes = [ami]
  }

  tags = {
    Name = "${var.project_name}-k3s-node"
  }
}
