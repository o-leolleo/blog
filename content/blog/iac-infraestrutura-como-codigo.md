---
title: "IaC — Infraestrutura como código"
date: 2020-05-21
draft: true
language: pt
---

Recentemente tenho lido o livro Infrastructure as code — managing servers in the cloud, do Kief Morris. Tem sido ótimo para entender o panorama geral do que se entende por boas práticas para administração de servidores na nuvem e o que levar em consideração na tomada de decisão na busca por uma abordagem mais moderna para infra.

A maior parte do conteúdo que consegui explorar, antes dessa leitura, focava mais na utilização das ferramentas e em tarefas específicas… Como estou começando e construindo uma idéia da área como um todo, e também como venho da área de desenvolvimento, minha curiosidade tem sido no sentido de como essas ferramentas se integram em um fluxo de desenvolvimento que resulta em entregas de produtos e artefatos de infraestrutura, em paralelo com os processos que temos para planejar, administrar e entregar software nessa infraestrutura.

Com a intenção de compartilhar o que venho aprendendo, espalhar a palavra, aprender mais e fomentar a discussão, esse post deriva dos primeiros capítulos do livro, e discutirei o contexto no qual se insere a IaC, o que é e quais problemas resolve e o que os times e organizações esperam alcançar com a sua utilização.

## Servidores, passado, presente e o nascimento da IaC

A virtualização e a cloud (particularmente as plataformas de IaaS — Infrastructure as a Service) forçaram a necessidade por algum tipo de automação.

No inicio (e ainda hoje, em alguns casos), provisionar servidores, realizar o deploy de aplicações e manter recursos de infraestrutura envolvia servidores físicos e muito trabalho manual, além disso o processo se encontrava especialmente limitado pelo ciclo de compra de novos hardwares. Como levaria em torno de semanas para as novas máquinas chegarem, não havia muita pressão em instalar e configurar sistemas operacionais e softwares rapidamente.

Com o advento e uso mais disseminado da virtualização e das plataformas de IaaS, o trabalho se tornou menos árduo. Porém, a habilidade de criar novas máquinas virtuais (VMs) em minutos requeria que as pessoas operando o sistema se tornassem melhores na automação desse processo. Com a maior facilidade de criar novas máquinas veio a necessidade de administrar uma quantidade maior de servidores de um modo consistente.

Ferramentas como CFengine, Puppet e Chef estabeleceram uma nova categoria de ferramenta de automação de infraestrutura que foi rapidamente adotada por organizações ágeis que estavam tirando vantagem das plataformas de IaaS, na medida em que emergiam. Essas organizações, cuja TI foi construída em torno dos mindsets ágil e enxuto, evoluiram as práticas IaC para administrar sua infraestrutura automatizada.

A essência da infraestrutura como código é tratar os sistemas e suas configurações da mesma forma que o código fonte do software é tratado. Dessa forma utilizando-se de técnicas como Test Driven Development (TDD), Integração contínua (CI), Entrega contínua (CD) e a utilização de sistemas de controle de versão (VCS) para garantir as mudanças feitas à infraestrutura são testadas, repetitíveis e transparentes.

## Por que IaC é necessária?

A cloud e as ferramentas de automação diminuem significativamente a barreira para a realização de mudanças à infraestrutura. Todavia, e infelizmente, administrar essas mudanças de uma maneira que melhore a consistência e confiabilidade não vem pré-pronto com o software. Isso requer que as pessoas pensem em como elas vão utilizar essas ferramentas e colocar para funcionar sistemas, processos e hábitos para utilizá-las efetivamente.

A automação de infraestrutura torna possível realizar ações repetitivamente em um grande número de nós. A IaC utiliza técnicas, práticas e ferramentas de desenvolvimento de software para garantir que essas ações sejam cuidadosamente testadas antes de serem aplicadas a sistemas críticos.

## Os objetivos da IaC

O livro enumera os tipos de resultados que muitos times e organizações pretendem alcançar com a infraestrutura como código, são eles:

- A infraestrutura de TI suporta e possibilita a mudança, ao invés de ser um obstáculo ou restrição.
- Mudanças ao sistema são rotina, sem drama ou estresse para usuários ou equipes de TI.
- As equipes de TI utilizam seu tempo em coisas valiosas que utilizam o melhor de suas habilidades, ao invés de tarefas de rotina ou repetitivas.
- Os usuários podem definir, provisionar e administrar os recursos de que precisam, sem precisar que a equipe de TI faça isso por eles.
- Os times são capazes de rápida e facilmente recuperarem-se de falhas, ao invés de assumir que elas podem ser prevenidas completamente
- Melhoras são feitas continuamente, ao invés de serem feitas através de projetos caros, grandes e arriscados.
- Soluções para problemas são provadas através de implementação, teste e medição ao invés de discussões em reuniões e documentos.

## Concluindo

Podemos automatizar nossa infraestrutura e tratá-la como software. Colhemos os melhores benefícios disso quando aplicamos diversas das boas práticas bem conhecidas no mundo do desenvolvimento de software a nosso favor.

Este é link do livro que citei no início. Por ser em inglês, sua leitura não é muito acessível, pretendo trazer mais conteúdo traduzido pra cá e sobre o mesmo tema a medida em que for colhendo feedback e recuperando o hábito de escrever.

Até mais!
