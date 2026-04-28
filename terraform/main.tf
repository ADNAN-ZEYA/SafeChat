terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = "ap-south-1"
  profile = "personal"
}

# --- Key Pair ---
resource "aws_key_pair" "safechat_key" {
  key_name   = "safechat-key"
  public_key = file("${path.module}/safechat-key.pub")
}

# --- Security Group ---
resource "aws_security_group" "safechat_sg" {
  name        = "safechat-sg"
  description = "SafeChat security group"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Backend API"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Frontend"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "safechat-sg"
  }
}

# --- EC2 Instance ---
resource "aws_instance" "safechat_server" {
  ami                    = "ami-0f58b397bc5c1f2e8"
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.safechat_key.key_name
  vpc_security_group_ids = [aws_security_group.safechat_sg.id]
  monitoring             = true

  root_block_device {
    volume_size = 20
    volume_type = "gp2"
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg
              install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              chmod a+r /etc/apt/keyrings/docker.gpg
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
              usermod -aG docker ubuntu
              systemctl enable docker
              systemctl start docker
              apt-get install -y nginx
              systemctl enable nginx
              systemctl start nginx
              EOF

  tags = {
    Name    = "safechat-server"
    Project = "SafeChat"
  }
}

# --- Elastic IP ---
resource "aws_eip" "safechat_eip" {
  instance = aws_instance.safechat_server.id
  domain   = "vpc"

  tags = {
    Name = "safechat-eip"
  }
}

# --- CloudWatch Dashboard ---
resource "aws_cloudwatch_dashboard" "safechat" {
  dashboard_name = "SafeChat-Dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "CPU Utilization %"
          metrics = [["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.safechat_server.id]]
          period  = 60
          stat    = "Average"
          region  = "ap-south-1"
          view    = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Network In/Out (Bytes)"
          metrics = [
            ["AWS/EC2", "NetworkIn", "InstanceId", aws_instance.safechat_server.id],
            ["AWS/EC2", "NetworkOut", "InstanceId", aws_instance.safechat_server.id]
          ]
          period = 60
          stat   = "Average"
          region = "ap-south-1"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "Disk Read/Write (Bytes)"
          metrics = [
            ["AWS/EC2", "DiskReadBytes", "InstanceId", aws_instance.safechat_server.id],
            ["AWS/EC2", "DiskWriteBytes", "InstanceId", aws_instance.safechat_server.id]
          ]
          period = 60
          stat   = "Average"
          region = "ap-south-1"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "Status Check Failed"
          metrics = [["AWS/EC2", "StatusCheckFailed", "InstanceId", aws_instance.safechat_server.id]]
          period  = 60
          stat    = "Maximum"
          region  = "ap-south-1"
          view    = "timeSeries"
        }
      }
    ]
  })
}

# --- CloudWatch CPU Alarm ---
resource "aws_cloudwatch_metric_alarm" "cpu_alarm" {
  alarm_name          = "safechat-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggers when CPU exceeds 80%"

  dimensions = {
    InstanceId = aws_instance.safechat_server.id
  }

  tags = {
    Name = "safechat-cpu-alarm"
  }
}