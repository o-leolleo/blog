---
title: "Wiping your AWS account with AWS Nuke and Gitlab CI"
date: 2023-07-10T21:54:55+01:00
draft: false
language: en
---

Apagar, limpar sua conta AWS, parece uma ação muito perigosa e destrutiva, e de fato é. Especialmente quando alguém diz que isso pode ser feito automaticamente e em um cronograma. Problemas surgem mesmo se você não mexer na sua infraestrutura, então por que destruí-la de tempos em tempos e de propósito?

<!--more-->

## Por que?

Bem, existem alguns casos de uso válidos para esse tipo de ferramenta. **Esperançosamente, nenhum deles em ambientes ao vivo, de produção ou voltados para o usuário.**. Por exemplo:
- Você possui uma conta de nuvem pessoal ou de desenvolvimento, e não deseja receber uma fatura cara da AWS quando apenas deseja testar alguma coisa.
- Você executa testes para Infraestrutura como Código (IaC), o que exige que você crie recursos e os destrua, muitas vezes deixando recursos pendentes para trás.
- Você tem uma equipe em que cada membro possui sua própria conta AWS, na qual eles podem fazer -- virtualmente -- qualquer coisa. No entanto, assim como no primeiro caso de uso, você não deseja uma fatura cara quando as pessoas estão apenas desenvolvendo e testando coisas!


Em tais cenários, essas contas hospedam apenas recursos que não têm a intenção de serem utilizados pelo público. Seja esse público composto por usuários de aplicativos, desenvolvedores ou qualquer pessoa além da pessoa que criou esses recursos e potencialmente seus colegas aos quais ela está apresentando as funcionalidades. Além disso, esses recursos são mais adequados para serem temporários, pois têm uma vida útil muito curta: você cria os recursos, confirma se eles funcionam conforme o esperado e, em seguida, os destrói -- os quais você frequentemente/às vezes esquece. 

Esses casos de uso são abordados pelo [aws-nuke](https://github.com/rebuy-de/aws-nuke). Ele destrói todos os seus recursos AWS nas contas especificadas 💣. _Descobri isso ao procurar por algo semelhante depois de esquecer um cluster EKS rodando por uma semana na minha conta pessoal da AWS_ 😅. Isso não me custou mais do que $50.00, pelo que me lembro, mas é útil economizar dinheiro sempre que possível e evitar custos desnecessários, especialmente porque da próxima vez eu posso não ter tanta sorte.

O AWS Nuke pode ser executado de várias maneiras. Para ter um melhor controle e gerenciabilidade, eu prefiro executá-lo em um pipeline de integração contínua (CI). As próximas seções exploram um pouco mais essa abordagem, onde mostro como implementei isso usando o GitLab CI para destruir diariamente todos os recursos da minha conta pessoal da AWS - mantendo apenas os necessários.

## Configurando aws-nuke

A primeira coisa é se familiarizar com o funcionamento da ferramenta. O trecho a seguir mostra como eu o configurei com o arquivo `nuke-config.yml` --- ID da conta e nome de usuário omitidos.

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

Aprofundando um pouco:
- Primeiro, eu declaro todas as regiões que desejo limpar. No meu caso, essas são todas as `regions` da AWS, incluindo a global --- Para recursos globais, como usuários IAM.
- Segundo, eu excluo da destruição todos os grupos de segurança padrão da AWS com `resource-types.excludes`.
- Terceiro, eu defino todos os recursos que não quero destruir na minha conta dentro da propriedade `accounts`. Basicamente, esses são os elementos essenciais necessários para realizar qualquer coisa útil nela, como fazer login, manter as configurações de administrador, minhas chaves de acesso, chaves SSH do EC2, etc.

Eu substituo `{{AWS_ACCESS_KEY_ID}}` pela chave de acesso usada pela pipeline de CI para realizar as ações na AWS --- caso contrário, eu só poderia executá-lo uma vez 🤷.

## Executando aws-nuke

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
