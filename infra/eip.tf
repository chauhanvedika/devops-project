# Static public IP that stays attached across stop/start cycles - without
# this, the frontend's baked-in API URL breaks every time the instance
# restarts with a new IP, which defeats the purpose of automated CI/CD.
resource "aws_eip" "k3s_node" {
  instance = aws_instance.k3s_node.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-k3s-eip"
  }
}

output "ec2_static_ip" {
  description = "Static public IP - use this instead of ec2_public_ip, which changes on stop/start"
  value       = aws_eip.k3s_node.public_ip
}