terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

provider "helm" {
  kubernetes {
    config_path    = "~/.kube/config"
    config_context = "docker-desktop"
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "docker-desktop"
}

resource "helm_release" "fluent_bit" {
  name             = "fluent-bit"
  repository       = "https://fluent.github.io/helm-charts"
  chart            = "fluent-bit"
  namespace        = "logging"
  create_namespace = true

  values = [
    file("./values-files/fluent-bit.values.yaml")
  ]
}

resource "kubernetes_manifest" "all" {
  for_each = local.manifests

  manifest = each.value
}

locals {
  manifests = {
    for m in local._manifests :
    "${m.apiVersion}/${m.kind}/${m.metadata.name}/${substr(sha256(provider::kubernetes::manifest_encode(m)), 0, 6)}" => m
  }

  _manifests = flatten([
    for file in fileset("./manifests", "**.yaml") :
    provider::kubernetes::manifest_decode_multi(file("./manifests/${file}"))
  ])
}

