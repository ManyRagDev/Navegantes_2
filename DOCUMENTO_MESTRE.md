# DOCUMENTO_MESTRE.md - Operação Navegantes

Este documento é a fonte centralizada de contexto funcional e técnico do projeto **Navegantes**. Ele deve ser mantido sincronizado com o código e consultado antes de qualquer alteração relevante.

## 1. Objetivo do Documento
Servir como o "Mapa da Mina" para desenvolvedores e agentes, detalhando a arquitetura, fluxos, domínios e regras de negócio do ecossistema Navegantes.

## 2. Visão Geral da Arquitetura
O sistema segue um modelo de **App Híbrido** com backend em **Node.js (Express)** e frontend em **React (Vite)**, envelopado pelo **Capacitor** para distribuição Android.
- **Frontend**: SPA reativa com foco em estética vintage.
- **Backend/API**: Centraliza operações de banco de dados e proxies de segurança (IA).
- **Persistência**: Camada ORM Prisma acessando PostgreSQL (Supabase) via schema dedicado `navegantes`.

## 3. Estrutura do Projeto
- `android/`: Código-fonte nativo do app gerado pelo Capacitor.
- `prisma/`: Definições de schema, migrações e banco de dados SQLite de desenvolvimento.
- `src/`: Código-fonte do frontend.
  - `src/App.tsx`: **O Monolito** – Contém quase toda a lógica de UI, estado e componentes.
  - `src/api.ts`: Helper de comunicação com o backend.
- `server.ts`: Ponto de entrada do backend e servidor de desenvolvimento Vite.

## 4. Pontos de Entrada
- **API/Server**: `server.ts` – Inicializa o Express, o Prisma e o middleware do Vite.
- **Frontend**: `src/main.tsx` – Renderiza a raiz do React no `index.html`.
- **Rotas principais (Backend)**:
  - `/api/profile`: Perfil do usuário.
  - `/api/posts`: Feed da comunidade.
  - `/api/gemini`: Proxy para IA.
  - `/api/itineraries`: (Planejado/Prisma).

## 5. Mapa dos Módulos / Domínios
### [UI Monolith] src/App.tsx
- **Responsabilidade**: Interface do usuário, navegação interna, lógica de mapas e interação com IA.
- **Entradas**: Dados da API (perfil, posts) e input do usuário (chat, formulários).
- **Saídas**: Chamadas de rede para o backend.
- **Riscos**: Acoplamento extremo; dificuldade de teste unitário.

### [API Proxy] server.ts
- **Responsabilidade**: CRUD de dados, proxy para Gemini API, autenticação (mock) e upgrade.
- **Dependências**: Prisma Client, Express, Vite, Google AI.
- **Dados**: Produz e consome JSON via endpoints REST.

### [Data Persistence] prisma/schema.prisma
- **Responsabilidade**: Definição da estrutura de dados no Postgres.
- **Entidades**: `User`, `Post`, `Comment`, `Itinerary`, `Day`, `Stop`, `Seal`, `Favorite`.
- **Regra**: Todo o schema reside em `navegantes`.

## 6. Fluxos Principais
### Fluxo de Geração de Roteiro
1. Usuário solicita roteiro via Chat ou aba Roteiros no `App.tsx`.
2. Frontend chama `callGeminiProxy`.
3. Backend (`server.ts`) envia prompt para Gemini Pro com API Key segura.
4. Gemini retorna JSON com itinerário.
5. Frontend renderiza o roteiro e permite salvar no banco via Prisma.

### Fluxo de Criação de Memória (Post)
1. Usuário seleciona imagem e escreve texto no `App.tsx`.
2. O dado é enviado para `POST /api/posts`.
3. O backend persiste no banco e o feed é atualizado via re-fetch.

## 7. Integrações Externas
- **Google Maps API**: Renderiza mapas e marcadores no frontend.
- **Google Gemini Pro**: Cérebro da aplicação para roteiros e assistência.
- **Capacitor**: Ponte entre a webview e as APIs nativas do Android.

## 8. Regras de Negócio Relevantes
- **Passaporte (Gamification)**: Ações como favoritar locais geram "Selos" automático (`stampPassport`).
- **Premium/Credits**: O app utiliza um sistema de créditos para geração de roteiros, liberado para usuários Premium.
- **Multimodal (Mundo vs Brasil)**: O app chaveia conjuntos de dados e estilos de mapa baseados no modo selecionado.

## 9. Observações, Riscos e Acoplamentos
- **Acoplamento**: A lógica de navegação e componentes visuais estão todos fundidos no `App.tsx`, tornando mudanças na interface perigosas sem revisão cuidadosa.
- **Hardcoding**: A dependência de `userId: 1` é onipresente.
- **Inconsistência DB**: O projeto usa SQLite para desenvolvimento (`prisma/dev.db`), mas o schema oficial exige PostgreSQL.

## 10. Lacunas de Conhecimento
- O sistema de autenticação real ainda não foi definido (Firebase, Auth.js ou Supabase Auth).
- A política de faturamento da API Google Maps para produção precisa de revisão (limites/restrições).
