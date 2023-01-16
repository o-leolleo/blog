---
title: "Laravel Traits Eventos Em Models E Multi Tenancy"
date: 2019-04-12
draft: true
language: pt
---

Em um [post anterior](), expliquei sobre o potencial de se misturar um conjunto de conceitos do PHP e do Laravel. Neste vou mostrar como é possível utilizar o que foi explicado na construção de uma “implementação” simples de uma arquitetura multi-tenant.

## Multi-tenancy

Em uma arquitetura multi-tenant, uma única instância de uma aplicação de software serve a múltiplos clientes. Cada cliente é chamado de tenant (inquilino). Ela contrasta com arquiteturas single-tenant, em que cada cliente possui sua própria instância da aplicação. Em um cenário multi-tenancy, os dados dos tenants são isolados de outros tenants, sendo invisíveis a estes.

Um exemplo prático de aplicação multi-tenant é o Slack. Cada workspace é um tenant e possui seus próprios canais, mensagens, arquivos, etc. Como é de se esperar, um workspace A não acessa os dados de um outro workspace B. Para todos os efeitos, A é invisível a B.

## Breves comentários sobre implementações

Existem algumas maneiras de se implementar uma arquitetura multi tenant. Uma delas é possuir uma base de dados para cada tenant, e implementar uma lógica dinâmica de configuração de conexão com o banco de dados, a depender do tenant que está acessando ou fazendo uma requisição à aplicação. Outra seria aplicar prefixos específicos a cada tenant às tabelas no banco de dados.

Uma outra maneira, particularmente simples, é fazer com que os dados armazenados possuam um atributo extra que identifique a qual tenant um dado registro, em uma dada tabela, pertence. Por exemplo, em uma implementação hipotética do Slack, cada canal de um workspace possuiria um atributo tenant_id, com o id do workspace.

Neste post, trabalharemos com esta última.

## Uma consideração

Para simplificar a discussão, vamos assumir que cada usuário pertence a um único tenant.

## Uma solução prematura

A primeira coisa, e possivelmente a mais importante, que temos de garantir é que um tenant não acesse os dados de outro. A solução mais direta seria tomar o cuidado de setar o tenant_id de cada registro sendo criado e aplicar a cada query uma cláusula where comparando o tenant_id dos registros com o tenant_id do usuário realizando a requisição. Teríamos um cenário parecido com o exemplificado abaixo

```php
// ...
class FooController extends Controller
{
  public function index(Request $request)
  {
    // ...
    return Foo::where('tenant_id', $request->user()->tenant_id)->get();
  }

  // ...

  public function create(Request $request)
  {
    // ...
    return Foo::create(array_merge($request->all(), [
      'tenant_id' => $request->user()->tenant_id
    ]);
  }
  // ...
}
```

Embora seja uma solução funcional, o programador tem que lembrar sempre de muitos detalhes em um ambiente como esse. Imagine como seria ter de garantir o tenant_id de Models relacionados, em recursos que abstraem diversos Models? Além disso, a medida em que um sistema que utilizasse essa abordagem crescesse, seria cada vez mais chato estar sempre ‘lembrando’ de setar o tenant_id e de filtrar os registros recuperados do banco. A verdade é que podemos tornar o dia-a-dia mais tranquilo, podemos nos permitir “esquecer” de tais detalhes de modo seguro, é possível delegar essa responsabilidade.

Filtrar os Models é questão de aplicar um escopo global a eles. Setar o tenant_id sempre que um Model é criado pode ser feito através de um event listenner. Discutimos ambas as abordagens no post anterior, então só nos resta colocar os conceitos em prática.

## O escopo global TenantScope

Aqui não há muito segredo, teríamos um escopo global como o mostrado abaixo

```php
<?php
namespace App\Scopes;

use Illuminate\Database\Eloquent\Scope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

use Auth;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        if (Auth::check()) {
            $builder->where('tenant_id', Auth::user()->tenant_id);
        }
    }
}
```

Porém o diabo está nos detalhes… Como o nosso tenant_id está associado ao usuário realizando a requisição, temos de recuperar essa informação através do uso do Facade Auth. Além disso temos de checar a autenticação antes de aplicar a query. A necessidade dessa verificação é que podemos buscar registros através, por exemplo, de comandos, ou mesmo através do tinker. Vale ressaltar que acima foi utilizada uma classe de escopo, mas poderia ter sido utilizada uma Closure, por exemplo.

## O trait TenantScoped

Agora podemos utilizar o escopo definido anteriormente e, junto a ele, adicionar um event listenner para setar o tenant_id . Tudo isso em um Trait, como mostrado abaixo.

```php
//...
use Auth;
use App\TenantScope;
use App\Tenant;

trait TenantScoped
{
  protected static function bootTenantScoped()
  {
    static::creating(function (Model $model) {
      $model->tenant_id = Auth::user()->tenant_id;
    });

    static::addGlobalScope(new TenantScope);
  }

  public function tenant()
  {
      return $this->belongsTo(Tenant::class);
  }
}
```

Agora, se quisermos que todo Model Foo seja particular a cada tenant, só precisamos usar o Trait, como mostra o exemplo abaixo.

```php
// ...
use App\Traits\TenantScoped;

class Foo extends Model
{
    use TenantScoped;
    // ...
}
```

Se quisermos que o Model seja compartilhado por todos os Tenants, basta não usar o Trait. Legal, né?

Agora podemos lidar com os Models “escopados” como se pertencessem — salvo alguns casos que explicarei adiante — a bases diferentes, ou mesmo aplicações diferentes. Garantimos o isolamento entre os tenants de maneira relativamente simples, fácil de lembrar e reutilizar.

## Nem tudo são flores

Embora a implementação discutida permita que os Models da aplicação venham filtrados pelo escopo do tenant, há alguns casos especiais a serem levados em consideração. Quando interagimos com a base de dados por métodos que operam diretamente no banco, ou que não utizam os Models para acessá-lo, não temos a garantia de que construções como escopos e event listenners sejam levados em consideração.

Basta tomar como exemplo o Trait SoftDeletes do Laravel. Quando utilizando o Facade DB do framework, ele busca os registros sem levar em consideração o campo deleted_at. Outro exemplo são as queries em regras de validação, que exibem comportamento semelhante.

Consequentemente, a solução mostrada possui alguns casos em que os detalhes devem ser lembrados e alguns cuidados tomados — não que isso não seja comum em outras soluções de outros problemas, de um modo geral.

## Comentários do além

Acoplar a checagem do tenant_id ao acesso ao usuário autenticado, via Facade Auth, não cheira muito bem, no sentido de que podemos deixar essa chegagem mais transparente e encapsulada, sobretudo para permitir que o tenant possa ser configurado, por exemplo, em comandos ou testes.

Isso não é muito complicado. Basta implementar uma classe que permita o set do tenant_id e a sua posterior recuperação. Este tenant_id poderia ser configurado, em requisições, a partir de um middleware — que se comunicaria com uma instância da classe — e, em outros contextos, poderia ser configurado através de chamadas aos métodos da classe.

Naturalmente, como essa configuração do tenant_id é um estado global da aplicação, podemos implementar essa solução hipotética através de um singleton.

Os comentários acima visam apenas fomentar a curiosidade. Apresentar como isso seria implementado foge um pouco do escopo deste post. Além disso eu gostaria, antes, de discutir um pouco sobre conceitos como service providers, service container e Facades, que podem ser temas de um post futuro.

## Por hoje é só

Com esse post busquei mostrar algumas coisas interessantes nas quais esbarrei enquanto navegando no mundo do Laravel. É o primeiro que explora o que foi discutido em PHP, Traits, Laravel & Beyond. Pretendo escrever alguns outros.

## Referências

A maior parte do que foi discutido é retirado da documentação do Laravel e do PHP. Naturalmente alguns posts me ajudaram e alimentaram minha curiosidade, os que me lembro são mostrados a seguir:

- [What is a multi-tenant system](https://dev.to/jjude/what-is-a-multi-tenant-system-bpd)
- [Desmistificando multitenancy parte 1 - introdução](https://medium.com/sejakino/desmitificando-multitenancy-parte-1-introducao-e0e0f2169649)
- [Booting eloquent model traits](https://laravel-news.com/booting-eloquent-model-traits)
