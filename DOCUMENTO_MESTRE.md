# DOCUMENTO_MESTRE.md - OperaÃ§Ã£o Navegantes

Este documento Ã© a fonte centralizada de contexto funcional e tÃ©cnico do projeto **Navegantes**. Ele deve ser mantido sincronizado com o cÃ³digo e consultado antes de qualquer alteraÃ§Ã£o relevante.

---

## 1. Objetivo do Documento
Servir como o "Mapa da Mina" para desenvolvedores e agentes, detalhando a arquitetura, fluxos, domÃ­nios e regras de negÃ³cio do ecossistema Navegantes.

## 2. VisÃ£o Geral da Arquitetura
O sistema segue um modelo de **App HÃ­brido** (Mobile-First):
- **Frontend**: Single Page Application (SPA) reativa desenvolvida em **React 19** e **Vite**.
- **Mobile Wrapper**: **Capacitor** encapsula o frontend em uma WebView nativa para Android (`com.navegantes.app`).
- **Arquitetura de RenderizaÃ§Ã£o**: **100% Client-Side (CSR)** no APK. O APK Ã© estÃ¡tico (lÃª do `dist/`).
- **Backend/API**: Servidor **Node.js (Express)** rodando no Railway, que atua como API de dados e Proxy de IA.
- **PersistÃªncia**: Backend acessando **Supabase** no schema `navegantes` via `@supabase/supabase-js` com credenciais server-side.

## 3. Estrutura do Projeto
- `android/`: CÃ³digo-fonte nativo Gerado pelo Capacitor (Gradle/Java/Kotlin).
- `prisma/`:
  - `schema.prisma`: DefiniÃ§Ã£o histÃ³rica/estrutural das entidades do schema `navegantes`.
  - `dev.db`: SQLite legado de desenvolvimento (nÃ£o deve ser usado em produÃ§Ã£o).
- `src/`:
  - `src/App.tsx`: **O Monolito** â€“ ContÃ©m a lÃ³gica de UI, roteamento interno (tabs), estado global e componentes visuais.
  - `src/api.ts`: Helper para resolver URLs da API dinamicamente (Localhost vs Railway).
  - `src/assets/`: Recursos estÃ¡ticos e imagens.
- `server.ts`: Servidor Express e ponto de entrada do backend.
- `serverData.ts`: Camada de acesso a dados do backend via Supabase.

## 4. Endpoints da API (Backend)
- **IA Unificada**: `POST /api/ai` - Fachada interna para todas as operaÃ§Ãµes de IA do app. O frontend fala apenas com esta rota, e o backend decide o provider ativo (`pollinations` ou `gemini`) e normaliza a resposta.
- **Compatibilidade Legada**: `POST /api/gemini` - Mantida temporariamente para builds antigos ainda sincronizarem com o backend enquanto o `dist`/APK Ã© renovado.
- **Perfil**:
  - `GET /api/profile`: Busca perfil do usuÃ¡rio logado (atualmente `userId: 1`).
  - `PUT /api/profile`: Atualiza dados bÃ¡sicos (nome, bio, avatar).
  - `POST /api/upgrade`: Faz o upgrade para Premium ou adiciona crÃ©ditos de viagem.
- **Comunidade (Posts)**:
  - `GET /api/posts`: Lista feed global.
  - `POST /api/posts`: Cria uma nova "MemÃ³ria" (Post).
  - `POST /api/posts/:id/like`: Incrementa curtidas.
  - **Status dos comentÃ¡rios**: o backend retorna comentÃ¡rios relacionados em `GET /api/posts`, mas nÃ£o existe rota dedicada para criar comentÃ¡rios. Novos comentÃ¡rios ainda sÃ£o tratados localmente no frontend.
- **Sistema de Selos**: `POST /api/seals` - Registra novos carimbos no passaporte.
- **Favoritos**:
  - `POST /api/favorites`: Adiciona local aos favoritos.
  - `DELETE /api/favorites/:localId`: Remove local dos favoritos.
- **Roteiros**:
  - **Status atual**: existem modelos histÃ³ricos no schema para `Itinerary`, `Day` e `Stop`, e o perfil carrega roteiros persistidos quando existirem.
  - **LimitaÃ§Ã£o atual**: ainda nÃ£o hÃ¡ rotas dedicadas no `server.ts` para criar, editar ou remover roteiros; o fluxo "Criar Novo Roteiro" do app hoje salva apenas no estado local do frontend.

## 5. Mapa de DomÃ­nios e Funcionalidades

### 5.1. Dashboard e NavegaÃ§Ã£o
O `App.tsx` gerencia a navegaÃ§Ã£o via abas (`activeTab`):
- **Home**: Dashboard geral com resumo do roteiro ativo e sugestÃµes.
- **Map**: Mapa interativo (Google Maps) com estilos vintage e pins dinÃ¢micos.
- **Explore** (`explorar`): CatÃ¡logo de locais segmentados por categoria.
- **Guia IA** (`ia`): Assistente "O CapitÃ£o" com sugestÃµes contextuais, saudaÃ§Ã£o por geolocalizaÃ§Ã£o e respostas via camada unificada de IA no backend.
- **Community** (`comunidade`): Feed social de memÃ³rias compartilhadas.
- **Profile** (`perfil`): Perfil do usuÃ¡rio, passaporte de selos e configuraÃ§Ãµes.

### 5.2. Modo Brasil vs. Mundo
O app possui um switch global que altera:
1. Conjunto de dados de locais sugeridos.
2. Estilo visual do mapa (Cores/Filtros).
3. Texto e contexto do Assistente IA.

### 5.3. Roteiros de Viagem (Itineraries)
Modelados via Prisma com a relaÃ§Ã£o: `Itinerary` -> `Day` -> `Stop`.
- O app oferece criaÃ§Ã£o de roteiros por IA ou por sugestÃµes da comunidade no fluxo de interface.
- No estado atual, novos roteiros criados pelo modal sÃ£o adicionados apenas ao estado local do frontend; ainda nÃ£o existe persistÃªncia completa via rota prÃ³pria no backend.
- Possuem "temas" (Ex: Aventura, Gastronomia).

### 5.4. Gamification (Passaporte)
Sistema de "Carimbos" (`Seals`) automÃ¡ticos baseados em:
- Visitar (favoritar) locais especÃ­ficos.
- Completar roteiros em certas cidades.

## 6. Fluxos CrÃ­ticos e IntegraÃ§Ãµes
- **GeolocalizaÃ§Ã£o**: O app tenta detectar a localizaÃ§Ã£o do usuÃ¡rio para sugerir atividades em tempo real via IA.
- **OperaÃ§Ãµes de IA**: O backend organiza os casos de uso de IA por operaÃ§Ã£o (`captain_chat`, `captain_greeting`, `city_lookup`, `quick_suggestions`, `dashboard_suggestions`, `itinerary_suggestions`) e devolve um contrato estÃ¡vel para o app.
- **NavegaÃ§Ã£o Externa**: IntegraÃ§Ã£o com Google Maps App e Waze para rotas guiadas.
- **PWA/InstalaÃ§Ã£o**: Suporte a `beforeinstallprompt` para instalaÃ§Ã£o na Home do dispositivo fora da Play Store.

## 7. Melhores PrÃ¡ticas e Regras de Ouro
1. **Schema PostgreSQL**: Utilize sempre `@@schema("navegantes")`.
2. **Segredos**: Nunca coloque chaves de API no frontend. Chaves de IA devem ficar apenas no backend e serem usadas via `/api/ai`.
3. **ConsistÃªncia Visual**: Mantenha a paleta de cores Vintage (Creme, Marrom, Ferrugem, Azul Vintage) definida em `COLORS`.
4. **Tailwind v4**: Use utilitÃ¡rios do Tailwind 4 e evite CSS inline complexo.

## 8. Riscos e DÃ­vida TÃ©cnica
- **AceleraÃ§Ã£o do App.tsx**: O arquivo estÃ¡ se tornando difÃ­cil de gerenciar (>3k linhas). RefatoraÃ§Ã£o para componentes funcionais separados Ã© prioritÃ¡ria.
- **Mock de UsuÃ¡rio**: A dependÃªncia de `userId: 1` fixa impede multi-usuÃ¡rios reais (aguarda auth real).
- **Compatibilidade TemporÃ¡ria**: a rota legada `/api/gemini` foi mantida apenas para absorver builds antigos atÃ© que todo o ciclo `build` + `cap sync` esteja atualizado.
- **PersistÃªncia Parcial de Funcionalidades**: comentÃ¡rios de posts e criaÃ§Ã£o de roteiros ainda possuem comportamento parcial/local no frontend, sem cobertura completa de rotas dedicadas no backend.
- **Legado Prisma/SQLite**: arquivos Prisma e `dev.db` permanecem no repositÃ³rio como referÃªncia estrutural, mas o backend ativo usa Supabase diretamente.


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

## 9. ObservaÃ§Ãµes sobre Mobile (Capacitor)
- O build mÃ³vel depende do comando `npm run build` seguido de `cap sync`.
- A performance no WebView Ã© o principal gargalo de escalabilidade devido ao tamanho do bundle JS.

## 10. Regras de Ambiente
- **Desenvolvimento local**: mantenha `VITE_API_BASE_URL` vazio em `.env.local` para que o frontend use rotas relativas `/api/...` e converse com o backend local iniciado por `npm run dev`.
- **ProduÃ§Ã£o / Mobile**: defina `VITE_API_BASE_URL` com a URL pÃºblica do backend Railway no ambiente de build para que o bundle publicado aponte para a API remota.
- **SeguranÃ§a**: `VITE_*` deve conter apenas configuraÃ§Ã£o pÃºblica. Chaves de provedores de IA devem permanecer somente no backend.
- **Backend de dados**: configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no Railway; `DATABASE_URL` deixa de ser obrigatoria para as rotas principais.
- **IA e geosearch**: chaves de Groq, Pollinations e Google Places devem permanecer no backend e ser consumidas apenas via rotas do `server.ts`.
