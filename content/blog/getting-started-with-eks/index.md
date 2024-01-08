---
title: "Getting Started With EKS"
date: 2023-12-19T22:51:09+01:00
draft: true
language: en
---

I’ve decided to experiment with different EKS scenarios and configurations. But also thought that giving an introductory blog post on how to bootrstrap your own EKS cluster might help someone out there trying to do the same thing.

For that I'm using [Terraform](https://www.terraform.io/) and the [AWS EKS Terraform module](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest). The first is a very well known solution for maintaining infrastructure as code (IaC). The later is the best community maintained module - that I know of - for it and which covers most (if not all) the different EKS use cases.

The resources created here costs money, so if you're following it up, **I highly recommend that you destroy your terraform resources once finished, so you're not caught out of surprise with a considerable AWS bill**. I've even gone as far as [detroying my personal AWS account resources on a schedule](/blog/wiping-your-aws-account-with-aws-nuke-and-gitlab-ci/) - be careful if doing something similar.


## The variables

The setup relies on a YAML file for configuring what would be otherwise done via variables and/or a tfvars file. I've been convinced of the benefits of this approach by the post [Terraform with YAML: Part 1](https://xebia.com/blog/terraform-with-yaml-part-1/) from Chris ter Beke. It's simple, effective, and use terraform built-in constructs. It allows greater flexibility on managing the inputs of your terraform workspace.

In our case, these inputs are shown on the snippet below, where we define the AWS region where we want to create our cluster and its reosurces, the cluster name, availability zones and VPC related parameters.

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

We can later read those config values through the code below, and access them like `local.config.region` or `local.config.vpc.cidr` on our terraform code. 

```terraform
# variables.tf
locals {
  config = yamldecode(file("config.yaml"))
}
```

## The code

With our configs in place we can start the code to create the cluster itself. 

First, we declare our required providers and the `provider` block, shown on the snippet below. We're using the official AWS provider with a version between `>=5.29` and `<6` (See [Version Constraint Syntax](https://developer.hashicorp.com/terraform/language/expressions/version-constraints#version-constraint-syntax)). The resources are created on the `local.config.region` region as discussed on the [previous section](#the-variables). On top of that, all resources we create are tagged accordingly to the workspace we use on our runs, for easier identification and cross reference.

```terraform
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.29"
    }
  }
}

provider "aws" {
  region = local.config.region

  default_tags {
    tags = {
      Workspace = terraform.workspace
    }
  }
}
```

We then define the [VPC (Virtual Private Network)](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html) onto which our resources will be created. Here we use the well known [terraform-aws-vpc](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest) community module. 

```terraform
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
  enable_dns_support   = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }
}
```

The network is named after our cluster, its CIDR and most of its settings are passed from the `config.yaml` file, [discussed earlier](#the-variables).
We allow [DNS hostnames and support](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-dns.html#vpc-dns-support) on the VPC and [reuse the same NAT gateway on all its subnets](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest#single-nat-gateway). The first has little impact to what we discuss on this post, the later helps us reduce the cost of the overall setup.

The `kubernetes.io/role/elb` and `kubernetes.io/role/internal-elb` tags allows these subnets to be auto discovered by the [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.1/deploy/subnet_discovery/), which we'll discuss in a later post.

With the VPC in place we proceed declare the cluster and its supporting resources, shown on the code below.

```terraform
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
```

The cluster name is defined as specifyed on the `config.yaml` file, and the k8s version as 1.27. We also install some EKS available addons. Explaning each of them is out of the scope of this post, it's enough to say for our purposes that we need them for our cluster to correctly function - you can read more about them on [Amazon EKS add-ons](https://docs.aws.amazon.com/eks/latest/userguide/eks-add-ons.html)
.

We then pass the VPC ID of the VPC we created earlier, and its private subnets IDs. This can't be changed after cluster creation. Also, since I want to access the cluster API from the internet, I set `cluster_endpoint_public_access` to `true`. I use a security group to restrict its access so it's not exposed to the great public, just me - or more precisely my home network.

Then comes the worker nodes themselves. Here we'll only use EKS managed node groups for simplicity. We rely on AWS Linux `t3.small` SPOT instances, with a minimum of one and a maximum of three nodes. This will give us room to tests things out without spending too much money.

With all this in place, we're ready to create our cluster.

## Terraform plan and apply

My terraform plan output is (partially) shown below. The warning is a [known issue within the module](https://github.com/terraform-aws-modules/terraform-aws-eks/issues/2635), due to some updates introduced by the AWS provider in its version v5.0.1

[![Terraform plan output](terraform-plan.png)](terraform-plan.png)

After reviewing it and making sure everything is as expected, we can apply it (partial output below). Creating all the resources takes around 15min. Once finished you can jump to the [next section](#accessing-the-cluster).

[![Terraform apply output](terraform-apply.png)](terraform-apply.png)


## Accessing the cluster

We can use the same credentials we used to authenticate terraform for creating the cluster to authenticate ourselves to the cluster. We do this by running the command below.
you might need to specify the region either via `--region` or the `AWS_DEFAULT_REGION` environment variable.

```shell-session
$ aws eks update-kubeconfig --name eks-labs --alias eks-labs
```

This command will update our `~/.kube/config` file with the cluster information, and create a new context named `eks-labs` (the alias we gave to our cluster). We can then use this context to interact with the cluster.
We can now test our access to the cluster by running kubectl commands like `kubectl get nodes` or `kubectl get pods -A`. Their outputs should look something like the output below.

```shell-session
$ kubectl get nodes
NAME                                           STATUS   ROLES    AGE   VERSION
ip-10-0-1-100.eu-central-1.compute.internal    Ready    <none>   10m   v1.21.2-eks-55daa9d
ip-10-0-2-100.eu-central-1.compute.internal    Ready    <none>   10m   v1.21.2-eks-55daa9d
$ kubectl get pods -A
NAMESPACE     NAME                       READY   STATUS    RESTARTS   AGE
kube-system   aws-node-2q8qk             1/1     Running   0          10m
kube-system   aws-node-4q2q4             1/1     Running   0          10m
...
```

## Cleaning up

Once finished with our experiments, and to avoid a surprise billing from AWS, we can destroy our cluster and the associated resources by running `terraform destroy`. 

[![Terraform destroy output](terraform-destroy.png)](terraform-destroy.png)
