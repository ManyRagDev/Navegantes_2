# Plano de Implementacao

## Objetivo

Levar o projeto Navegantes do estado atual para uma base publicavel e sustentavel, com:

- app mobile Android distribuivel via `APK` e `AAB`
- frontend em `React + Vite` empacotado com `Capacitor`
- backend em `Node.js + Express` hospedado no `Railway`
- banco `Postgres` no `Supabase`
- acesso ao banco via `Prisma`
- integracoes sensiveis sempre passando pelo backend

## Arquitetura Alvo

- Frontend: `React + Vite`
- Mobile shell: `Capacitor`
- Backend: `Express` no `Railway`
- Banco: `Supabase Postgres`
- ORM: `Prisma`
- API base do app: `VITE_API_BASE_URL`

## Regras Arquiteturais

1. O app mobile nao pode depender de rotas locais como `"/api"` sem base configuravel.
2. Todas as chamadas do frontend devem usar `VITE_API_BASE_URL` quando falarem com a API publicada.
3. Nenhum secret real pode ir para o frontend.
4. Toda logica sensivel deve ficar no backend.
5. O frontend deve ser consumidor da API.
6. Tudo que for criado no banco deste projeto deve existir exclusivamente no schema `navegantes`.

## Politica Pratica de Seguranca

### Obrigatoriamente no backend

- `GEMINI_API_KEY`
- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- regras de negocio
- gravacao e leitura de dados do usuario
- autenticacao e autorizacao
- integracoes sensiveis ou caras

### Pode existir no frontend, se justificado

- `VITE_API_BASE_URL`
- chave de mapa voltada para client, apenas se houver decisao explicita para isso e com restricoes adequadas

## Estrutura do Banco no Supabase

Regra obrigatoria:
- tudo deve ser criado exclusivamente no schema `navegantes`
- nenhuma tabela deste projeto deve ser criada em `public`
- os relacionamentos entre tabelas deste projeto devem sempre apontar para `navegantes.<tabela>`

### Schema

Nome do schema:
- `navegantes`

Comando base previsto:

```sql
CREATE SCHEMA IF NOT EXISTS "navegantes";
```

### Tabela `navegantes.users`

Objetivo:
- armazenar os dados principais do usuario do app

Colunas:
- `id`: `SERIAL`, chave primaria
- `email`: `TEXT`, obrigatoria, unica
- `name`: `TEXT`, obrigatoria
- `bio`: `TEXT`, opcional
- `avatar`: `TEXT`, opcional
- `isPremium`: `BOOLEAN`, obrigatoria, default `false`
- `credits`: `INTEGER`, obrigatoria, default `0`
- `activeTripUntil`: `TIMESTAMP(3)`, opcional
- `createdAt`: `TIMESTAMP(3)`, obrigatoria, default `CURRENT_TIMESTAMP`

Restricoes:
- primary key em `id`
- unique em `email`

Indices:
- indice unico `users_email_key`

### Tabela `navegantes.posts`

Objetivo:
- armazenar publicacoes feitas pelos usuarios

Colunas:
- `id`: `SERIAL`, chave primaria
- `userId`: `INTEGER`, obrigatoria
- `local`: `TEXT`, obrigatoria
- `texto`: `TEXT`, obrigatoria
- `img`: `TEXT`, obrigatoria
- `likes`: `INTEGER`, obrigatoria, default `0`
- `createdAt`: `TIMESTAMP(3)`, obrigatoria, default `CURRENT_TIMESTAMP`

Restricoes:
- primary key em `id`
- foreign key `userId -> navegantes.users(id)`

Indices:
- indice `posts_userId_idx`

### Tabela `navegantes.comments`

Objetivo:
- armazenar comentarios em posts

Colunas:
- `id`: `SERIAL`, chave primaria
- `text`: `TEXT`, obrigatoria
- `userId`: `INTEGER`, obrigatoria
- `postId`: `INTEGER`, obrigatoria
- `createdAt`: `TIMESTAMP(3)`, obrigatoria, default `CURRENT_TIMESTAMP`

Restricoes:
- primary key em `id`
- foreign key `userId -> navegantes.users(id)`
- foreign key `postId -> navegantes.posts(id)`

Indices:
- indice `comments_userId_idx`
- indice `comments_postId_idx`

### Tabela `navegantes.itineraries`

Objetivo:
- armazenar roteiros de viagem criados para o usuario

Colunas:
- `id`: `SERIAL`, chave primaria
- `name`: `TEXT`, obrigatoria
- `destination`: `TEXT`, obrigatoria
- `theme`: `TEXT`, opcional
- `isCustom`: `BOOLEAN`, obrigatoria, default `false`
- `userId`: `INTEGER`, obrigatoria
- `createdAt`: `TIMESTAMP(3)`, obrigatoria, default `CURRENT_TIMESTAMP`

Restricoes:
- primary key em `id`
- foreign key `userId -> navegantes.users(id)`

Indices:
- indice `itineraries_userId_idx`

### Tabela `navegantes.days`

Objetivo:
- armazenar os dias de cada roteiro

Colunas:
- `id`: `SERIAL`, chave primaria
- `dayNumber`: `INTEGER`, obrigatoria
- `itineraryId`: `INTEGER`, obrigatoria

Restricoes:
- primary key em `id`
- foreign key `itineraryId -> navegantes.itineraries(id)`
- unique composta em `itineraryId, dayNumber`

Indices:
- indice unico `days_itineraryId_dayNumber_key`

### Tabela `navegantes.stops`

Objetivo:
- armazenar as paradas de cada dia do roteiro

Colunas:
- `id`: `SERIAL`, chave primaria
- `time`: `TEXT`, obrigatoria
- `title`: `TEXT`, obrigatoria
- `description`: `TEXT`, opcional
- `dayId`: `INTEGER`, obrigatoria

Restricoes:
- primary key em `id`
- foreign key `dayId -> navegantes.days(id)`

Indices:
- indice `stops_dayId_idx`

### Tabela `navegantes.seals`

Objetivo:
- armazenar selos e distintivos do usuario

Colunas:
- `id`: `SERIAL`, chave primaria
- `name`: `TEXT`, obrigatoria
- `icon`: `TEXT`, obrigatoria
- `color`: `TEXT`, obrigatoria
- `userId`: `INTEGER`, obrigatoria
- `createdAt`: `TIMESTAMP(3)`, obrigatoria, default `CURRENT_TIMESTAMP`

Restricoes:
- primary key em `id`
- foreign key `userId -> navegantes.users(id)`

Indices:
- indice `seals_userId_idx`

### Tabela `navegantes.favorites`

Objetivo:
- armazenar locais favoritados pelo usuario

Colunas:
- `id`: `SERIAL`, chave primaria
- `localId`: `INTEGER`, obrigatoria
- `userId`: `INTEGER`, obrigatoria
- `createdAt`: `TIMESTAMP(3)`, obrigatoria, default `CURRENT_TIMESTAMP`

Restricoes:
- primary key em `id`
- foreign key `userId -> navegantes.users(id)`
- unique composta em `userId, localId`

Indices:
- indice unico `favorites_userId_localId_key`
- indice `favorites_userId_idx`

### Relacionamentos previstos

- um `user` possui varios `posts`
- um `user` possui varios `comments`
- um `user` possui varios `itineraries`
- um `user` possui varios `seals`
- um `user` possui varios `favorites`
- um `post` possui varios `comments`
- um `itinerary` possui varios `days`
- um `day` possui varias `stops`

### Regras de integridade previstas

- exclusividade de email por usuario
- nao permitir favoritos duplicados para o mesmo `userId + localId`
- nao permitir dois dias com o mesmo `dayNumber` dentro do mesmo roteiro
- todas as foreign keys ficam dentro do schema `navegantes`

### Convencoes adotadas

- nomes de tabela em minusculo e plural
- colunas em camelCase, refletindo o modelo atual do Prisma
- datas usando `TIMESTAMP(3)`
- chaves primarias inteiras auto incrementais

### Arquivo de referencia da criacao

- [migration.sql](c:\Users\emanu\Documents\Projetos\Navegantes\prisma\migrations\20260401161000_init_navegantes_schema\migration.sql)

## Plano de Implementacao

### Fase 1: Auditoria tecnica

Objetivo:
- revisar estado atual de frontend, backend e banco

Escopo:
- revisar `server.ts`
- revisar `src/App.tsx`
- revisar `vite.config.ts`
- revisar `prisma/schema.prisma`
- identificar dados mockados vs dados reais
- identificar riscos de secrets expostos

Status:
- `Concluido`

O que foi feito:
- stack atual identificada como `React + Vite + Express + Prisma`
- estrutura mobile inexistente no inicio foi confirmada
- dependencias locais e rotas atuais foram revisadas
- risco de exposicao de secret no frontend foi identificado

### Fase 2: Base mobile com Capacitor

Objetivo:
- preparar o projeto para gerar app Android nativo

Escopo:
- instalar Capacitor
- adicionar configuracao do app
- gerar projeto Android
- criar scripts para build e sync mobile

Status:
- `Concluido`

O que foi feito:
- dependencias do Capacitor adicionadas em [package.json](c:\Users\emanu\Documents\Projetos\Navegantes\package.json)
- configuracao criada em [capacitor.config.ts](c:\Users\emanu\Documents\Projetos\Navegantes\capacitor.config.ts)
- projeto Android gerado em [android](c:\Users\emanu\Documents\Projetos\Navegantes\android)
- scripts `mobile:build`, `mobile:sync` e `mobile:android` adicionados

### Fase 3: Ajuste do frontend para API remota

Objetivo:
- impedir dependencia do app mobile em rotas locais

Escopo:
- criar helper de URL base
- trocar chamadas de `fetch("/api/...")` por chamadas baseadas em `VITE_API_BASE_URL`
- documentar variaveis de ambiente mobile

Status:
- `Concluido`

O que foi feito:
- helper criado em [src/api.ts](c:\Users\emanu\Documents\Projetos\Navegantes\src\api.ts)
- chamadas atualizadas em [src/App.tsx](c:\Users\emanu\Documents\Projetos\Navegantes\src\App.tsx)
- documentacao atualizada em [README.md](c:\Users\emanu\Documents\Projetos\Navegantes\README.md) e [.env.example](c:\Users\emanu\Documents\Projetos\Navegantes\.env.example)

Observacao:
- o app agora suporta backend remoto, mas ainda depende da publicacao da API

### Fase 4: Endurecimento de seguranca do frontend

Objetivo:
- garantir que o frontend nao carregue secrets indevidos

Escopo:
- remover exposicao de keys sensiveis do frontend
- revisar configuracoes do Vite
- revisar `.env`

Status:
- `Parcial`

O que foi identificado:
- existe exposicao indevida de chave Gemini no `.env` atual
- existe necessidade de revisar [vite.config.ts](c:\Users\emanu\Documents\Projetos\Navegantes\vite.config.ts) para eliminar qualquer injecao indevida de secret no bundle

Pendente:
- remover `VITE_GEMINI_API_KEY`
- remover qualquer injecao de `GEMINI_API_KEY` no frontend
- revisar estrategia final para Google Maps

### Fase 5: Banco de dados no Supabase

Objetivo:
- migrar do SQLite local para Postgres no Supabase, exclusivamente no schema `navegantes`

Escopo:
- trocar `sqlite` por `postgresql` no Prisma
- configurar suporte a schema `navegantes`
- criar schema e tabelas
- gerar migracao inicial
- aplicar no Supabase

Status:
- `Parcial`

O que foi feito:
- Prisma migrado para `postgresql` em [prisma/schema.prisma](c:\Users\emanu\Documents\Projetos\Navegantes\prisma\schema.prisma)
- `multiSchema` habilitado
- todos os models foram presos ao schema `navegantes`
- migracao inicial criada em [prisma/migrations/20260401161000_init_navegantes_schema/migration.sql](c:\Users\emanu\Documents\Projetos\Navegantes\prisma\migrations\20260401161000_init_navegantes_schema\migration.sql)
- validacao do schema Prisma executada com sucesso

Pendente:
- configurar `DATABASE_URL` real do Supabase
- aplicar a migracao no banco remoto
- confirmar estrutura criada em `navegantes.*`

Bloqueio atual:
- nao ha `DATABASE_URL` configurada no projeto
- nao ha MCP do Supabase disponivel nesta sessao

### Fase 6: Backend no Railway

Objetivo:
- publicar a API real para uso do app mobile

Escopo:
- configurar deploy do backend no Railway
- configurar variaveis de ambiente seguras
- conectar backend ao Supabase
- gerar Prisma Client no deploy
- aplicar migracoes no deploy ou em fluxo controlado
- expor URL publica HTTPS

Status:
- `Nao iniciado`

Pendente:
- preparar ambiente de producao
- definir pipeline de deploy
- configurar variaveis no Railway
- validar todas as rotas remotamente

### Fase 7: Fronteira entre dados reais e mocks

Objetivo:
- limpar a mistura entre dados mockados e dados persistidos

Escopo:
- identificar dados ainda hardcoded no frontend
- decidir o que vai para API
- substituir dados mockados gradualmente por dados reais

Status:
- `Nao iniciado`

Observacao:
- `src/App.tsx` ainda mistura dados reais e mockados

### Fase 8: Estrategia de mapas

Objetivo:
- decidir como tratar mapas sem fragilizar seguranca nem UX

Opcoes:
- manter Google Maps no frontend com chave client restrita
- mover parte de Places/Directions para backend
- futuramente migrar para solucao mais nativa, se necessario

Status:
- `Nao iniciado`

Decisao pendente:
- definir o equilibrio entre seguranca, simplicidade e experiencia de uso

### Fase 9: UX mobile real

Objetivo:
- tornar o app viavel para uso em viagem

Escopo:
- revisar fluxos para rede instavel
- melhorar estados de loading e erro
- considerar cache local basico
- revisar navegacao e desempenho

Status:
- `Nao iniciado`

### Fase 10: Testes Android

Objetivo:
- validar o app no ambiente Android real

Escopo:
- abrir o projeto no Android Studio
- testar em emulador
- testar em aparelho real
- revisar permissoes
- ajustar icone, splash e identificacao do app

Status:
- `Parcial`

O que foi feito:
- base Android gerada e sincronizada
- build web validado

Pendente:
- abrir no Android Studio
- validar execucao real
- gerar `APK` e `AAB`

### Fase 11: Release

Objetivo:
- preparar distribuicao na Google Play

Escopo:
- assinatura do app
- geracao de `APK`
- geracao de `AAB`
- materiais da loja
- teste interno/fechado antes do rollout

Status:
- `Nao iniciado`

## Validacoes Ja Executadas

- `npm run build`
- `npx cap sync android`
- `npm run lint`
- `npx prisma validate`

Resultado:
- validacoes passaram para a configuracao atual do app e do schema Prisma

## Principais Pendencias

1. Remover qualquer exposicao de secret no frontend.
2. Configurar `DATABASE_URL` real do Supabase.
3. Aplicar a migracao no banco remoto exclusivamente no schema `navegantes`.
4. Publicar o backend no Railway.
5. Conectar o app mobile ao backend publicado.
6. Validar o app no Android Studio e gerar o primeiro `APK`.

## Arquivos Relevantes

- [package.json](c:\Users\emanu\Documents\Projetos\Navegantes\package.json)
- [capacitor.config.ts](c:\Users\emanu\Documents\Projetos\Navegantes\capacitor.config.ts)
- [src/api.ts](c:\Users\emanu\Documents\Projetos\Navegantes\src\api.ts)
- [src/App.tsx](c:\Users\emanu\Documents\Projetos\Navegantes\src\App.tsx)
- [server.ts](c:\Users\emanu\Documents\Projetos\Navegantes\server.ts)
- [prisma/schema.prisma](c:\Users\emanu\Documents\Projetos\Navegantes\prisma\schema.prisma)
- [prisma/migrations/20260401161000_init_navegantes_schema/migration.sql](c:\Users\emanu\Documents\Projetos\Navegantes\prisma\migrations\20260401161000_init_navegantes_schema\migration.sql)
- [README.md](c:\Users\emanu\Documents\Projetos\Navegantes\README.md)
- [.env.example](c:\Users\emanu\Documents\Projetos\Navegantes\.env.example)

## Estado Atual

Resumo:
- base mobile criada
- frontend preparado para API remota
- modelagem Prisma preparada para Postgres no schema `navegantes`
- migracao inicial pronta
- criacao real no Supabase ainda bloqueada por falta de conexao configurada
