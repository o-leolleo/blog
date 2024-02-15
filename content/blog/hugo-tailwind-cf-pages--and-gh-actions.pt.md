---
title: "Hugo, Tailwind, Cloudflare Pages e GitHub Actions"
slug: hugo-tailwind-cloudflare-pages-e-gitHub-actions
date: 2023-03-14T19:14:47Z
language: pt
translatedBy: amanda-sato
---


Neste post, discuto a tech stack deste blog e as decisões por trás dela. É meu primeiro conteúdo em um bom tempo, espero que você o ache útil.

<!--more-->

A vida e a carreira mudaram bastante desde a minha última [presença](https://medium.com/sysvale/iac-infraestrutura-como-c%C3%B3digo-c514a869b88d) na web três anos atrás. Fiz a transição completa para o mundo DevOps e comecei a trabalhar com CI/CD, IaC, automação e toneladas de YAML diariamente. No entanto, o mundo da tecnologia está em constante movimento, e senti a necessidade de uma forma de continuar aprendendo e me mantendo atualizado. Por isso, este blog foi criado, sendo também uma das razões para escolher cada uma das tecnologias discutidas nas seções seguintes.

## Hugo

Além de sua popularidade e velocidade, o Hugo utiliza Go e seus modelos de templates. Tenho experiência prática com o Helm, que também utiliza essa mesma stack. Portanto, escolher o Hugo me permitiria intercambiar habilidades entre essas ferramentas. Ao utilizá-lo, eu aprimoraria minhas habilidades no Helm e vice-versa.

Algumas pessoas poderiam listar os modelos de Go como a razão para não escolher o Hugo, curiosamente, foi isso que me atraiu para ele. No entanto, tenho que concordar que, à primeira vista, não é tão intuitivo quanto outros motores de templates, como [jinja2](https://jinja.palletsprojects.com/en/3.1.x/templates/). Para ter um vislumbre de como é, o trecho abaixo mostra o código Hugo para a [página](/blog) deste post no blog.

```html
{{ define "main" }}
{{ $shouldCenter := cond (gt (len .Pages) 0) "text-center" "" }}
<article class="{{ $shouldCenter }} prose  dark:prose-invert mx-auto">
  {{ .Content }}
</article>

{{ if len .Pages }}
<article class="prose dark:prose-invert mx-auto mt-10 mb-6">
  <h2 class="text-center">All articles</h2>

  <ul class="pl-0 list-outside">
    {{ range .Pages.ByLastmod.Reverse }}
    <li class="pl-0 flex flex-col">
      <h2>{{ .Title }}</h2>
      <p class="text-sm">
        :: {{ .Date.Format .Site.Params.DateFormat }}
        :: {{ partial "minread.html" . }}
      </p>
      <p>{{ .Summary }}</p>
      <div class="not-prose">
        <a class="anchor" href="{{ .Permalink }}">
          Read more &#x21C0;
        </a>
      </div>
    </li>
    {{ end }}
  </ul>
</article>
{{ end }}
{{ end }}
```

## Tailwind

O Tailwind é um framework muito popular, e sua abordagem baseada em utilitários afirma exigir praticamente nenhuma escrita de CSS personalizado. Isso parecia muito persuasivo, já que a popularidade facilitaria encontrar recursos online, e sua abordagem se alinharia ao meu conhecimento prévio -- Não tenho muita experiência em frontend, então escrever CSS personalizado levaria mais tempo do que eu gostaria.

As alegações mostraram-se verdadeiras, e você pode verificar abaixo um trecho mostrando todo o CSS personalizado usado neste blog.

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* Isso apenas fornece um alias para um conjunto de classes 
     do Tailwind comumente usadas juntas. */
  .anchor {
    @apply
      font-medium
      text-indigo-700
      dark:text-indigo-400
      hover:underline;
  }
}

/* CSS personalizado começa aqui :D */
.terminal-cursor {
  animation: cursor .8s infinite;
}

@keyframes cursor {
  from {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}
```

## Cloudflare Pages

Eu precisava de uma maneira fácil de obter o máximo da hospedagem estática integrada. Algumas opções estavam disponíveis, como [GitHub pages](https://pages.github.com/), [Netlify](https://www.netlify.com/) e outros. Como eu hospedo a configuração do meu domínio no Cloudflare, a solução deles pareceu interessante, pois as coisas poderiam ser mantidas em um único lugar. Ter um [cli](https://developers.cloudflare.com/workers/wrangler/) para automatizar o fluxo de trabalho por conta própria, também parecia uma boa ideia, pois, dessa forma, eu poderia adicionar quaisquer passos personalizados que desejasse, por exemplo:

- [limpar o cache DNS após implantações.](https://github.com/o-leolleo/blog/blob/main/.github/workflows/cicd.yml#L85)
- [ter suporte para ambientes de recursos com limpeza automática em pull requests.](https://github.com/o-leolleo/blog/blob/main/.github/workflows/clean-up.yml)
- quaisquer verificações automatizadas futuras.

O Wrangler (a CLI) também possui uma biblioteca oficial [GitHub action](https://github.com/marketplace/actions/deploy-to-cloudflare-workers-with-wrangler) com boa documentação e que eu uso para implantar este blog.

## GitHub Actions

Esta é a ferramenta CI/CD integrada ao GitHub. Além de ser uma solução nativa, é uma ferramenta muito fácil de usar com uma comunidade extensa ao seu redor. Você pode encontrar uma ação para praticamente tudo e também criar a sua própria quando as existentes não se encaixam. 
Tem uma documentação muito boa e uma estrutura muito clara. Não precisei pensar muito e fui direto usá-la.

## Conclusão

Finalmente, reuni as ferramentas e consegui arranjar tempo para escrever este primeiro post em muito tempo. As ferramentas escolhidas tornaram todo o processo tranquilo, especialmente devido ao conteúdo e à comunidade ao seu redor. Com o tempo, posso preencher este espaço na web com mais e mais conteúdo 😄. Espero que tenha gostado deste primeiro!
