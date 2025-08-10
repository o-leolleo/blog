---
title: "Dica TF: Você pode usar JSON para declarar objetos no Terraform"
date: 2025-02-10T19:16:21+01:00
draft: false
language: pt
showTableOfContents: false
tags:
  - terraform
  - json
  - short
---

Não é segredo que o [terraform é compatível com o JSON](https://developer.hashicorp.com/terraform/language/syntax/json). Ou ainda melhor, que o [HCL é compatível com o JSON](https://github.com/hashicorp/hcl/blob/main/json/spec.md), possuindo a sua própria sintaxe JSON. Essas documentações são principalmente focadas, como seus nomes sugerem, na sintaxe HCL e em como se pode declarar nela recursos, variáveis, etc.

Isso traz uma consequência interessante, no entanto. _Você pode usar JSON para declarar objetos no Terraform_.

O exemplo abaixo foi retirado da documentação do [_resource_ `aws_iam_role`](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) e atualizado para usar a sintaxe JSON. É um código Terraform perfeitamente válido.

```terraform
resource "aws_iam_role" "test_role" {
  name = "test_role"

  # A função "jsonencode" converte
  # o resultado da expressão Terraform para uma string JSON válida.
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

É um truque particularmente útil quando você está integrando a configuração de _resources_ que aceitam JSON como entrada, como o atributo `assume_role_policy` do _resource_ `aws_iam_role`, e evita a necessidade de converter a sintaxe JSON para HCL, declarar o objeto JSON em um arquivo separado ou usar recursos alternativos, como o [_data source_ `aws_iam_role_policy_document`](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document). Também é mais fácil de ler do que usar [strings Heredoc](http://developer.hashicorp.com/terraform/language/expressions/strings#heredoc-strings) ou uma string JSON _inline_ (onde você precisaria escapar as aspas).

Como bônus, você pode misturar a sintaxe JSON com expressões Terraform - HCL e JSON são intercambiáveis nesse caso. Por exemplo, poderíamos usar o abaixo para declarar a política de um determinado repositório ECR, permitindo a extração de imagens de uma lista de contas. Isso está mais próximo dos exemplos de políticas IAM que você pode encontrar na documentação da AWS.


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
}
```

Isso é tudo, e é algo que venho usando há bastante tempo e que não encontrei muitas discussões sobre. Espero que você ache essa dica útil e que ela possa te economizar algum tempo. Boa codificação!
