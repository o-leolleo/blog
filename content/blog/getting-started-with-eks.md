---
title: "Getting Started With EKS"
date: 2023-12-19T22:51:09+01:00
draft: true
language: en
---

I’ve decided to experiment with different EKS scenarios and configurations. But also thought that giving an introductory blog post on how to bootrstrap your own EKS cluster might help someone out there trying to do the same thing.

For that I'm using [Terraform](https://www.terraform.io/) and the [AWS EKS Terraform module](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest). The first is a very well known solution for maintaining infrastructure as code (IaC). The later is the best community maintained module - that I know of - for it and which covers most (if not all) the different EKS use cases.

I have to mention that this setup costs money, so if you're following it up, **I highly recommend that you destroy your terraform resources once finished, so you're not caught out of surprise with a considerable AWS bill**. I've even gone as far as [detroying my personal AWS account resources on a schedule](/blog/wiping-your-aws-account-with-aws-nuke-and-gitlab-ci/) - be careful if doing something similar.


## The variables

The setup relies on a YAML file for configuring what would be otherwise done via variables and a tfvars file. I've been convinced of the benefits of this approach by a [very nice blog post](https://xebia.com/blog/terraform-with-yaml-part-1/). To summarize, it allows greater flexibility on managing the inputs of your terraform workspace.

Our inputs are shown on the snippet below.

```yaml
# config.yaml
region: eu-central-1 # Frankfurt
cluster_name: eks-labs
vpc:
  # Private IP range (see https://en.wikipedia.org/wiki/Private_network)
  cidr: 10.0.0.0/16
  # We'll create one private and public subnet per availability zone
  azs: 
    - eu-central-1a
    - eu-central-1b
    - eu-central-1c
  # Each private subnet's IP range
  private_subnets: 
    - 10.0.1.0/24
    - 10.0.2.0/24
    - 10.0.3.0/24
  # Each public subnet's IP range
  public_subnets: 
    - 10.0.101.0/24
    - 10.0.102.0/24
    - 10.0.103.0/24
```

And we later refer to the values on this file through

```terraform
# variables.tf
locals {
  config = yamldecode(file("config.yaml"))
}
```

## The code

Below is the code for setting everything up, it creates the VPC and the EKS cluster. Most of the configs are default ones

```terraform
# terraform related setup
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.29"
    }
  }
}

provider "aws" {
  region = "eu-central-1"

  default_tags {
    tags = {
      Workspace = terraform.workspace
    }
  }
}

# Creates the VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = local.config.cluster_name
  cidr = local.config.vpc.cidr

  azs             = local.config.vpc.azs
  private_subnets = local.config.vpc.private_subnets
  public_subnets  = local.config.vpc.public_subnets

  enable_nat_gateway = true

  single_nat_gateway   = true
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/cluster/${local.config.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                             = 1
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${local.config.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"                    = 1
  }
}

# Creates the cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.20"

  cluster_name    = local.config.cluster_name
  cluster_version = "1.27"

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
  }

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  eks_managed_node_group_defaults = {
    ami_type = "AL2_x86_64"
  }

  eks_managed_node_groups = {
    main = {
      min_size     = 1
      max_size     = 3
      desired_size = 1

      instance_types = ["t3.small"]

      capacity_type = "SPOT"
    }
  }
}

# Reads variables from yaml file
locals {
  config = yamldecode(file("config.yaml"))
}
```

## Accessing the cluster

```shell-session
$ aws eks update-kubeconfig --name eks-labs --alias eks-labs
```