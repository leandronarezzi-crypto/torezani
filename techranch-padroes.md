# TechRanch — Como o sistema foi escrito (padrão para replicar em outros sistemas)

Documento de referência extraído do código real do TechRanch. Objetivo: servir de padrão de arquitetura,
fluxo, cliques, popups e navegação para outro sistema SaaS.

Stack: **NestJS + Prisma + PostgreSQL** (API) · **Next.js App Router + Tailwind v4** (painel web) ·
**Expo/React Native + SQLite** (app mobile offline-first). Sem biblioteca de UI, sem biblioteca de
modal, sem biblioteca de ícones, sem Redux/React Query — tudo é React puro + Tailwind + 4 arquivos
de infraestrutura (`api.ts`, `session.ts`, `useSession.ts`, `useFetch.ts`).

---

## 1. Estrutura do monorepo

```
apps/
  api/       NestJS + Prisma — API central, um módulo por domínio de negócio
  web/       Next.js — painel (desktop)
  mobile/    Expo — app de campo offline-first
docs/        arquitetura, deploy, referências
scripts/dev.js   um comando (`npm run dev`) sobe banco (Docker) + API + web
```

### Frontend (`apps/web/src`)

```
app/
  layout.tsx            layout raiz (fontes, metadata)
  page.tsx              landing page pública
  login/page.tsx        público
  register/page.tsx     público
  (app)/                ← route group: TODAS as telas autenticadas
    layout.tsx          shell autenticado: guard + Sidebar + PopupNovidades + <main>
    dashboard/  animals/  animals/[id]/  animals/new/  ...uma pasta por tela
  admin/                ← área do dono da plataforma (layout próprio, visual distinto)
components/             ModalCadastro, PopupNovidades, Sidebar, NavIcon, StatTile...
lib/                    api.ts, session.ts, useSession.ts, useFetch.ts, theme.ts,
                        changelog.ts, types.ts (todos os tipos + labels PT-BR num arquivo só)
```

**Regra de ouro:** URL = pasta. Lista em `/coisas`, criação em `/coisas/new` (página, não modal,
quando o formulário é grande), detalhe em `/coisas/[id]`. Modais só para formulários curtos dentro
de uma tela.

### Backend (`apps/api/src`)

Um módulo NestJS por domínio (`animals/`, `pastures/`, `notifications/`, `sync/`...), cada um com
`*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`. Registro central no `app.module.ts`.
`main.ts` liga: CORS configurável por env, prefixo global `/api`, `ValidationPipe({ whitelist,
forbidNonWhitelisted, transform })` e Swagger em `/api/docs`.

---

## 2. Design tokens: cores semânticas em CSS vars (base do modo escuro)

Nenhuma cor "crua" nos componentes. Tudo referencia tokens semânticos definidos uma única vez no
`globals.css`, com bloco `.dark` sobrepondo os valores:

```css
@import "tailwindcss";

:root {
  --background: #faf7ef;   --card: #ffffff;
  --foreground: #2a2718;   --foreground-soft: #5c5642;
  --line: #ddd5bd;
  --accent: #5f7024;       --accent-soft: #eef0dd;
  --danger: #a3311c;       --warn: #a8681c;
}
.dark {
  --background: #1b1a13;   --card: #24231a;
  --foreground: #f3f1e6;   --foreground-soft: #b8b39c;
  --line: #3a3826;
  --accent: #8ea83a;       --accent-soft: #2c3318;
  --danger: #e0806a;       --warn: #e0a34a;
}
@theme inline {
  --color-background: var(--background);
  --color-card: var(--card);
  /* ...um por token — vira classe Tailwind: bg-card, text-foreground, border-line, bg-accent */
}
```

Consequência: **modo escuro custa zero por componente** — nenhum `dark:` espalhado no JSX. O toggle
é só isto (`lib/theme.ts`):

```ts
export function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  window.localStorage.setItem('techranch.theme', theme);
}
```

O tema salvo só é aplicado no layout autenticado (a landing pública é sempre clara).

Vocabulário de uso: `background` = fundo da página, `card` = superfícies, `line` = todas as bordas,
`foreground`/`foreground-soft` = texto principal/secundário, `accent` = ação primária e links,
`accent-soft` = fundo do item ativo/chips, `danger` = erros e badge, `warn` = alertas.

**Para portar:** troque só os hex dos tokens. Nenhum componente muda.

---

## 3. Infraestrutura de dados no cliente (4 arquivos, ~150 linhas)

### 3.1 `lib/api.ts` — cliente HTTP único

```ts
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers };
  if (auth) {
    const session = loadSession();
    if (session) headers.Authorization = `Bearer ${session.accessToken}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = (body && body.message) || `Erro ${response.status} ao chamar ${path}`;
    throw new ApiError(Array.isArray(message) ? message.join('; ') : message, response.status);
  }
  return body as T;
}

export const api = {
  get:    <T>(path: string) => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, data: unknown, auth = true) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }, auth),
  patch:  <T>(path: string, data: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(path: string, data?: unknown) => request<T>(path, { method: 'DELETE', body: data !== undefined ? JSON.stringify(data) : undefined }),
};
```

Detalhe importante: o NestJS devolve `message` como array quando a validação falha em vários campos —
o `join('; ')` transforma isso numa mensagem única exibível.

### 3.2 `lib/session.ts` — sessão em localStorage

```ts
export interface Session {
  accessToken: string;
  userId: string;
  farmId: string;        // ← escopo do tenant, espelha o claim do JWT
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'COLLABORATOR' | 'READONLY';
  isPlatformOwner: boolean;
  impersonatedBy?: string;  // presente só em sessão de "entrar como"
}
// saveSession / loadSession / clearSession — JSON.stringify em 'techranch.session'
// Toda função checa typeof window === 'undefined' (SSR-safe).
```

### 3.3 `lib/useSession.ts` — guard de autenticação

```ts
export function useSession() {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  // useEffect no mount: loadSession() → 'authenticated', ou router.replace('/login')
  // status 'loading' evita flash de conteúdo protegido antes da checagem
}
export function useLogout() { /* clearSession() + router.replace('/login') */ }
```

### 3.4 `lib/useFetch.ts` — GET declarativo com refetch

```ts
export function useFetch<T>(path: string | null): { data, loading, error, refetch } {
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    if (!path) return;            // path null = fetch condicional desligado
    let active = true;            // flag anti-race: ignora resposta de path antigo
    api.get<T>(path).then(...).catch(...).finally(...);
    return () => { active = false; };
  }, [path, tick]);
}
```

Padrão de uso em toda tela: `useFetch` para ler; mutações via `api.post/patch/delete` direto no
handler; sucesso → `refetch()` (ou `router.push` para a tela seguinte). Sem cache, sem store global.

---

## 4. Fluxo de autenticação e roteamento

```
/            landing pública
/login       POST /auth/login    → saveSession() → isPlatformOwner ? /admin : /dashboard
/register    POST /auth/register-farm (cria fazenda + usuário ADMIN numa chamada) → mesmo redirect
/(app)/*     shell autenticado (guard no layout do route group)
/admin/*     só isPlatformOwner (layout próprio; quem não é, é jogado pro /dashboard)
```

- Login/registro: card centralizado `max-w-sm rounded-xl border border-line bg-card p-8`, título +
  subtítulo, campos, erro em `<p class="text-danger">` acima do botão, botão full-width que troca o
  texto (`Entrando…`) e desabilita durante o submit. Rodapé com link cruzado
  login ⇄ register (`Primeira vez por aqui? Cadastre sua fazenda` / `Já tem conta? Entrar`).
- `router.replace` (não `push`) em todo redirect de auth — impede voltar pro login com "voltar".
- O layout `(app)/layout.tsx` faz três coisas: guard (`useSession`), aplica o tema salvo, e monta o
  shell:

```tsx
<div className="flex h-screen flex-col overflow-hidden bg-background">
  {session.impersonatedBy ? <BannerImpersonation /> : null}
  <div className="flex flex-1 overflow-hidden">
    <PopupNovidades />
    <Sidebar session={session} />
    <main className="h-full flex-1 overflow-y-auto p-8">{children}</main>
  </div>
</div>
```

`h-screen overflow-hidden` no wrapper + `overflow-y-auto` no `<main>`: a sidebar fica fixa e só o
conteúdo rola.

### 4.1 Área admin + "entrar como" (impersonation)

- `/admin` tem layout próprio, escuro, com faixa vermelha fixa no topo: *"Painel do administrador —
  acesso restrito"*. Visual deliberadamente diferente do painel do cliente para o dono nunca
  confundir onde está.
- `isPlatformOwner` **não é coluna no banco** — é derivado de `PLATFORM_OWNER_EMAILS` (env) no
  momento do login e assinado no JWT. Motivo: sem endpoint/coluna, sem vetor de escalonamento de
  privilégio.
- "Entrar como" uma fazenda: guarda a sessão real do admin em `techranch.admin-session-stash`
  (localStorage), grava a sessão impersonada com `impersonatedBy` preenchido. O layout autenticado
  detecta `impersonatedBy` e mostra faixa vermelha no topo: *"Modo suporte — visualizando como
  {email}"* com botão **Voltar para o painel admin** (restaura a sessão guardada, sem novo login).

---

## 5. Sidebar (o hub de navegação)

### 5.1 Menu 100% declarativo

```tsx
interface ItemNav { href: string; label: string; icone: string; modulo?: FarmModule }

const NAV_GROUPS: GrupoNav[] = [
  { titulo: 'Painel',                itens: [ dashboard, notifications ] },
  { titulo: 'Rebanho e manejo',      itens: [ animals, pastures, nutrition, calendar ] },
  { titulo: 'Add-ons',               itens: [ { href: '/confinement', modulo: 'CONFINEMENT' }, ... ] },
  { titulo: 'Comercial e financeiro',itens: [ clients, sales, inventory, finance, reports ] },
  { titulo: 'Administração',         itens: [ users, settings ] },
];
```

Adicionar tela nova = adicionar 1 objeto aqui + 1 pasta em `app/(app)/`.

### 5.2 Gating por módulo contratado (feature flag por tenant)

```tsx
const farm = useFetch<Farm>('/farms/me');
const groups = NAV_GROUPS.map((group) => ({
  ...group,
  itens: group.itens.filter((item) => !item.modulo || farm.data?.modulesEnabled.includes(item.modulo)),
})).filter((group) => group.itens.length > 0);   // grupo vazio some inteiro
```

`Farm.modulesEnabled` é um array de enums no banco, editável em **Configurações** (checkboxes).
Ligar/desligar módulo → item aparece/some do menu. É assim que o mesmo código atende planos
diferentes.

### 5.3 Item ativo

```tsx
const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
// ativo:   'bg-accent-soft text-accent'
// inativo: 'text-foreground-soft hover:bg-background'
```

O `startsWith` mantém "Rebanho" aceso em `/animals/123` — link nunca "apaga" ao entrar num detalhe.

### 5.4 Badge de notificações

```tsx
const notifSummary = useFetch<{ naoLidas: number }>('/notifications/summary');
// sobre o ícone do sino:
{item.href === '/notifications' && naoLidas > 0 ? (
  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center
                   rounded-full bg-danger px-1 text-[9px] font-bold text-white">
    {naoLidas > 99 ? '99+' : naoLidas}
  </span>
) : null}
```

Sem polling/websocket — atualiza quando a Sidebar remonta. Suficiente para uso interno; se o
sistema destino exigir "ao vivo", adicione polling com intervalo ou refetch por mudança de rota.

### 5.5 Recolher/expandir, tema, avatar, sair (rodapé da sidebar)

- Recolhida (`w-16`) ⇄ expandida (`w-64`), com `transition-[width] duration-150`. Preferência salva
  em `localStorage['techranch.sidebar.collapsed']` (lida em `useEffect` no mount — localStorage não
  existe no servidor, inicializar direto no `useState` quebraria a hidratação).
- Recolhida: só ícones centralizados, cada `Link` ganha `title={item.label}` (tooltip nativo);
  cabeçalhos de grupo e rótulos somem; a seta do botão gira com `rotate-180`.
- Botão de tema (☀️/🌙) chama `applyTheme` e troca a logo (versão clara/escura da marca).
- Rodapé: avatar circular com iniciais (2 primeiras palavras do nome), nome truncado, papel do
  usuário, botão **Sair** (`clearSession` + `replace('/login')`).

```tsx
const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
```

### 5.6 Ícones sem biblioteca (`NavIcon`)

Dicionário `Record<string, ReactNode>` de paths SVG inline, renderizados num `<svg>` 18×18 com
`stroke="currentColor"` — o ícone herda automaticamente a cor do link (ativo/hover sem código extra).

---

## 6. Popups e modais

Não há biblioteca de modal. Overlay + estado React + renderização condicional. Três camadas de
z-index: conteúdo → modais `z-50` → popup de novidades `z-[60]`.

### 6.1 `ModalCadastro` — o modal padrão de criar/editar

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
  <form onSubmit={onSubmit} className={`w-full ${largura} rounded-xl bg-card shadow-xl`}>
    {/* cabeçalho: titulo + subtitulo opcional + ✕ (onFechar) */}
    <div className="max-h-[70vh] overflow-y-auto border-t border-line px-6 py-4">{children}</div>
    {/* rodapé: Cancelar | botão submit: salvando ? 'Salvando…' : textoSalvar */}
  </form>
</div>
```

Props: `titulo, subtitulo?, onFechar, onSubmit, salvando?, textoSalvar?, largura?, children`.
Pontos de projeto:

- O wrapper é um **`<form>`** — o botão salvar é `type="submit"`, Enter funciona de graça.
- Corpo rola sozinho (`max-h-[70vh] overflow-y-auto`); cabeçalho e rodapé fixos.
- `salvando` desabilita o botão e troca o texto — mata o duplo submit.
- Junto do componente são exportadas as classes de campo, para todo formulário ser idêntico:

```ts
export const CAMPO_CLASSE = 'w-full rounded-md border border-line bg-card px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft';
export const LABEL_CLASSE = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-soft';
```

### 6.2 A mecânica de clique → popup

**O objeto clicado É o estado do modal.** Não existe boolean `modalAberto` separado para edição:

```tsx
const [mostrarForm, setMostrarForm] = useState(false);        // modal de "novo"
const [editando, setEditando] = useState<Cliente | null>(null); // modal de "editar"

<button onClick={() => setEditando(c)}>Editar</button>          // clique abre

{editando && (
  <ModalCadastro titulo="Editar" subtitulo={editando.nome}
                 onFechar={() => setEditando(null)} onSubmit={salvar} salvando={salvando}>
    {/* campos */}
  </ModalCadastro>
)}
```

Ciclo completo de toda mutação: submit → `api.patch(...)` → fecha modal (`setEditando(null)`) →
`refetch()` da lista. Erro → `setErro(mensagem)` exibido dentro do modal, modal continua aberto.
Exclusões usam `window.confirm()` nativo (decisão consciente de simplicidade — ver §10).

### 6.3 `PopupNovidades` — changelog na entrada (1× por versão, por navegador)

Sem backend. Fonte é um array versionado no próprio código (`lib/changelog.ts`):

```ts
export const CHANGELOG: EntradaChangelog[] = [
  { versao: '1.4.0', data: '2026-08-02', itens: ['Central de notificações...', 'Modo escuro...'] },
  // mais recente primeiro; para lançar novidade, adicione uma entrada no topo
];
export const VERSAO_ATUAL = CHANGELOG[0].versao;
```

Componente montado uma única vez no layout autenticado:

```tsx
useEffect(() => {
  if (localStorage.getItem('techranch.versao-vista') !== VERSAO_ATUAL) setAberto(true);
}, []);
function fechar() { localStorage.setItem('techranch.versao-vista', VERSAO_ATUAL); setAberto(false); }
```

Visual: overlay `z-[60]` (acima de qualquer modal), card `max-w-md`, cabeçalho com
"Atualização {versão} no sistema" em `text-accent` + data pt-BR, lista com bolinha `bg-accent` por
item, botão único **OK, entendi**. Deploy de versão nova → todo usuário vê o popup no próximo
acesso, uma vez.

---

## 7. Como as telas conversam (links)

Princípio: **toda entidade citada em qualquer tela vira `<Link>` para a tela dela.** Nunca texto
morto quando existe página de destino.

- **Lista → detalhe:** na tabela do rebanho, o brinco é o link
  (`<Link href={`/animals/${animal.id}`} className="font-semibold text-accent">`). A linha inteira
  tem `hover:bg-background` como affordance.
- **Lista → criação:** botão primário no header da lista aponta para rota própria
  (`<Link href="/animals/new">Novo animal</Link>`) quando o formulário é grande; modal quando é curto.
- **Criação → detalhe:** salvar animal novo → `router.push(`/animals/${animal.id}`)` — o usuário cai
  na ficha do que acabou de criar, não de volta na lista.
- **Detalhe → entidades relacionadas:** na ficha do animal, mãe e pai são links para as fichas deles
  (genealogia navegável); a seção Melhoramento tem link "Lançar nova avaliação" → `/breeding`.
- **Notificação → tela da causa:** cada notificação carrega o link como dado,
  `link: { label: 'Ver Estoque', href: '/inventory' }`, definido no backend junto com o alerta. O
  frontend só renderiza. Clique resolve o problema onde ele mora.
- **Ativo por prefixo:** `pathname.startsWith(href + '/')` mantém o contexto aceso na sidebar em
  qualquer profundidade.
- **Cross-áreas:** o admin tem "Ver meu painel de fazenda" (`/dashboard`); a sessão impersonada tem
  "Voltar para o painel admin" no banner.

---

## 8. Padrão de página (o template de toda tela)

Toda tela autenticada segue o mesmo esqueleto, de cima para baixo:

```tsx
<div className="max-w-5xl">                        {/* largura contida, não full-bleed */}
  {/* 1. Header */}
  <div className="mb-6 flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Título</h1>
      <p className="mt-1 text-sm text-foreground-soft">Subtítulo explicando a tela.</p>
    </div>
    <BotãoDeAçãoPrimária />                        {/* Link ou botão que abre modal */}
  </div>

  {/* 2. (opcional) Cards de resumo */}
  <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
    <StatTile label="Total" value={n} loading={loading} tone="good|bad|default" />
  </div>

  {/* 3. (opcional) Filtros: abas em pill + busca, tudo client-side em useMemo */}

  {/* 4. Estados — sempre nesta ordem, sempre presentes */}
  {error   ? <p className="text-sm text-danger">{error}</p> : null}
  {loading ? <p className="text-sm text-foreground-soft">Carregando…</p> : null}
  {vazio   ? <p / ou card tracejado "Nenhum X cadastrado ainda."> : null}

  {/* 5. Conteúdo: tabela em card, ou grid de <section> em card */}
  {/* 6. Modais condicionais no fim do JSX */}
</div>
```

Peças recorrentes:

- **StatTile** (número grande + rótulo): `rounded-xl border border-line bg-card p-5`, valor em
  `text-2xl font-bold tabular-nums`, `tone` colore o número (`good`→accent, `bad`→danger),
  `loading` mostra `—`.
- **Tabela padrão:** wrapper `overflow-x-auto rounded-xl border border-line bg-card`; `thead` com
  `bg-background text-xs uppercase tracking-wide text-foreground-soft`; linhas com
  `border-b border-line last:border-0 hover:bg-background`; células `px-4 py-3`.
- **Abas de filtro em pill:** container `flex gap-1 rounded-lg border border-line p-0.5`; aba ativa
  com fundo colorido; rótulo sempre com contagem: `Não lidas (3)`. Filtro em `useMemo`, nunca
  refetch.
- **Seções de detalhe:** `<section className="rounded-xl border border-line bg-card p-5">` com
  `<h2 className="text-sm font-semibold">`, lista `flex justify-between text-sm` (rótulo soft à
  esquerda, valor `font-medium` à direita) e, abaixo de `border-t`, um mini-form inline para
  adicionar item àquela seção — cada seção com seu próprio estado de erro/saving.
- **Update otimista** (notificações): atualiza o estado local antes do PATCH; no catch, mostra erro
  e `refetch()` para desfazer.
- **Formulário controlado sem sincronização de efeito** (Configurações): `key={farm.id}` no
  componente do form força remontagem quando a entidade muda — os `useState(farm.name)` releem os
  iniciais sem `useEffect` de sincronização.
- **Botões de escolha binária** (sexo do animal): dois botões lado a lado em vez de radio/select —
  selecionado = `border-accent bg-accent-soft text-accent`.
- **Labels e textos da interface sempre em PT-BR; enums/código em inglês**, com dicionários de
  tradução centralizados em `lib/types.ts` (`ANIMAL_STATUS_LABEL`, `REPRO_EVENT_LABEL`,
  `NOTIFICATION_TYPE_EMOJI`...).

---

## 9. Padrões de backend que sustentam o fluxo

### 9.1 Multi-tenant por `farmId` em tudo

O JWT carrega `{ sub, farmId, role, email, isPlatformOwner }`. Um decorator `@CurrentUser()` entrega
o usuário autenticado ao controller, e **toda query filtra por `farmId`** — o id do tenant nunca vem
do body ou da URL, sempre do token. Guard padrão `@UseGuards(JwtAuthGuard)` no controller inteiro.

### 9.2 Notificações computadas (não persistidas)

Não há tabela de notificações. Elas são **derivadas dos dados de negócio a cada request**; só o
estado "lida" persiste (`NotificationRead(userId, notificationId)` com unique composto).

```ts
// 4 queries em paralelo → cada achado vira um evento com id DETERMINÍSTICO:
{ id: `LOW_STOCK:${item.id}`,          // TIPO + ':' + id do registro de origem
  type, important, title,
  description: 'Milho — 40 kg em estoque (mínimo: 100 kg).',
  date, link: { label: 'Ver Estoque', href: '/inventory' } }
```

- Listar = computar + cruzar com a tabela de lidas (`Set` de ids).
- Marcar lida = `upsert`; marcar todas = `createMany` com `skipDuplicates`; `marcarLida` valida que
  o id existe entre os eventos computados antes de gravar (senão 404).
- O id vai URL-encoded na rota (`PATCH /notifications/:id/read` + `decodeURIComponent`), porque
  contém `:`.
- **A grande vantagem:** resolvido o problema real (estoque reposto, evento passou), a notificação
  some sozinha — a query para de retorná-la. Zero sincronização.
- **O limite:** serve para alertas derivados de estado (atraso, limite, proximidade de data). Eventos
  pontuais ("fulano comentou") exigem tabela persistida — modelo diferente.

Endpoints: `GET /notifications` · `GET /notifications/summary` (`{ total, naoLidas, importantes }`,
alimenta o badge) · `PATCH /notifications/:id/read` · `POST /notifications/read-all`.

### 9.3 Sincronização offline idempotente (mobile → API)

O app grava lançamentos no SQLite local e envia depois em lote (`POST /sync/batch`). O desenho que
torna isso seguro:

- Cada evento nasce no aparelho com um **`clientEventId` (UUID) gerado no cliente**, com constraint
  **unique no banco** em cada tabela de destino.
- O servidor processa evento a evento: valida o payload com o DTO da entidade
  (`plainToInstance` + `validate`), aplica dentro do escopo do `farmId` (conferindo que o animal/
  piquete pertence à fazenda), e responde um **ack por evento**: `applied`, `duplicate` (violação
  de unique no `clientEventId` → busca o registro existente e devolve o id — reenvio é inofensivo)
  ou `failed` (com a mensagem).
- Todo evento também é logado numa tabela `SyncEvent` (upsert por `entityType+clientEventId`) —
  trilha de auditoria da fila.
- Registros criados via app carregam `source: 'APP'`, `deviceId` e `createdById` — o painel web
  mostra a origem de cada lançamento.
- Operações compostas (nascimento = criar animal + registro de parto; morte = registro + status do
  animal) rodam em `$transaction`.

### 9.4 Módulos contratados

`Farm.modulesEnabled: FarmModule[]` no schema. O frontend lê via `/farms/me` e esconde menu + telas;
Configurações edita com `PATCH /farms/me`. Novo add-on = novo valor no enum + item com `modulo:` no
`NAV_GROUPS`.

---

## 10. Convenções transversais (resumo copiável)

- **Chaves de localStorage com namespace do produto:** `techranch.session`, `techranch.theme`,
  `techranch.sidebar.collapsed`, `techranch.versao-vista`, `techranch.admin-session-stash`. No
  sistema novo, troque o prefixo.
- **Z-index em 3 camadas fixas:** conteúdo → `z-50` (modais) → `z-[60]` (popup de novidades/banner).
- **Overlay padrão:** `fixed inset-0 bg-black/40 p-6 flex items-center justify-center`.
- **Toda leitura de `localStorage` mora em `useEffect`**, nunca no corpo do componente nem no
  inicializador do `useState` (SSR/hidratação).
- **Todo botão de submit:** `disabled={saving}` + texto trocado (`Salvando…`) + `disabled:opacity-*`.
- **Todo erro de API:** `err instanceof ApiError ? err.message : 'mensagem genérica amigável'`,
  exibido em `<p className="text-sm text-danger">` perto de onde o usuário agiu.
- **Raios e espaçamentos:** cards/modais `rounded-xl`, botões/campos `rounded-lg` ou `rounded-md`,
  padding de card `p-5`/`p-6`, página `p-8`.
- **`router.replace` para redirects de auth, `router.push` para navegação de conteúdo.**

## 11. O que NÃO copiar cegamente (limites conhecidos do padrão)

1. **Token JWT em localStorage** é vulnerável a XSS (qualquer script injetado lê o token). Aceitável
   no contexto atual; se o sistema novo tiver requisitos de segurança maiores, use cookie
   `httpOnly` + refresh token.
2. **Badge e dados sem atualização ao vivo** — `useFetch` roda no mount; sem polling, SSE ou
   invalidação entre telas. Duas abas abertas divergem. Se precisar de tempo real, esse desenho não
   entrega.
3. **Modais sem ESC, sem clique-fora, sem focus-trap, sem `aria-modal`, sem travar scroll do body.**
   Funciona porque o app é simples. Com requisito de acessibilidade, use `<dialog>` nativo ou
   Radix/Headless UI mantendo a mesma API de props (`titulo/onFechar/onSubmit/salvando`).
4. **`window.confirm` para exclusões** — inconsistente com o resto do visual. No sistema novo, vale
   padronizar um modal de confirmação desde o início.
5. **Sem paginação nas listas** (`GET /animals` traz tudo) e **notificações recomputadas a cada
   request**. Barato em base pequena; com volume, adicione paginação e cache curto.
6. **Sessão não expira no cliente** — token vencido só aparece como erro 401 na primeira chamada.
   Um interceptor no `api.ts` (401 → `clearSession` + redirect) fecha esse buraco com ~5 linhas.
7. **`useFetch` sem cache/deduplicação** — a Sidebar e o Dashboard pedem `/farms/me` cada um por
   conta própria. Irrelevante em tela pequena; num sistema maior, considere SWR/React Query
   mantendo o mesmo contrato (`data/loading/error/refetch`).
