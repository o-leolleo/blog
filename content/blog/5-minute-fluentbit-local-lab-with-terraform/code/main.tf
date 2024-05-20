terraform {
  required_providers {
    kubernetes = {
      source = "hashicorp/kubernetes"
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
    file("./fluent-bit.values.yaml")
  ]
}

resource "kubernetes_manifest" "elasticsearch" {
  for_each = {
    for m in provider::kubernetes::manifest_decode_multi(file("elasticsearch.yaml")):
    "${m.apiVersion}/${m.kind}/${try(m.spec.type, ".")}/${m.metadata.name}" => m
  }

  manifest = each.value
}

