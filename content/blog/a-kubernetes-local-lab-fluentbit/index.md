---
title: "A Kubernetes local lab: Fluentbit"
date: 2024-05-20T20:29:32+02:00
draft: false
language: en
---

I've been struggling to wrap my head around fluentbit configs, and as with EKS I needed a way to quickly experiment and confirm my assumptions. A bonus if it was also reproducible.

I'm mostly using it to collect kubernetes logs, so my local lab is in a sense a kubernetes one. I'm also experienced in Terraform, so it would make sense to use it to spin up the lab. This brings us to our [Pre requisites](#pre-requisites).

## Pre requisites

1. A kubernetes local cluster
2. Terraform
3. kubectl

Item 1 has many options, in my case I'm using the local cluster provided by [Docker Desktop](https://docs.docker.com/desktop). Other options include [minikube](https://minikube.sigs.k8s.io/docs/), [kind](https://kind.sigs.k8s.io/), [k3s](https://k3s-io.github.io/), etc.

You can install Item 2 from the [official website](https://www.terraform.io/downloads.html). The same goes for [Item 3](https://kubernetes.io/docs/tasks/tools/).

With the above in place, we can proceed to the next section.

## Running the lab

Before digging into the code, let's take a look at how it looks. To bootstrap it, clone the https://github.com/o-leolleo/a-kubernetes-local-lab repository and navigate to the `fluentbit` directory.

Then run the following commands (ensure the cluster is running):

```bash
# Ensure you are pointing to the correct cluster
# (docker-desktop in my case)
kubectl config current-context

# Initialize terraform
terraform init

# Plan and apply the changes upon confirmation
terraform apply
```

The apply should show an output similar to the following:

[![Terraform plan output](terraform-plan.png)](terraform-plan.png)

and the below after confirmation:

[![Terraform apply output](terraform-apply.png)](terraform-apply.png)

With the above in place you can navigate to the Kibana installation at [http://localhost:5601](http://localhost:5601). Click on the sandwich menu on the left corner and navigate to **Discover**. Click on **Create data view** and inform **Name** and **index-pattern** as `kube-*`. Click on **Save data view to Kibana** and you should see something similar to the below:

[![Kibana logs](kibana-logs.png)](kibana-logs.png)

These are all the logs collected by fluentbit from the kubernetes cluster, feel free to give it a try and experiment with a bit! Elasticsearch and Kibana are not the main topic of this post, we'll use them for visualizing the fluentbit delivered logs only, without further discussion.

We can also debug fluentbit by tailing its logs via (they're now also available in Kibana!):

```bash
kubectl logs -n logging -l app=fluent-bit -f
```

## The code


We'll discuss the code in parts, starting with the `main.tf` file. The full code is available at the [repository](https://github.com/o-leolleo/a-kubernetes-local-lab) mentioned on the last section.

### main.tf

We start by defining our required providers and instantiating them.

```terraform
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30" #1
    }
  }
}

provider "helm" {
  kubernetes {
    config_path    = "~/.kube/config" #2
    config_context = "docker-desktop" #3
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "docker-desktop"
}
```

1. Required version for the kubernetes provider (`version >= 2.30 and version < 3`), see more at [Version Constraints](https://developer.hashicorp.com/terraform/language/expressions/version-constraints)
2. Path to our kubeconfig file
3. Context to use (preferably a local one)

We then proceed to declare the fluentbit helm installation via the Terraform [`helm_release`](https://registry.terraform.io/providers/hashicorp/helm/latest/docs/resources/release) resource.

```terraform
resource "helm_release" "fluent_bit" {
  name             = "fluent-bit" #1
  repository       = "https://fluent.github.io/helm-charts"
  chart            = "fluent-bit"
  namespace        = "logging"
  create_namespace = true

  values = [
    file("./values-files/fluent-bit.values.yaml") #2
  ]
}
```

1. Name of the helm release as it appears in the cluster
2. values file to be used for the helm release - we'll soon discuss it

The above is the same as running the below.

```bash
helm repo add fluent https://fluent.github.io/helm-charts

helm install \
  fluent-bit \
  fluent/fluent-bit \
  --namespace logging \
  --values ./values-files/fluent-bit.values.yaml
  --create-namespace
```

here `fluent-bit` is the name of the helm release and `fluent/fluent-bit` is the chart to be installed, the rest is as per the Terraform resource.

<!-- TODO: Why `fluent/fluent-bit` but on terraform we specify `fluent-bit` only? -->

The rest of `main.tf` is dedicated to create minimalist deployments for Elasticsearch and Kibana.

```terraform
resource "kubernetes_manifest" "all" {
  for_each = local.manifests

  manifest = each.value

  depends_on = [
    helm_release.fluent_bit
  ]
}

locals {
  manifests = {
    for m in local._manifests :
    "${m.apiVersion}/${m.kind}/${m.metadata.name}" => m
  }

  _manifests = flatten([
    for file in fileset("./manifests", "**.yaml") :
    provider::kubernetes::manifest_decode_multi(file("./manifests/${file}"))
  ])
}
```
