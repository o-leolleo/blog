---
title: "[DRAFT] Hugo, Tailwind, Cloudflare Pages and GitHub Actions"
date: 2023-03-14T19:14:47Z
language: en
---

On this post I discuss this blog tech stack and my decisions behind it. It's my very first content for a long while, hope you find it useful.

<!--more-->

Life and career have changed a lot since my last [footprint](https://medium.com/sysvale/iac-infraestrutura-como-c%C3%B3digo-c514a869b88d) on the web three years ago, I've now fully transitioned into the DevOps world and working with CI/CD, IaC, automation and tons of YAML on a daily basis. However tech world is constantly moving and I felt I needed a way to keep myself learning and up to date, that's why this blog has been created but also one of the reasons for choosing each of the technologies discussed in the following sections.

## Hugo

Besides its popularity and speed, Hugo uses Go and its templates. I have working experience with Helm which uses the same stack, thus choosing Hugo would enable me to interchange skills and by using it I would get better at Helm and vice-versa. Also, based on its popularity, finding community content around it would be easy.

Some would list Go templates as driving the decision not to use Hugo, interestingly enough this brought me to it. I have to agree though that at first glance it's not as intuitive as other template engines like [jinja2](https://jinja.palletsprojects.com/en/3.1.x/templates/). The snippet below shows the hugo code for this blog posts [page](/blog).

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

Tailwind is a very popular framework, and its utility based approach claims to hardly require one to write any custom CSS. This looked very compelling as the popularity would make it easy to find resources online and its approach would fit my knowledge background --- I'm not too experienced into frontend so writing custom CSS would take more time than I'd like to.

Claims proved to be true and you can check below a snippet showing all custom CSS used on this blog.

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* This just gives an alias to common
     Tailwind classes used altogether. */
  .anchor {
    @apply
      font-medium
      text-indigo-700
      dark:text-indigo-400
      hover:underline;
  }
}

/* Custom CSS starts here :D */
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

I needed an easy way of getting most out of static hosting built in. A few options were available like [GitHub pages](https://pages.github.com/), [Netlify](https://www.netlify.com/) and others. Since I host my domain configuration on cloudflare their solution sounded very compelling. Having a [cli](https://developers.cloudflare.com/workers/wrangler/) to automate the workflow on my own also looked interesting since this way I can add whatever custom steps I'd like to, for example:

- [purging the dns cache after deployments.](https://github.com/o-leolleo/blog/blob/main/.github/workflows/cicd.yml#L85)
- [having support for feature environments with auto clean-up on pull requests.](https://github.com/o-leolleo/blog/blob/main/.github/workflows/clean-up.yml)
- any future automated checks.

Wrangler (the cli) also has an official [GitHub action](https://github.com/marketplace/actions/deploy-to-cloudflare-workers-with-wrangler) with good docs which I use for deploying this blog.

## GitHub Actions
