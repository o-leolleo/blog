---
title: "Tf Tip: You Can Use Json to Declare Terraform Objects"
date: 2025-02-10T19:16:21+01:00
draft: false
language: en
showTableOfContents: false
tags:
  - terraform
  - json
  - short
---

It's not a secret that [terraform is JSON compatible](https://developer.hashicorp.com/terraform/language/syntax/json). Or better yet, [HCL is JSON compatible](https://github.com/hashicorp/hcl/blob/main/json/spec.md), having it's own JSON syntax. These documentations are mainly focused, as their name suggests, on the HCL syntax and how can one declare resources, variables, etc. using it.

This has an interesting consequence, though. _You can use JSON to declare objects in Terraform_.

The example below has been taken from the [aws_iam_role resource](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) documentation, and updated to use JSON syntax. It's a perfectly valid Terraform code.

```terraform
resource "aws_iam_role" "test_role" {
  name = "test_role"

  # Terraform's "jsonencode" function converts a
  # Terraform expression result to valid JSON syntax.
  assume_role_policy = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "sts:AssumeRole",
        "Effect": "Allow",
        "Sid": "",
        "Principal": {
          "Service": "ec2.amazonaws.com"
        }
      },
    ]
  })

  tags = {
    tag-key = "tag-value"
  }
}
```

This trick is particularly useful when you're patching into terraform the configuration of resources that accepts JSON as input, like the `aws_iam_role` resource `assume_role_policy` attribute, and it avoids the extra hop of either having to convert the JSON syntax to HCL, declaring the JSON object in a separate file or doing it using alternative resources, like the [`aws_iam_role_policy_document` data source](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document). It's also easier to read than using [Heredoc strings](http://developer.hashicorp.com/terraform/language/expressions/strings#heredoc-strings) or an inline json string (where you'd need to escape the quotes).

As a bonus, you can mix the JSON syntax with terraform expressions - HCL and JSON are interchangeable in this case. For example, we could use the below to declare the policy of a given ECR repository, allowing the pull of images from a list of accounts. It looks closer to the IAM policy examples you can find in the AWS documentation.


```terraform
resource "aws_ecr_repository" "test_repo" {
  name = "test_repo"

  repository_policy_text = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowPull",
        "Effect": "Allow",
        "Principal": {
            "AWS": [
                for account_id in var.account_ids :
                "arn:aws:iam::${account_id}:root"
            ]
        },
        "Action": [
            "ecr:BatchGetImage",
            "ecr:GetDownloadUrlForLayer"
        ]
      }
    ]
  })
```

That's all, this is something I've been using for quite a while now and that I didn't find much discussions about. I hope you can find this tip useful and that it can save you some time. Happy coding!
