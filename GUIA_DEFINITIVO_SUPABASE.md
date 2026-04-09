# Guia Definitivo Supabase

Este documento registra o caminho que funcionou no `Navegantes` e os erros reais que apareceram durante a integração com Supabase + Railway.

Objetivo:
- evitar repetir troubleshooting longo
- padronizar novos projetos
- deixar claro quando usar `supabase-js` e quando evitar `Prisma`

## 1. Resumo Executivo

No `Navegantes`, o caminho que funcionou foi:
- backend no Railway
- acesso a dados com `@supabase/supabase-js`
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` no backend
- schema custom `navegantes` exposto na API do Supabase
- grants explícitos para `service_role` no schema custom

O caminho que mais deu problema foi:
- `Prisma` conectado ao Supabase via `DATABASE_URL`
- especialmente com pooler/Supavisor no Railway

Regra prática:
- se o projeto já usa Supabase como backend principal, prefira `supabase-js`
- só use `Prisma` se houver motivo claro e se a equipe aceitar o custo operacional extra

## 2. O Que Deu Errado

### 2.1. Prisma + Pooler + Railway

Sintomas:
- `FATAL: Tenant or user not found`
- `Authentication failed against database server`
- `Can't reach database server`

Aprendizado:
- a string podia parecer correta e ainda assim falhar no runtime
- troubleshooting com `DATABASE_URL` foi mais caro do que o benefício do ORM
- no nosso caso, migrar para `supabase-js` foi o caminho pragmático

### 2.2. Schema custom não exposto

Sintoma:
- `The schema must be one of the following: public, graphql_public, postspark, brincareducando`

Causa:
- o schema `navegantes` existia no banco, mas não estava em `Exposed schemas` no painel do Supabase

### 2.3. Schema exposto, mas sem grants

Sintoma:
- `permission denied for schema navegantes`

Causa:
- o schema estava exposto na API, mas o role `service_role` ainda não tinha permissão no schema/tabelas

## 3. Padrão Recomendado Para Projetos Novos

### 3.1. Backend

Use:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `@supabase/supabase-js`

Evite depender de:
- `DATABASE_URL`
- `Prisma`
- pooler/connection string complexa

### 3.2. Frontend

Se houver auth client-side:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Nunca expor no frontend:
- `SUPABASE_SERVICE_ROLE_KEY`

### 3.3. Schema

Se usar schema custom como `navegantes`:
- criar o schema
- expor o schema no painel do Supabase
- conceder grants explícitos

## 4. Checklist Definitivo

### Passo 1. Criar ou confirmar o schema

Exemplo:

```sql
create schema if not exists navegantes;
```

### Passo 2. Expor o schema na API

No Supabase:
- `Settings`
- `API`
- `Exposed schemas`
- adicionar `navegantes`

### Passo 3. Dar grants ao `service_role`

Para backend server-side, o mínimo recomendado é:

```sql
grant usage on schema navegantes to service_role;
grant all on all tables in schema navegantes to service_role;
grant all on all routines in schema navegantes to service_role;
grant all on all sequences in schema navegantes to service_role;

alter default privileges in schema navegantes
grant all on tables to service_role;

alter default privileges in schema navegantes
grant all on routines to service_role;

alter default privileges in schema navegantes
grant all on sequences to service_role;
```

Observação:
- isso foi suficiente para o `Navegantes`
- não abra `anon` e `authenticated` sem necessidade

### Passo 4. Configurar o Railway

Variáveis obrigatórias no backend:

```env
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
```

Variáveis opcionais, dependendo do projeto:

```env
VITE_API_BASE_URL=https://seu-backend.up.railway.app
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

### Passo 5. Fazer deploy

Depois de salvar variáveis no Railway:
- redeploy
- testar healthcheck
- testar rota crítica

## 5. Smoke Test Recomendado

Todo backend deve ter um endpoint simples para teste de banco.

No `Navegantes`, usamos:

```text
GET /api/health/db
```

Resultado esperado:

```json
{"ok":true}
```

Depois testar:

```text
GET /api/profile
```

Se estiver tudo certo, a rota deve responder com dados válidos do schema.

## 6. Erros e Diagnóstico Rápido

### Erro: `Tenant or user not found`

Interpretação:
- problema de autenticação/conexão no Postgres/pooler
- não é ausência de registro da tabela

Ação:
- se estiver usando `Prisma` + `DATABASE_URL`, suspeite primeiro dessa arquitetura
- considere migrar para `supabase-js`

### Erro: `Authentication failed against database server`

Interpretação:
- usuário/senha/host da connection string inválidos

Ação:
- revisar credenciais
- conferir string oficial no painel do Supabase

### Erro: `Can't reach database server`

Interpretação:
- host/porta não alcançáveis do ambiente atual

Ação:
- revisar conexão direta vs pooler
- validar reachability do ambiente

### Erro: `The schema must be one of the following`

Interpretação:
- schema não exposto na API do Supabase

Ação:
- adicionar o schema em `Exposed schemas`

### Erro: `permission denied for schema ...`

Interpretação:
- schema exposto, mas role sem grants

Ação:
- aplicar grants no schema para `service_role`

## 7. Quando Usar Prisma

Use Prisma só se:
- houver forte necessidade de ORM
- a equipe aceitar manter `DATABASE_URL`
- houver tempo para resolver questões de pooler, schema e runtime

No restante dos casos, para projetos parecidos com os seus:
- `supabase-js` é mais alinhado com a stack real já usada em outros repositórios

## 8. Padrão Recomendado Para Este Ecossistema

Se o projeto usar Supabase como backend principal:
- backend: `supabase-js` + `SUPABASE_SERVICE_ROLE_KEY`
- frontend: `supabase-js` + `anon key`
- schema custom: sempre exposto + grants explícitos
- Railway: sem depender de `DATABASE_URL` para rotas principais

## 9. O Que Funcionou no Navegantes

Funcionou:
- migrar o backend principal para `supabase-js`
- usar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- expor `navegantes`
- conceder grants para `service_role`
- testar com `/api/health/db`

Não resolveu ou custou tempo demais:
- insistir em `Prisma` + pooler
- focar em ausência de usuário na tabela como causa principal
- discutir bearer token antes de resolver acesso backend ao banco

## 10. Fontes Oficiais

- Supabase Docs, custom schemas: https://supabase.com/docs/guides/api/using-custom-schemas
- Supabase Docs, Prisma troubleshooting: https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting
- Supabase Docs, Database API 42501 errors: https://supabase.com/docs/guides/troubleshooting/database-api-42501-errors
