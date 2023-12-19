---
title: "Getting Started With EKS"
date: 2023-12-19T22:51:09+01:00
draft: true
language: en
---

I’ve decided to experiment with different EKS scenarios and configurations. It turns out terraform and the aws eks module made for it are really useful for this purpose. Here I discuss how this can be done and steps to do after it. Also as I didn’t want to spend much when only performing tests, so here I relied on my aws-nuke setup and on terraform destroy to cleanup anything I’ve created.

## The variables

```yaml
region: eu-central-1
cluster_name: eks-labs
vpc:
  cidr: "10.0.0.0/16"
  azs: ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
  private_subnets: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets: ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
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