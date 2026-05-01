# Regras e Arquitetura - Operação Navegantes

Este documento é a fonte centralizada de regras arquiteturais, operacionais e de conduta para agentes de IA e desenvolvedores no projeto **Navegantes**. 

Qualquer IA (incluindo Conductor, Cline, Antigravity, etc.) deve consultar e obedecer estritamente a estas diretrizes para manter a integridade técnica e de produto.

---

## 1. Regras Operacionais para Agentes de IA

### Forma de Trabalhar
- **Responsabilidade**: Entenda o domínio do trecho antes de editar (Social, Mapas, Roteiros, IA).
- **Impactos**: Mapeie efeitos colaterais em toda a stack (Supabase -> Backend -> App.tsx).
- **Preservação**: Mantenha o comportamento existente, a menos que solicitado explicitamente.
- **Transparência**: Destaque riscos, acoplamentos frágeis e inconsistências ao usuário.

### Entregas Esperadas
Ao finalizar uma tarefa:
1. Implemente a alteração.
2. Revise os impactos de arquitetura e UI.
3. Atualize a documentação pertinente em `.conductor/` se alterar regras, stack ou produto.

---

## 2. Visão Geral da Arquitetura
O sistema segue um modelo de **App Híbrido** (Mobile-First):
- **Frontend**: Single Page Application (SPA) reativa desenvolvida em **React 19** e **Vite**.
- **Mobile Wrapper**: **Capacitor** encapsula o frontend em uma WebView nativa para Android (`com.navegantes.app`).
- **Arquitetura de Renderização**: **100% Client-Side (CSR)** no APK. O APK é estático (lê do `dist/`).
- **Backend/API**: Servidor **Node.js (Express)** rodando no Railway, que atua como API de dados e Proxy de IA.
- **Persistência**: Backend acessando **Supabase** via `@supabase/supabase-js` com credenciais server-side.

---

## 3. Regras Críticas de Desenvolvimento (Seniority)

- **KISS e DRY**: Manter o código simples; evitar sobre-engenharia. Reutilizar lógica de UI (cores, SVGs retrô) e helpers de API.
- **Clean Code**: Nomes de variáveis em português/inglês conforme o contexto (domínio Navegantes).
- **Schema `navegantes` (CRÍTICO)**: Toda persistência, consulta ou migração no Postgres DEVE utilizar e estar dentro do schema `navegantes`.
- **Segurança (Backend First)**: Nenhuma chave de API (Gemini, Groq, Supabase, Google Places) deve ser exposta no frontend. Elas ficam exclusivamente no backend (`server.ts`).
- **Acesso à API**: Todas as chamadas do frontend para o backend devem usar o helper `apiUrl` de `src/api.ts`.
- **Mock de Usuário Padrão**: Na fase atual, assume-se `userId: 1` para todas as persistências até que a autenticação real seja implementada.
- **Aparência Retrô**: Manter a paleta de cores (`#f3ecdb`, `#b45a35`, etc.) e fontes retrô em novos componentes.

---

## 4. Estrutura do Projeto
- `android/`: Código-fonte nativo gerado pelo Capacitor.
- `prisma/`: Definição histórica/estrutural (schema `navegantes`) e banco SQLite legado (`dev.db`).
- `src/`:
  - `src/App.tsx`: **O Monolito** – Contém roteamento interno, estado global e componentes base. **NÃO ADICIONE NOVAS LOGICAS COMPLEXAS NESTE ARQUIVO.**
  - `src/api.ts`: Helper para URLs da API (Localhost vs Railway).
  - `src/components/` & `src/features/`: Componentes extraídos para reduzir acoplamento.
- `server.ts`: Servidor Express e ponto de entrada do backend.
- `serverData.ts`: Camada de acesso a dados via Supabase.
- `server/ai/`: Módulos de IA híbrida (router, intents, providers).
- `server/geo/` e `server/places/`: APIs de descoberta e geocodificação server-side.

---

## 5. Endpoints da API (Visão Geral)

### IA Híbrida (Router + Provedores)
- `POST /api/ai/route`: Classificador de intenção via `classifyAIIntent` (Places, Groq, Pollinations).
- `POST /api/ai/chat`: Resposta do assistente "Capitão", roteada dinamicamente entre modelos rápidos (Groq) e profundos (Pollinations).
- `POST /api/places/nearby`: Curadoria editorial e ranking próprio sobre lugares.

### Dados e Perfil
- `GET / PUT /api/profile`: Gerencia os dados do `userId: 1`.
- `POST /api/upgrade`: Upgrade para Premium/Créditos.
- `GET / POST /api/posts`: Feed da comunidade (Comentários ainda são majoritariamente geridos localmente no frontend).
- `POST /api/seals` & `POST /api/favorites`: Gamificação e curadoria pessoal.

*(Nota: Roteiros criados no app ainda não possuem persistência backend completa, salvando no estado local do frontend.)*

---

## 6. Fluxos Críticos e IA
- **Geolocalização**: O app usa a localização do usuário para sugerir atividades reais.
- **Operações de IA (Híbrida)**:
  - **Facts first**: Descoberta de lugares e geocoding via APIs factuais (Google Places) no backend.
  - **Roteador soberano**: O backend decide a intenção (via `classifyAIIntent`).
  - **Modelo rápido (Groq)**: Baixa latência, saudação inicial, curadoria editorial e filtros.
  - **Modelo profundo (Pollinations)**: Raciocínio pesado, histórias de bairro, roteiros.
  - **Curadoria Editorial Unificada**: Avalia se o local é um destino memorável, não apenas uma conveniência, devolvendo razões editoriais curtas por local.

---

## 7. Dívida Técnica e Refatorações Esperadas
- **Aceleração do `App.tsx`**: Ao receber tarefas de novas telas ou lógicas de UI, você DEVE externalizar para `src/components/` ou arquivos separados. Reduza o acoplamento do App.tsx movendo lógicas e SVG mocks para arquivos dedicados.
- **Mito do SSR**: O rendering é 100% Client-Side no mobile. O excesso de lógica no JS bloqueia a abertura do app nativo. Priorize leveza no bundle inicial.
- **Dualidade de Banco**: O Prisma dita o design do schema (histórico/documental), mas a comunicação real em runtime é feita diretamente via cliente do Supabase (`serverData.ts`). Respeite ambos.

---

## 8. Regras de Ambiente
- **Desenvolvimento local**: `VITE_API_BASE_URL` vazio em `.env.local` (Vite roteia para `/api/...` localmente).
- **Produção / Mobile**: `VITE_API_BASE_URL` deve ter a URL pública do backend Railway.
- **Backend / Supabase**: Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no Railway. O uso direto de `DATABASE_URL` via Prisma client está em fallback/depreciação em relação ao Supabase JS no backend ativo.
