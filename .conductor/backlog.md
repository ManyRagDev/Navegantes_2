# Backlog Mestre e Plano de Implementação

Este documento centraliza a visão de evolução técnica e estratégica do produto **Navegantes**.
Serve para orientar agentes e desenvolvedores sobre:
- O estado atual da infraestrutura técnica.
- As próximas prioridades técnicas (Infraestrutura/Arquitetura).
- O backlog de produto estruturado em Fases (Maturidade).

---

## 1. Status da Arquitetura Alvo e Infraestrutura
**Estado Atual:**
- Frontend: `React + Vite`
- Mobile shell: `Capacitor Android` (base gerada e sincronizada)
- Backend: `Express` (Pendente de deploy no Railway)
- Banco de Dados: `Supabase Postgres` configurado no schema `navegantes`.
- ORM: `Prisma` (usado para migração, enquanto Supabase JS é usado para queries).

**Principais Pendências Técnicas Imediatas:**
1. Remover qualquer exposição de secret no frontend (`GEMINI_API_KEY` etc).
2. Configurar `DATABASE_URL` real do Supabase e aplicar as migrations no ambiente remoto.
3. Publicar o backend no Railway com HTTPS.
4. Conectar o app mobile ao backend publicado via `VITE_API_BASE_URL`.
5. Validar o app no Android Studio e gerar o primeiro `APK`/`AAB`.

---

## 2. Estrutura do Banco no Supabase
Regra obrigatória: Tudo deve ser criado exclusivamente no schema `navegantes` (não usar `public`).
Relacionamentos previstos:
- `users`: Usuário principal, créditos e status premium.
- `posts` / `comments`: Feed da comunidade (memórias).
- `itineraries` / `days` / `stops`: Roteiros gerados.
- `seals`: Gamificação e carimbos.
- `favorites`: Locais curados pelo usuário.

*(Consulte `prisma/schema.prisma` para modelagem completa).*

---

## 3. Macro-Ordem Recomendada (Visão de Produto)

Toda priorização do Navegantes deve obedecer a estes filtros:
1. Reforça o core do produto? (curadoria, roteiros, experiência).
2. Aumenta uso real em viagem?
3. Ajuda a monetizar?
4. Reduz risco técnico?

### FASE 1 — CORE UTILIZÁVEL E CONFIÁVEL
Objetivo: o usuário conseguir descobrir lugares, gerar roteiro e usar o mapa com confiança.
- Modularizar a aba Mapa (lazy load, otimização de custo Google Maps).
- Refinar a experiência "Perto de Mim" (Hero feature).
- Estruturar a geração de roteiros pela IA.
- Organizar frontend por domínios (`App.tsx` refactor).
- Fechar definição conceitual de fluxos Free vs Premium.

### FASE 2 — USUÁRIO REAL E PERSISTÊNCIA CONFIÁVEL
Objetivo: sair do mock (`userId: 1`), criar conta e ter persistência confiável.
- Implementar Autenticação (Recomendado: Supabase Auth).
- Migrar lógicas mockadas (perfil, favoritos, posts, roteiros).
- Preparar upload/storage de imagens (Supabase Storage).
- Estruturar preferências do perfil para melhor personalização de IA.

### FASE 3 — ANALYTICS E MEDIÇÃO DE PRODUTO
Objetivo: saber o que as pessoas fazem, medir ativação e intenção de compra.
- Escolher ferramenta de analytics (ex: PostHog).
- Instrumentar eventos (app aberto, roteiro gerado, clique em premium).
- Definir métricas oficiais de retenção.

### FASE 4 — MONETIZAÇÃO
Objetivo: vender o primeiro plano/passe com proposta clara.
- Definir a oferta premium (Anual, passes).
- Desenhar fluxo e tela de paywall.
- Integrar gateway de pagamentos (Stripe/Mercado Pago).
- Medir conversões e comportamento pós-compra.

### FASE 5 — COMUNIDADE E RETENÇÃO FORTE
Objetivo: transformar uso pontual em retorno contínuo.
- Estruturar o feed focado em relatos/resenhas úteis.
- Mecanismos de recompensa para contribuições valiosas (gamificação avançada).
- Funcionalidades pós-viagem (resumo, melhores momentos).

### FASE 6 — ESCALA, OFFLINE E REFINAMENTO
Objetivo: tornar o app resiliente, rápido e leve.
- Melhorar cache e suporte offline (IndexedDB, PWA service workers).
- Code splitting e diminuição do bundle mobile.
- Adaptar IA contextualmente pelo momento da viagem em tempo real.
- Considerar plataforma iOS.

---

## 4. O que NÃO deve entrar agora
- Carteira de bilhetes/passagens.
- Recursos sociais complexos presenciais entre usuários (meetups locais).
- Expansão internacional precoce.
