terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"

  default_tags {
    tags = {
      Environment = "Dev"
      Owner       = "Fulano"
    }
  }
}

resource "aws_s3_bucket" "somente_tags_padrao" {
  bucket = "leolleo-dev-bucket-com-somente-tags-padrao"
}

resource "aws_s3_bucket" "tags_padrao_e_sobrescritas" {
  bucket = "leolleo-dev-default-tags-padrao-e-sobrescritas"

  tags = {
    Owner   = "Sicrano"
    Purpose = "Armazenamento temporário"
  }
}
