packer {
  required_plugins {
    amazon = {
      source  = "github.com/hashicorp/amazon"
      version = ">= 1.0.0"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "ami_users" {
  description = "List of AWS account IDs that will be allowed to use the AMI."
  type        = list(string)
  default     = ["273483739956", "729016352823"]
}

variable "access_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "secret_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "instance_type" {
  description = "The type of instance to start."
  type        = string
  default     = "t3.micro"
}

variable "ssh_username" {
  description = "The SSH username used to communicate with the instance."
  type        = string
  default     = "admin"
}

variable "ami_filter_name" {
  type    = string
  default = "debian-12-*"
}

variable "block_device_volume_size" {
  type    = number
  default = 25
}

variable "block_device_volume_type" {
  type    = string
  default = "gp2"
}


locals {
  timestamp_val = formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())
}

source "amazon-ebs" "debian" {
  region          = var.aws_region != "" ? var.aws_region : null
  ami_name        = "webapp-ami-${local.timestamp_val}"
  ami_description = "AMI for WebApp"
  ami_users       = var.ami_users
  access_key      = var.access_key != "" ? var.access_key : null
  secret_key      = var.secret_key != "" ? var.secret_key : null
  ssh_agent_auth  = false

  source_ami_filter {
    filters = {
      virtualization-type = "hvm"
      name                = var.ami_filter_name
      root-device-type    = "ebs"
      architecture        = "x86_64"
    }
    owners      = ["amazon"]
    most_recent = true
  }

  instance_type = var.instance_type
  ssh_username  = var.ssh_username

  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/xvda"
    volume_size           = var.block_device_volume_size
    volume_type           = var.block_device_volume_type
  }

  tags = {
    Name = "webapp-ami"
  }
}

build {
  sources = ["source.amazon-ebs.debian"]

  provisioner "shell" {
    inline = [
      "echo 'Installing CloudWatch Agent...'",
      "curl https://s3.amazonaws.com/amazoncloudwatch-agent/debian/amd64/latest/amazon-cloudwatch-agent.deb -o amazon-cloudwatch-agent.deb",
      "sudo dpkg -i -E ./amazon-cloudwatch-agent.deb"
    ]
  }

  provisioner "file" {
    source      = "./cloudwatch-agent-config.json"
    destination = "/tmp/cloudwatch-agent-config.json"
  }

  provisioner "shell" {
    inline = [
      "echo 'Copying CloudWatch agent config file to the correct location'",
      "sudo cp /tmp/cloudwatch-agent-config.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json",
      "sudo systemctl enable amazon-cloudwatch-agent"
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo mkdir -p /tmp/webapp && sudo chown admin:admin /tmp/webapp"
    ]
  }

  provisioner "shell" {
    inline = [
      "ls -ld /tmp/webapp",
      "id"
    ]
  }

  provisioner "file" {
    source      = "./"
    destination = "/tmp/webapp"
    direction   = "upload"
  }

  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/webapp",
      "sudo mv /tmp/webapp/* /opt/webapp/",
      "sudo chown -R nobody:nogroup /opt/webapp"
    ]
  }

  provisioner "shell" {
    script = "./setup.sh"
  }

  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}
