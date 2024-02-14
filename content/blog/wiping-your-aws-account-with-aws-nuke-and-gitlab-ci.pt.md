---
title: "Limpando sua conta AWS com o AWS Nuke e o Gitlab CI"
slug: limpando-sua-conta-aws-com-aws-nuke-e-gitlab-ci
date: 2023-07-10T21:54:55+01:00
draft: false
language: pt
translatedBy: amanda-sato
---

Apagar, limpar sua conta AWS, parece uma ação muito perigosa e destrutiva, e de fato é. Especialmente quando alguém diz que isso pode ser feito automaticamente e em um cronograma. Problemas surgem mesmo se você não mexer na sua infraestrutura, então por que destruí-la de tempos em tempos e de propósito?

<!--more-->

## Por que?

Bem, existem alguns casos de uso válidos para esse tipo de ferramenta. **Esperançosamente, nenhum deles em ambientes ao vivo, de produção ou voltados para o usuário**. Por exemplo:
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

Com o arquivo `nuke-config.yml` configurado, podemos executar os comandos mostrados no trecho abaixo. Enquanto aqui eu passo explicitamente a chave de acesso (access key) e o segredo (secret), existem outras [opções](https://github.com/rebuy-de/aws-nuke#aws-credentials).

```bash
# dry run // teste passo a passo
aws-nuke \
  --access-key-id "<my-access-key-id>" \
  --secret-access-key "<my-secret-access-key>" \
  --config nuke-config.yml

# Execute as ações de destruição, mas peça confirmação primeiro.

aws-nuke \
  --access-key-id "<my-access-key-id>" \
  --secret-access-key "<my-secret-access-key>" \
  --no-dry-run \
  --config \
  nuke-config.yml

# Execute as ações de destruição sem pedir confirmação prévia.
aws-nuke \
  --access-key-id "<my-access-key-id>" \
  --secret-access-key "<my-secret-access-key>" \
  --no-dry-run \
  --force \
  --config \
  nuke-config.yml
```

O último passo é organizar essas tarefas e programá-las para serem executadas em um cronograma, no nosso caso, utilizando uma [pipeline agendada do GitLab CI](https://docs.gitlab.com/ee/ci/pipelines/schedules.html).

## A pipeline agendada

Primmeiro, nós precisamos de um arquivo `gitlab-ci.yml`. Está detalhada abaixo, com comentários para explicar o que cada bloco faz.

```yaml
# Declara as etapas da pipeline.
stages:
  - dry-run
  - nuke

# Declara a imagem padrão utilizada nos trabalhos da pipeline,
# também substitui o ponto de entrada (entrypoint) da imagem,
# para evitar conflitos com o comportamento padrão do GitLab.
image:
  name: quay.io/rebuy/aws-nuke:v2.17.0
  entrypoint: [""]

# Aqui definimos um modelo de trabalho que executará o aws-nuke
# em modo simulado (dry-run) ou execução real, dependendo do valor da variável de ambiente NO_DRY_RUN.
# Preste atenção na substituição realizada no início, ela substitui
# o {{AWS_ACCESS_KEY_ID}} pelo valor da chave de acesso usada pela pipeline
# para destruir os recursos.
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

# O trabalho de simulação (dry-run)
# sempre é executado - útil para garantir que MRs e commits estejam corretos -
# e é sempre "interruptível" (interruptible) (veja https://docs.gitlab.com/ee/ci/yaml/#interruptible).
dry-run:
  stage: dry-run
  extends: .nuke-run
  interruptible: true

#Executa o comando aws nuke
#Somente é executado em agendamentos que rodam na branch padrão.
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

Com a pipeline configurada, a última parte necessária é adicionar o próprio agendamento. Isso pode ser feito a partir da interface do usuário do projeto no GitLab, em Build -> Pipeline schedules -> New schedule. O agendamento aceita a notação cron, que você pode validar em https://crontab.guru/. Uma vez concluído, você deve obter algo semelhante à imagem abaixo.

[![AWS Nuke schedule pipeline](/images/aws-nuke-gl-schedule.png)](/images/aws-nuke-gl-schedule.png)

Pressionar o botão de play (play button) acionará a pipeline da mesma forma que o agendamento fará, então você pode testar se tudo está funcionando corretamente.

## Conclusão


Isso é tudo, agora sua conta será apagada conforme especificado no arquivo `nuke-config.yml` e com base no cronograma que você configurar. Novamente, tenha em mente que **Esta é uma solução muito perigosa, então não posso enfatizar o suficiente o quão cuidadoso você deve ser ao configurá-la. Preste atenção extra e cuide para confirmar que você sabe o que está fazendo**. O resultado é que agora você tem uma conta na qual pode realizar praticamente qualquer laboratório e teste, sem o medo de uma grande fatura da AWS.

💡 Dito isso, esteja ciente de que pode haver recursos não deletados pelo aws-nuke, conforme mostrado em suas documentações. [problemas](https://github.com/rebuy-de/aws-nuke/issues).

Espero que você tenha apreciado a leitura 😁.
