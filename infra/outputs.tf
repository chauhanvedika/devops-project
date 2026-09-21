output "ec2_public_ip" {
  description = "Public IP of the k3s EC2 instance"
  value       = aws_instance.k3s_node.public_ip
}

output "ec2_instance_id" {
  description = "Instance ID - use this to connect via SSM Session Manager"
  value       = aws_instance.k3s_node.id
}

/*
output "rds_endpoint" {
  description = "RDS connection endpoint (host:port)"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "RDS host address only (no port) - use this for DB_HOST"
  value       = aws_db_instance.postgres.address
}
*/

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "connect_via_ssm" {
  description = "Command to connect to the EC2 instance without SSH"
  value       = "aws ssm start-session --target ${aws_instance.k3s_node.id} --region ${var.aws_region}"
}
