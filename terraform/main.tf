terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
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
  ami                    = "ami-0f58b397bc5c1f2e8"  # Ubuntu 22.04 ap-south-1
  instance_type          = "t2.micro"
  key_name               = aws_key_pair.safechat_key.key_name
  vpc_security_group_ids = [aws_security_group.safechat_sg.id]

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