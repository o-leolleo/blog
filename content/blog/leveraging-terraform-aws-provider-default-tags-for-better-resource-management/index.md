---
title: "Leveraging Terraform AWS Provider Default Tags for Better Resource Management"
date: 2024-04-06T16:38:23+02:00
draft: false
language: en
---

Tagging resources in AWS is a best practice to manage and organize your resources. Its official docs are extensive on how [one can achieve a good tagging strategy](https://docs.aws.amazon.com/whitepapers/latest/tagging-best-practices/tagging-best-practices.html). In a scenario where you're automating your infrastructure provisioning with Terraform, you can go a step further and easily manage your tags with the [AWS provider's default tags feature](https://www.hashicorp.com/blog/default-tags-in-the-terraform-aws-provider). This helps you achieve a consistent tagging strategy across your resources, improving your resource management and visibility.

## The default_tags block

The snippet below illustrates the concept. The tags `Environment = "Dev"` and `Owner = "John Doe"` are be automatically applied to all resources created by the AWS provider for your current Terraform workspace, whilst you're still able to add specific tags per resource via their `tags` property.

```terraform
provider "aws" {
  default_tags {
    tags = {
      Environment = "Dev"
      Owner      = "John Doe"
    }
  }
}
```
