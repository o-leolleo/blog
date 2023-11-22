---
title: "Wiping your AWS account with AWS Nuke and Gitlab CI"
date: 2023-07-10T21:54:55+01:00
draft: false
language: en
---

Wiping, cleaning up your AWS account, sounds a very dangerous, destructive action, and it indeed is. Specially when one tell you this can be performed automatically and on a schedule. Problems arise even if you don't touch your infrastructure, so why would one destroy it from time to time and on purpose?

<!--more-->

## Why?

Well, there are some valid use cases for such tooling. **Hopefully none of these on live, production, user facing environments**. For example:
- You have a personal or development cloud account, and you don't want to get an expensive cloud bill from AWS when you just want to test things out.
- You run tests for IaC which requires you to create resources and destroy them, often times leaving dangling resources behind.
- You have a team where each member has its own AWS account, on which they can do --- virtually --- anything, but like on the first use case, you don't want an expensive bill when people are just developing and testing things out!

In such scenarios those accounts only host resources which are not intended to be used by the public. Whether this public is application users, developers or anyone besides the person who created those resources and potentially her/his peers to whom she/he is showcasing things to. Also, these very resources are better off being temporary, as they have a very short life-span: you create resources, confirm they work as you expect, then destroy them --- which you often/sometimes forget.

These use-cases are addressed by [aws-nuke](https://github.com/rebuy-de/aws-nuke). It destroys all your AWS resources on the specified accounts 💣. _I discovered it when looking for something similar after forgetting a EKS cluster running for a week on my personal AWS account_ 😅, this didn't cost me more than $50.00 as far as I remember, but it's useful to save money when possible and to avoid unnecessary costs, specially when next time I might not be so lucky.

AWS Nuke can be run on a number of ways. For having a better control and manageability of it I prefer to run it on a CI pipeline. The following sections dig a bit deeper on this approach, where I show how I implemented it using GitLab CI for daily destroying all of my personal AWS account resources - but keeping some necessary ones.

## Configuring aws-nuke

First thing is to get used to how the tool works. The following snippet shows how I configured it with the `nuke-config.yml` file --- Account ID and username omitted.

```yaml
# nuke-config.yml
regions:
- eu-north-1
- ap-south-1
- eu-west-3
- eu-west-2
- eu-west-1
- ap-northeast-3
- ap-northeast-2
- ap-northeast-1
- sa-east-1
- ca-central-1
- ap-southeast-1
- ap-southeast-2
- eu-central-1
- us-east-1
- us-east-2
- us-west-1
- us-west-2
- global

resource-types:
  excludes:
  - EC2DefaultSecurityGroupRule

accounts:
  "<my-account-id>":
    filters:
      IAMUser:
      - "<my-user-name>"
      IAMUserPolicyAttachment:
      - "<my-user-name> -> AdministratorAccess"
      IAMVirtualMFADevice:
      - "arn:aws:iam::<my-account-id>:mfa/<my-user-name>"
      IAMUserGroupAttachment:
      - "<my-user-name> -> Admin"
      IAMLoginProfile:
      - "<my-user-name>"
      IAMGroup:
      - "Admin"
      IAMGroupPolicyAttachment:
      - "Admin -> AdministratorAccess"
      IAMUserAccessKey:
      - "<my-user-name> -> {{AWS_ACCESS_KEY_ID}}"
      EC2KeyPair:
      - "<key-pair-name-to-keep>"
      EC2Subnet:
      - property: DefaultVPC
        value: "true"
      EC2DHCPOption:
      - property: DefaultVPC
        value: "true"
      EC2InternetGateway:
      - property: DefaultVPC
        value: "true"
      EC2RouteTable:
      - property: DefaultVPC
        value: "true"
      EC2InternetGatewayAttachment:
      - property: DefaultVPC
        value: "true"
      EC2VPC:
      - property: IsDefault
        value: "true"
      CloudWatchDashboard:
      - "Main"

```

Digging a bit into it:
- First, I declare all the regions I want to wipe out. In my case these are all the AWS `regions` plus global --- for global resources like IAM users.
- Second, I exclude from the destroy all AWS default security groups with `resource-types.excludes`.
- Third, I define all resources I don't want to destroy on my account inside the `accounts` property. Basically these are the bare minimum I need in order to perform anything useful in it like logging in, keeping being an admin, my access keys, ec2 ssh keys, etc.

I replace `{{AWS_ACCESS_KEY_ID}}` by the access key used by the CI pipeline to perform the AWS actions --- otherwise I'd be able to run it only once 🤷.

## Running aws-nuke

With the `nuke-config.yml` file in place, we are able to run the commands shown on the snippet below. Whilst here I pass the access key ID and secret explicitly, there are other [options](https://github.com/rebuy-de/aws-nuke#aws-credentials).

```bash
# dry run
aws-nuke \
  --access-key-id "<my-access-key-id>" \
  --secret-access-key "<my-secret-access-key>" \
  --config nuke-config.yml

# perform the destroy actions, but first ask for confirmation
aws-nuke \
  --access-key-id "<my-access-key-id>" \
  --secret-access-key "<my-secret-access-key>" \
  --no-dry-run \
  --config \
  nuke-config.yml

# perform the destroy actions without first asking for confirmation
aws-nuke \
  --access-key-id "<my-access-key-id>" \
  --secret-access-key "<my-secret-access-key>" \
  --no-dry-run \
  --force \
  --config \
  nuke-config.yml
```

The final step is to wrap these things up and make them run on a schedule, in our case a [Gitlab CI schedule pipeline](https://docs.gitlab.com/ee/ci/pipelines/schedules.html).

## The scheduled pipeline

First we need a `gitlab-ci.yml` file. It's detailed below, with comments to explain what each block does.

```yaml
# Declares the pipeline stages
stages:
  - dry-run
  - nuke

# Declares the default image used on the pipeline jobs
# also overrides the image's entrypoint,
# so as not to conflict with GitLab default behavior
image:
  name: quay.io/rebuy/aws-nuke:v2.17.0
  entrypoint: [""]

# Here we define a job template which will run aws-nuke
# in either dry-run or real run depending on the NO_DRY_RUN envvar value.
# Pay attention to the replacement performed at the beginning, it replaces
# the {{AWS_ACCESS_KEY_ID}} by the value of the access key used by the pipeline
# to destroy the resources.
.nuke-run:
  script:
    - sed -i "s/{{AWS_ACCESS_KEY_ID}}/${AWS_ACCESS_KEY_ID}/g" nuke-config.yml
    - |
      aws-nuke \
        --force \
        --access-key-id "${AWS_ACCESS_KEY_ID}" \
        --secret-access-key "${AWS_SECRET_ACCESS_KEY}" \
        ${NO_DRY_RUN:+--no-dry-run} \
        --config nuke-config.yml

# The dry-run job
# it always runs - useful for ensuring MRs and commits are correct -
# and is always "interruptible" (see https://docs.gitlab.com/ee/ci/yaml/#interruptible)
dry-run:
  stage: dry-run
  extends: .nuke-run
  interruptible: true

# Runs the aws nuke command
# Only runs on schedules that run against the default branch
nuke:
  stage: nuke
  extends: .nuke-run
  variables:
    NO_DRY_RUN: "yes"
  rules:
    - if: >
        $CI_PIPELINE_SOURCE == 'schedule'
        && $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

With the pipeline in place the last bit needed is to add the schedule itself. This can be done from the GitLab Project's UI on Build -> Pipeline schedules -> New schedule. The schedule accepts crontab notation, which you can validate on https://crontab.guru/. Once finished you should end up with something like on the image below.

[![AWS Nuke schedule pipeline](/images/aws-nuke-gl-schedule.png)](/images/aws-nuke-gl-schedule.png)

Pressing the play button will trigger the pipeline just like the schedule will, so you can test everything is working properly.

## Conclusion

That's all, now your account will be wiped out as specified on the `nuke-config.yml` file and based on the schedule you configure. Again, keep in mind that **this is a very dangerous solution, so I can't emphasize enough how much careful you should be when setting it up, pay extra attention and care to confirm you know what you're doing**. The result is that now you have an account where you can do pretty much any labs and tests without the fear of a big AWS bill.

💡 This said, be aware that there might be resources not deleted by aws-nuke as shown on their [issues](https://github.com/rebuy-de/aws-nuke/issues).

Hope you enjoyed the reading 😁.
