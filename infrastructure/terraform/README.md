# Terraform Configuration for No Time To Lie

This directory contains Terraform configurations for deploying the No Time To Lie application to cloud environments.

## Prerequisites

1. Install Terraform CLI
2. Configure your cloud provider credentials
3. Initialize Terraform: `terraform init`

## Usage

```bash
# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy infrastructure
terraform destroy
```

## Configuration

The main configuration files are:
- `main.tf` - Main infrastructure resources
- `variables.tf` - Input variables
- `outputs.tf` - Output values
- `terraform.tfvars` - Variable values (not committed to git)