# DOCUMENTO_MESTRE.md - Operação Navegantes

Este documento é a fonte centralizada de contexto funcional e técnico do projeto **Navegantes**. Ele deve ser mantido sincronizado com o código e consultado antes de qualquer alteração relevante.

---

## 1. Objetivo do Documento
Servir como o "Mapa da Mina" para desenvolvedores e agentes, detalhando a arquitetura, fluxos, domínios e regras de negócio do ecossistema Navegantes.

## 2. Visão Geral da Arquitetura
O sistema segue um modelo de **App Híbrido** (Mobile-First):
- **Frontend**: Single Page Application (SPA) reativa desenvolvida em **React 19** e **Vite**.
- **Mobile Wrapper**: **Capacitor** encapsula o frontend em uma WebView nativa para Android (`com.navegantes.app`).
- **Arquitetura de Renderização**: **100% Client-Side (CSR)** no APK. O APK é estático (lê do `dist/`).
- **Backend/API**: Servidor **Node.js (Express)** rodando no Railway, que atua como API de dados e Proxy de IA.
- **Persistência**: Backend acessando **Supabase** no schema `navegantes` via `@supabase/supabase-js` com credenciais server-side.

## 3. Estrutura do Projeto
- `android/`: Código-fonte nativo Gerado pelo Capacitor (Gradle/Java/Kotlin).
- `prisma/`:
  - `schema.prisma`: Definição histórica/estrutural das entidades do schema `navegantes`.
  - `dev.db`: SQLite legado de desenvolvimento (não deve ser usado em produção).
- `src/`:
  - `src/App.tsx`: **O Monolito** – Contém a lógica de UI, roteamento interno (tabs), estado global e componentes visuais.
  - `src/api.ts`: Helper para resolver URLs da API dinamicamente (Localhost vs Railway).
  - `src/assets/`: Recursos estáticos e imagens.
  - `src/components/`: Componentes extraídos do App.tsx (ex: `SafetyPreferenceToggle`).
- `server.ts`: Servidor Express e ponto de entrada do backend.
- `serverData.ts`: Camada de acesso a dados do backend via Supabase.
- `server/ai/`: Módulos de IA híbrida (router, intents, curation, context, providers).
- `server/geo/`: Módulos de geocodificação.
- `server/places/`: Módulos de descoberta de lugares (Google Places + ranking).

## 4. Endpoints da API (Backend)

### 4.1. IA Híbrida (Router + Provedores)
- **Classificador de Intenção**: `POST /api/ai/route` - Recebe a mensagem do usuário e classifica a intenção (descoberta de lugares, conversa geral, etc.) via `classifyAIIntent`. Retorna qual executor deve processar (`places`, `groq` ou `pollinations`).
- **Chat do Capitão**: `POST /api/ai/chat` - Executa a resposta do assistente "Capitão" via `routeAIChat`, que roteia dinamicamente entre Groq (modelo rápido para respostas simples) e Pollinations (modelo profundo para raciocínio/roteiros).
- **Lugares Próximos**: `POST /api/places/nearby` - Sugestões de lugares curadas editorialmente via Google Places API com camada de curadoria, segurança e ranking próprio. Suporta perfis de segurança (`equilibrado` / `priorizar_seguranca`) e superfícies (`home`, `chat`, `itinerary`, `story`).
- **Geocodificação Reversa**: `GET /api/geo/reverse-geocode?lat=&lng=` - Converte coordenadas em nome de cidade/localidade.

### 4.2. Dados e Perfil
- **Perfil**:
  - `GET /api/profile`: Busca perfil do usuário logado (atualmente `userId: 1`).
  - `PUT /api/profile`: Atualiza dados básicos (nome, bio, avatar).
  - `POST /api/upgrade`: Faz o upgrade para Premium ou adiciona créditos de viagem.
- **Comunidade (Posts)**:
  - `GET /api/posts`: Lista feed global.
  - `POST /api/posts`: Cria uma nova "Memória" (Post).
  - `POST /api/posts/:id/like`: Incrementa curtidas.
  - **Status dos comentários**: o backend retorna comentários relacionados em `GET /api/posts`, mas não existe rota dedicada para criar comentários. Novos comentários ainda são tratados localmente no frontend.
- **Sistema de Selos**: `POST /api/seals` - Registra novos carimbos no passaporte.
- **Favoritos**:
  - `POST /api/favorites`: Adiciona local aos favoritos.
  - `DELETE /api/favorites/:localId`: Remove local dos favoritos.
- **Roteiros**:
  - **Status atual**: existem modelos históricos no schema para `Itinerary`, `Day` e `Stop`, e o perfil carrega roteiros persistidos quando existirem.
  - **Limitação atual**: ainda não há rotas dedicadas no `server.ts` para criar, editar ou remover roteiros; o fluxo "Criar Novo Roteiro" do app hoje salva apenas no estado local do frontend.

## 5. Mapa de Domínios e Funcionalidades

### 5.1. Dashboard e Navegação
O `App.tsx` gerencia a navegação via abas (`activeTab`):
- **Home**: Dashboard geral com resumo do roteiro ativo e sugestões editoriais ("Perto de você" com curadoria Navegantes).
- **Map**: Mapa interativo (Google Maps) com estilos vintage e pins dinâmicos.
- **Explore** (`explorar`): Catálogo de locais segmentados por categoria.
- **Guia IA** (`ia`): Assistente "O Capitão" com sugestões contextuais, saudação por geolocalização e respostas via arquitetura híbrida de IA (Groq ↔ Pollinations).
- **Community** (`comunidade`): Feed social de memórias compartilhadas.
- **Profile** (`perfil`): Perfil do usuário, passaporte de selos e configurações.

### 5.2. Modo Brasil vs. Mundo
O app possui um switch global que altera:
1. Conjunto de dados de locais sugeridos.
2. Estilo visual do mapa (Cores/Filtros).
3. Texto e contexto do Assistente IA.

### 5.3. Roteiros de Viagem (Itineraries)
Modelados via Prisma com a relação: `Itinerary` -> `Day` -> `Stop`.
- O app oferece criação de roteiros por IA ou por sugestões da comunidade no fluxo de interface.
- No estado atual, novos roteiros criados pelo modal são adicionados apenas ao estado local do frontend; ainda não existe persistência completa via rota própria no backend.
- Possuem "temas" (Ex: Aventura, Gastronomia).

### 5.4. Gamification (Passaporte)
Sistema de "Carimbos" (`Seals`) automáticos baseados em:
- Visitar (favoritar) locais específicos.
- Completar roteiros em certas cidades.

## 6. Fluxos Críticos e Integrações
- **Geolocalização**: O app tenta detectar a localização do usuário para sugerir atividades em tempo real via IA.
- **Operações de IA**: O backend usa uma arquitetura híbrida de IA:
  - **Router soberano**: `classifyAIIntent` classifica a intenção do usuário e decide o executor (Places API, Groq ou Pollinations).
  - **Modelo rápido (Groq)**: Saudação, follow-ups simples e copy curta — baixa latência.
  - **Modelo profundo (Pollinations)**: História de bairro, comparações, roteiros e respostas abertas.
  - **Curadoria editorial unificada**: `home` e sugestões factuais do `chat` compartilham o mesmo pipeline: Google Places factual -> shortlist/ranking heurístico -> revisão editorial estruturada via Groq com contexto de superfície, objetivo editorial, perfil de segurança e julgamento de papel cultural/social do lugar.
  - **Critério de destino**: a curadoria não trata "turístico" como tipo de venue; ela avalia se o lugar funciona como destino, referência urbana, experiência memorável ou apenas infraestrutura/conveniência cotidiana.
  - **Revisão Groq estruturada**: a camada rápida de IA não apenas veta ruído; ela também reordena a shortlist e devolve razões editoriais curtas por local. Em falha do Groq, o backend opera em `fail-open` e devolve a shortlist heurística.
  - **Superfícies de curadoria**: `home` (rígida), `chat` (equilibrada), `itinerary` (moderada), `story` (restrita). Pedido explícito do usuário (ex: "motel perto") libera categorias restritas.
- **Navegação Externa**: Integração com Google Maps App e Waze para rotas guiadas.
- **PWA/Instalação**: Suporte a `beforeinstallprompt` para instalação na Home do dispositivo fora da Play Store.

## 7. Melhores Práticas e Regras de Ouro
1. **Schema PostgreSQL**: Utilize sempre `@@schema("navegantes")`.
2. **Segredos**: Nunca coloque chaves de API no frontend. Chaves de IA (Groq, Pollinations, Google Places) devem ficar apenas no backend e serem consumidas via `/api/ai/chat`, `/api/places/nearby` e `/api/geo/reverse-geocode`.
3. **Consistência Visual**: Mantenha a paleta de cores Vintage (Creme, Marrom, Ferrugem, Azul Vintage) definida em `COLORS`.
4. **Tailwind v4**: Use utilitários do Tailwind 4 e evite CSS inline complexo.

## 8. Riscos e Dívida Técnica
- **Aceleração do App.tsx**: O arquivo está se tornando difícil de gerenciar (>3k linhas). Refatoração para componentes funcionais separados é prioritária.
- **Mock de Usuário**: A dependência de `userId: 1` fixa impede multi-usuários reais (aguarda auth real).
- **Persistência Parcial de Funcionalidades**: comentários de posts e criação de roteiros ainda possuem comportamento parcial/local no frontend, sem cobertura completa de rotas dedicadas no backend.
- **Legado Prisma/SQLite**: arquivos Prisma e `dev.db` permanecem no repositório como referência estrutural, mas o backend ativo usa Supabase diretamente.


## 8.1. Direcao de Evolucao do Guia IA

Trilha documentada em:

- .conductor/tracks/ia-hibrida-places/TASK.md
- .conductor/tracks/ia-hibrida-places/SPEC.md
- .conductor/tracks/ia-hibrida-places/ARCHITECTURE.md
- .conductor/tracks/ia-hibrida-places/EXECUTION_PLAN.md

Diretrizes aprovadas:

- **Facts first**: descoberta de lugares proximos, detalhes de local e geocoding devem ser resolvidos por APIs factuais no backend.
- **Roteador soberano**: o backend deve classificar a intencao do usuario e decidir se a execucao vai para codigo, provider de places, modelo rapido ou modelo profundo.
- **Modelo rapido para fluidez**: saudacao inicial, follow-ups simples e copy curta devem priorizar um executor de baixa latencia.
- **Modelo profundo para raciocinio**: historia de bairro, comparacoes, roteiros e respostas abertas podem usar um modelo mais sofisticado.
- **Frontend leve**: a orquestracao nao deve crescer dentro do App.tsx; a interface deve consumir contratos estruturados do backend.
- **Persona unica**: independentemente do executor, o "Capitao" deve manter tom, estilo e formato consistentes.

## 9. Observações sobre Mobile (Capacitor)
- O build móvel depende do comando `npm run build` seguido de `cap sync`.
- A performance no WebView é o principal gargalo de escalabilidade devido ao tamanho do bundle JS.

## 10. Regras de Ambiente
- **Desenvolvimento local**: mantenha `VITE_API_BASE_URL` vazio em `.env.local` para que o frontend use rotas relativas `/api/...` e converse com o backend local iniciado por `npm run dev`.
- **Produção / Mobile**: defina `VITE_API_BASE_URL` com a URL pública do backend Railway no ambiente de build para que o bundle publicado aponte para a API remota.
- **Segurança**: `VITE_*` deve conter apenas configuração pública. Chaves de provedores de IA devem permanecer somente no backend.
- **Backend de dados**: configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no Railway; `DATABASE_URL` deixa de ser obrigatoria para as rotas principais.
- **IA e geosearch**: chaves de Groq, Pollinations e Google Places devem permanecer no backend e ser consumidas apenas via rotas do `server.ts`.
