resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}
/*
resource "aws_db_instance" "postgres" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "16"

  instance_class    = var.db_instance_class
  allocated_storage = 20 # GB - within free tier
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false # never expose the database directly to the internet

  multi_az = false # single-AZ to stay within budget; note this as a known
                    # production tradeoff - Multi-AZ would add automatic
                    # failover but roughly doubles RDS cost

  backup_retention_period = 1 # minimal backups to control cost; real prod would use 7+
  skip_final_snapshot     = true # acceptable for a learning project we intend to destroy;
                                  # a real prod DB should never set this to true

  deletion_protection = false # so `terraform destroy` can actually tear this down;
                               # a real prod DB should set this to true

  tags = {
    Name = "${var.project_name}-postgres"
  }
}
*/