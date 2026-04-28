output "ec2_public_ip" {
  description = "Public IP of SafeChat EC2 instance"
  value       = aws_eip.safechat_eip.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS of SafeChat EC2 instance"
  value       = aws_instance.safechat_server.public_dns
}

output "ssh_command" {
  description = "SSH command to connect to EC2"
  value       = "ssh -i safechat-key.pem ubuntu@${aws_eip.safechat_eip.public_ip}"
}