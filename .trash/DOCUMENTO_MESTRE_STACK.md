# DOCUMENTO_MESTRE_STACK.md - Navegantes

Este documento consolida a stack tecnológica do **Navegantes**, separando:

- stack atual em produção/desenvolvimento
- componentes legados ainda presentes no repositório
- stack alvo para próximas implementações

Ele complementa:

- `DOCUMENTO_MESTRE.md` para visão técnica e arquitetura atual
- `DOCUMENTO_MESTRE_PRODUTO_NEGOCIO.md` para visão de produto e negócio

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

## 2.1 Frontend Web

### Base

- `React 19`
- `TypeScript`
- `Vite 6`

### UI e estilização

- `Tailwind CSS 4`
- classes utilitárias diretamente no frontend
- tokens visuais e estilos auxiliares definidos no próprio `App.tsx`
- fontes externas via `Google Fonts`

### Ícones e animações

- `lucide-react`
- `motion` para animações

### Mapa

- `@react-google-maps/api`
- Google Maps JavaScript API

### Estado atual da arquitetura frontend

- SPA client-side
- renderização 100% CSR
- `src/App.tsx` ainda concentra boa parte da UI e lógica

---

## 2.2 Backend / API

### Base

- `Node.js`
- `Express 4`
- `TypeScript`
- `tsx` para execução em desenvolvimento

### Papel atual do backend

- servir API do app
- servir frontend em desenvolvimento com Vite middleware
- servir `dist` em produção
- encapsular chamadas de IA
- centralizar segredos server-side
- mediar acesso a dados

### Arquivo principal

- `server.ts`

---

## 2.3 Banco de Dados e Persistência

### Banco ativo

- `Supabase`
- PostgreSQL
- schema exclusivo `navegantes`

### Acesso a dados atualmente em uso

- `@supabase/supabase-js`
- acesso server-side via `SUPABASE_SERVICE_ROLE_KEY`
- camada de acesso em `serverData.ts`

### Observação importante

Embora o projeto ainda tenha Prisma no repositório, a camada de dados ativa das rotas principais hoje está baseada em **Supabase direto**, não em Prisma Client.

---

## 2.4 ORM / Modelagem

### Presente no repositório

- `Prisma`
- `@prisma/client`

### Papel atual

- documentação estrutural do schema
- referência histórica de modelagem

### Estado real de uso

- não é a principal camada ativa de acesso a dados no backend atual

---

## 2.5 Mobile

### Base

- `Capacitor 8`
- `@capacitor/android`

### Plataforma atual preparada

- Android

### Modelo atual

- app híbrido
- `dist/` empacotado no app nativo
- consumo de API remota via `VITE_API_BASE_URL`

---

## 2.6 IA

### Provider abstrato atual

O backend já opera com uma camada unificada de IA.

### Providers atualmente previstos

- `Pollinations`
- `Gemini`

### SDK presente

- `@google/genai`

### Papel da IA hoje

- sugestões
- saudação/contexto
- identificação de local
- curadoria textual
- geração de roteiros simples

---

## 2.7 Infraestrutura e Deploy

### Backend público

- Railway

### Frontend mobile

- build Vite + sync via Capacitor

### Configuração de ambiente

- `.env`
- variáveis `VITE_*` para frontend
- variáveis server-side para backend e integrações

---

## 2.8 APIs e Serviços Externos

### Em uso atual

- Google Maps JavaScript API
- Google Maps Directions
- Supabase
- providers de IA

### Recursos externos auxiliares

- Google Fonts
- Transparent Textures

---

## 3. Dependências Relevantes Atuais

As principais dependências atuais do projeto são:

- `react`
- `react-dom`
- `typescript`
- `vite`
- `express`
- `cors`
- `dotenv`
- `tsx`
- `@react-google-maps/api`
- `@supabase/supabase-js`
- `prisma`
- `@prisma/client`
- `@capacitor/core`
- `@capacitor/android`
- `lucide-react`
- `motion`
- `@google/genai`

---

## 4. Legados e Ambiguidades Atuais

## 4.1 Prisma x Supabase

Hoje existe uma dualidade no repositório:

- Prisma define o schema histórico
- Supabase direto é a camada realmente usada

### Diretriz

Enquanto essa situação existir, toda decisão estrutural deve deixar explícito:

- o que é fonte de verdade de modelagem
- o que é fonte de verdade de acesso a dados

No estado atual:

- modelagem de referência: Prisma
- acesso real em runtime: Supabase direto

---

## 4.2 Monolito do Frontend

`src/App.tsx` ainda é um ponto de concentração de:

- navegação
- estado global
- mapa
- IA
- comunidade
- perfil
- roteiro

### Implicação

A stack atual é funcional, mas a organização do frontend ainda não acompanha a complexidade do produto.

---

## 4.3 Google Maps

O projeto usa `@react-google-maps/api` com Google Maps JS API.

### Situação atual

- funciona
- já foi estabilizado no layout
- ainda pode ser otimizado em peso e modularidade

### Observação

Há espaço para reduzir custo e payload removendo bibliotecas não usadas e fazendo lazy load da aba mapa.

---

## 5. Stack Alvo - Próximas Implementações

Esta seção distingue:

- direções recomendadas
- itens prováveis
- itens ainda em validação

---

## 5.1 Frontend Alvo

### Manter

- React
- TypeScript
- Vite
- Tailwind CSS

### Evoluir para

- frontend modularizado por domínio
- extração de telas/abas para componentes próprios
- extração de hooks de dados e hooks de UI
- redução do acoplamento de `App.tsx`

### Estrutura alvo sugerida

- `src/components/`
- `src/features/map/`
- `src/features/itinerary/`
- `src/features/community/`
- `src/features/profile/`
- `src/features/ai/`
- `src/lib/`
- `src/hooks/`

---

## 5.2 Dados / Backend Alvo

### Caminho recomendado de curto e médio prazo

Manter:

- PostgreSQL/Supabase
- backend próprio em Express

### Objetivo

Consolidar uma única estratégia de acesso a dados.

### Opção recomendada

Escolher formalmente uma destas abordagens:

1. `Supabase direto como padrão oficial`
2. `Prisma como padrão oficial com Supabase apenas como banco`

### Recomendação pragmática atual

Se o foco for velocidade e menor refatoração imediata:

- manter Supabase direto no backend
- usar Prisma apenas como documentação estrutural temporária

Se o foco for governança de schema e padronização futura:

- migrar gradualmente para Prisma como camada oficial

### Estado recomendado para próximas features

Até haver decisão formal, evitar ampliar a ambiguidade.

---

## 5.3 Autenticação

### Estado atual

- `userId: 1` mockado

### Necessidade futura

Autenticação real é obrigatória para:

- comunidade confiável
- perfis reais
- histórico de viagem por usuário
- monetização consistente
- sincronização entre dispositivos

### Opções possíveis

- Supabase Auth
- Firebase Auth
- Auth.js

### Recomendação estratégica atual

Como o projeto já usa Supabase, a opção mais coerente para reduzir fricção é:

- **Supabase Auth**

Isso diminui dispersão de stack e aproveita a infraestrutura existente.

---

## 5.4 Mapa

### Stack atual

- Google Maps JS + `@react-google-maps/api`

### Evolução recomendada de curto prazo

- lazy load da aba mapa
- remoção de bibliotecas Google não utilizadas
- extração da aba para componente próprio

### Evolução recomendada de médio prazo

- avaliar `importLibrary()` modular
- reduzir custo de carregamento
- separar preview leve e mapa interativo

### Visual retrô

O visual retrô atual não depende de uma biblioteca externa específica de mapas. Ele vem de:

- `MAP_STYLES` customizados
- UI própria
- textura overlay
- tipografia e branding do app

### Futuro possível

Se custo de mapa virar prioridade maior:

- avaliar preview estático
- avaliar MapLibre/Leaflet em cenário futuro

Mas isso não é prioridade imediata.

---

## 5.5 IA

### Stack alvo

Manter a IA desacoplada por backend, com uma camada de abstração entre:

- frontend
- operações do produto
- provider real

### Direção recomendada

Organizar IA por operações de negócio, não por provider.

Exemplos:

- curadoria local
- geração de roteiro
- adaptação de roteiro
- resumo de bairro/região
- memória da viagem

### Recomendação

Continuar evitando chamadas diretas do frontend para providers.

---

## 5.6 Mobile

### Curto prazo

- manter Capacitor Android

### Médio prazo

- melhorar estabilidade mobile
- reduzir peso do bundle
- fortalecer offline e cache local

### Futuro plausível

- iOS via Capacitor

Não parece prioridade antes da consolidação do core no Brasil e Android/Web.

---

## 5.7 Offline e Cache

### Estado atual

- service worker simples
- PWA parcial

### Stack alvo recomendada

Adicionar capacidade mais séria de:

- cache de roteiros
- favoritos offline
- últimas memórias
- dados mínimos do mapa/curadoria

### Possíveis ferramentas futuras

- IndexedDB
- cache local orientado por domínio
- sincronização posterior

Não precisa decidir biblioteca agora, mas isso é eixo importante para experiência de viagem real.

---

## 5.8 Analytics e Produto

### Estado atual

- não há uma camada clara de analytics de produto consolidada no código

### Necessidade futura

Para validar crescimento, ativação e monetização, o produto precisará de analytics.

### Eventos prioritários futuros

- instalação
- abertura do app
- primeiro roteiro gerado
- local salvo
- memória criada
- rota iniciada
- upgrade visualizado
- upgrade comprado

### Ferramentas possíveis

- PostHog
- Mixpanel
- Amplitude
- analytics próprio simplificado

### Recomendação

Para estágio atual, `PostHog` tende a ser uma boa opção entre custo, flexibilidade e velocidade.

---

## 5.9 Pagamentos

### Estado atual

- ainda não implementado de forma real

### Necessidade futura

Obrigatório para:

- plano anual
- passe por viagem
- créditos

### Opções futuras

- Stripe
- Mercado Pago
- gateway híbrido por região

### Recomendação inicial

Para Brasil, avaliar com seriedade:

- Stripe, se a operação atender bem ao fluxo desejado
- Mercado Pago, se a prioridade for aderência local e meios de pagamento brasileiros

Este ponto depende de estratégia comercial e distribuição.

---

## 5.10 Conteúdo e Mídia

### Estado atual

- imagens majoritariamente externas
- avatares e fotos de demonstração

### Necessidade futura

O app precisará de stack clara para:

- upload de imagens de usuários
- armazenamento de memórias
- moderação de conteúdo

### Opção coerente com a stack atual

- Supabase Storage

Isso preserva coerência com o banco e reduz dispersão.

---

## 6. Stack Recomendada por Horizonte

## 6.1 Agora

Manter:

- React
- TypeScript
- Vite
- Tailwind
- Express
- Supabase
- Google Maps
- Capacitor Android

Fazer:

- modularizar frontend
- otimizar mapa
- formalizar camada de dados

---

## 6.2 Próxima Fase

Adicionar:

- autenticação real
- analytics
- pagamentos
- storage de mídia

Recomendação de coerência:

- Supabase Auth
- Supabase Storage
- analytics dedicado
- gateway de pagamento validado para o Brasil

---

## 6.3 Fase de Escala

Avaliar:

- refino da arquitetura frontend por domínio
- revisão de provider de mapas se custo exigir
- fortalecimento de cache/offline
- infraestrutura de growth e CRM
- expansão de plataforma mobile

---

## 7. Diretrizes de Decisão de Stack

Toda nova adoção tecnológica deve responder:

1. Ela reduz complexidade ou aumenta fragmentação?
2. Ela acelera o produto ou só parece moderna?
3. Ela conversa com a stack atual ou cria mais uma ilha?
4. Ela favorece Brasil/mobile, que é o foco inicial?
5. Ela ajuda o core do produto: curadoria, roteiro, viagem real?

Se a resposta for fraca, a tecnologia não deve entrar ainda.

---

## 8. Resumo Executivo

### Stack atual real

- React + TypeScript + Vite no frontend
- Express + TypeScript no backend
- Supabase/PostgreSQL como persistência real
- Prisma como modelagem histórica/estrutural
- Google Maps JS para mapa
- Capacitor para Android
- IA mediada pelo backend

### Stack alvo mais coerente

- manter base atual
- modularizar frontend
- consolidar estratégia de dados
- adotar autenticação real
- adicionar analytics
- adicionar pagamentos
- fortalecer storage e offline

### Princípio central

O Navegantes deve crescer com stack coerente, evitando virar um mosaico de ferramentas desconexas. A tecnologia deve servir ao produto, especialmente ao core de:

- curadoria
- roteiros personalizados
- experiência prática de viagem
