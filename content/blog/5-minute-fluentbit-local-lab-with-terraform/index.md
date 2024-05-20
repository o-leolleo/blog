---
title: "5 Minute Fluentbit Local Lab With Terraform"
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

Item 1 has many options, in my case I'm using the local cluster provided by Docker Desktop. Other options include minikube, kind, k3s, etc.

You can install Item 2 from the [official website](https://www.terraform.io/downloads.html). The same goes for [Item 3](https://kubernetes.io/docs/tasks/tools/).

