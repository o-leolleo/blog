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
      Owner       = "John Doe"
    }
  }
}

resource "aws_s3_bucket" "defaults_only" {
  bucket = "leolleo-dev-default-tags-only-bucket"
}

resource "aws_s3_bucket" "defaults_and_overrides" {
  bucket = "leolleo-dev-default-tags-and-overrides-bucket"

  tags = {
    Owner   = "Jane Doe"
    Purpose = "Temporary storage"
  }
}
