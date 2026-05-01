# DOCUMENTO MESTRE STACK - Navegantes

Este documento consolida a stack tecnológica do **Navegantes**, separando:
- stack atual em produção/desenvolvimento
- componentes legados ainda presentes no repositório
- stack alvo para próximas implementações

Ele complementa:
- `.conductor/rules.md` para visão técnica e arquitetura atual
- `.conductor/product.md` para visão de produto e negócio

---

## 1. Objetivo
Evitar ambiguidade sobre:
- o que o projeto usa hoje de fato
- o que ainda existe apenas como herança técnica
- quais tecnologias devem ser adotadas nas próximas fases

Este documento deve ser consultado antes de:
- trocar providers
- adicionar SDKs
- criar integrações estruturais
- iniciar refatorações grandes

---

## 2. Stack Atual

### 2.1 Frontend Web
**Base:**
- `React 19`
- `TypeScript`
- `Vite 6`

**UI e estilização:**
- `Tailwind CSS 4`
- classes utilitárias diretamente no frontend
- tokens visuais e estilos auxiliares definidos no próprio `App.tsx`
- fontes externas via `Google Fonts`

**Ícones e animações:**
- `lucide-react`
- `motion` para animações

**Mapa:**
- `@react-google-maps/api`
- Google Maps JavaScript API

**Estado atual da arquitetura frontend:**
- SPA client-side
- renderização 100% CSR
- `src/App.tsx` ainda concentra boa parte da UI e lógica

---

### 2.2 Backend / API
**Base:**
- `Node.js`
- `Express 4`
- `TypeScript`
- `tsx` para execução em desenvolvimento

**Papel atual do backend:**
- servir API do app
- servir frontend em desenvolvimento com Vite middleware
- servir `dist` em produção
- encapsular chamadas de IA
- centralizar segredos server-side
- mediar acesso a dados

**Arquivo principal:**
- `server.ts`

---

### 2.3 Banco de Dados e Persistência
**Banco ativo:**
- `Supabase`
- PostgreSQL
- schema exclusivo `navegantes`

**Acesso a dados atualmente em uso:**
- `@supabase/supabase-js`
- acesso server-side via `SUPABASE_SERVICE_ROLE_KEY`
- camada de acesso em `serverData.ts`

**Observação importante:**
Embora o projeto ainda tenha Prisma no repositório, a camada de dados ativa das rotas principais hoje está baseada em **Supabase direto**, não em Prisma Client.

---

### 2.4 ORM / Modelagem
**Presente no repositório:**
- `Prisma`
- `@prisma/client`

**Papel atual:**
- documentação estrutural do schema
- referência histórica de modelagem

**Estado real de uso:**
- não é a principal camada ativa de acesso a dados no backend atual

---

### 2.5 Mobile
**Base:**
- `Capacitor 8`
- `@capacitor/android`

**Plataforma atual preparada:**
- Android

**Modelo atual:**
- app híbrido
- `dist/` empacotado no app nativo
- consumo de API remota via `VITE_API_BASE_URL`

---

### 2.6 IA
**Provider abstrato atual:**
O backend já opera com uma camada unificada de IA.

**Providers atualmente previstos:**
- `Pollinations`
- `Gemini`
- `Groq` (Classificação + Respostas Rápidas)

**SDK presente:**
- `@google/genai`

**Papel da IA hoje:**
- sugestões
- saudação/contexto
- identificação de local
- curadoria textual
- geração de roteiros simples

---

### 2.7 Infraestrutura e Deploy
**Backend público:**
- Railway

**Frontend mobile:**
- build Vite + sync via Capacitor

**Configuração de ambiente:**
- `.env`
- variáveis `VITE_*` para frontend
- variáveis server-side para backend e integrações

---

### 2.8 APIs e Serviços Externos
**Em uso atual:**
- Google Maps JavaScript API
- Google Maps Directions
- Supabase
- providers de IA

**Recursos externos auxiliares:**
- Google Fonts
- Transparent Textures

---

## 3. Dependências Relevantes Atuais
As principais dependências atuais do projeto são:
- `react`, `react-dom`
- `typescript`, `vite`
- `express`, `cors`, `dotenv`, `tsx`
- `@react-google-maps/api`
- `@supabase/supabase-js`
- `prisma`, `@prisma/client`
- `@capacitor/core`, `@capacitor/android`
- `lucide-react`
- `motion`
- `@google/genai`

---

## 4. Legados e Ambiguidades Atuais

### 4.1 Prisma x Supabase
Hoje existe uma dualidade no repositório:
- Prisma define o schema histórico
- Supabase direto é a camada realmente usada

**Diretriz:**
Enquanto essa situação existir, toda decisão estrutural deve deixar explícito:
- o que é fonte de verdade de modelagem (Prisma)
- o que é fonte de verdade de acesso a dados (Supabase)

### 4.2 Monolito do Frontend
`src/App.tsx` ainda é um ponto de concentração de navegação, estado global, mapa, IA, comunidade, perfil e roteiro. A stack atual é funcional, mas a organização do frontend ainda não acompanha a complexidade do produto.

### 4.3 Google Maps
O projeto usa `@react-google-maps/api` com Google Maps JS API. Há espaço para reduzir custo e payload removendo bibliotecas não usadas e fazendo lazy load da aba mapa.

---

## 5. Stack Alvo - Próximas Implementações

### 5.1 Frontend Alvo
**Evoluir para:**
- frontend modularizado por domínio
- extração de telas/abas para componentes próprios
- redução do acoplamento de `App.tsx`

### 5.2 Dados / Backend Alvo
**Caminho recomendado de curto e médio prazo:**
- Manter PostgreSQL/Supabase e backend próprio em Express.
- Consolidar uma única estratégia de acesso a dados.

**Recomendação pragmática atual:**
Se o foco for velocidade: manter Supabase direto no backend e usar Prisma apenas como documentação estrutural temporária.

### 5.3 Autenticação
Autenticação real é obrigatória (Substituir `userId: 1`).
**Recomendação estratégica atual:** Supabase Auth.

### 5.4 Mapa
**Evolução recomendada:** lazy load da aba mapa e redução do custo de carregamento. O visual retrô vem de `MAP_STYLES` customizados e overlay de texturas, não depende exclusivamente do Google Maps se a migração for necessária no futuro.

### 5.5 IA
Manter a IA desacoplada por backend, com uma camada de abstração entre frontend e provider.

### 5.6 Mobile
Manter Capacitor Android. Melhorar estabilidade e cache offline. Futuro: iOS via Capacitor.

### 5.7 Offline e Cache
Adicionar capacidade mais séria de cache de roteiros, favoritos offline e memórias (e.g. IndexedDB).

### 5.8 Analytics e Produto
Implementar ferramenta de analytics (como PostHog) para medir instalação, ativação e retenção.

### 5.9 Pagamentos
Para o Brasil, Stripe ou Mercado Pago (dependendo do fluxo desejado).

### 5.10 Conteúdo e Mídia
Upload de imagens de usuários e memórias usando Supabase Storage.

---

## 6. Stack Recomendada por Horizonte

### 6.1 Agora
Manter: React + Vite, Express, Supabase, Google Maps, Capacitor Android.
Fazer: modularizar frontend, otimizar mapa, formalizar camada de dados.

### 6.2 Próxima Fase
Adicionar: Supabase Auth, Supabase Storage, Analytics dedicado, pagamentos.

### 6.3 Fase de Escala
Avaliar: arquitetura frontend, provider de mapas mais barato, growth e iOS.

---

## 7. Diretrizes de Decisão de Stack
Toda nova adoção tecnológica deve responder:
1. Ela reduz complexidade ou aumenta fragmentação?
2. Ela acelera o produto ou só parece moderna?
3. Ela conversa com a stack atual ou cria mais uma ilha?
4. Ela favorece Brasil/mobile?
5. Ela ajuda o core do produto (curadoria, roteiro)?
Se a resposta for fraca, não adotar.
