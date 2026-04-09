# Execution Plan - IA Hibrida com Places

## Objetivo

Executar a trilha de IA hibrida do Navegantes com baixo risco de regressao, preservando compatibilidade com o app atual enquanto a arquitetura nova e introduzida no backend.

## Premissas

- a orquestracao principal deve nascer no backend
- `src/App.tsx` nao deve receber nova logica complexa
- rotas legadas podem coexistir temporariamente
- fatos geograficos deixam de depender de LLM
- Groq e Pollinations devem compartilhar a mesma persona do Capitao

## Estrategia de Entrega

- primeiro criar infraestrutura e contratos no backend
- depois migrar fluxos de maior impacto em UX
- por fim remover heuristicas legadas do frontend

## Fase 0 - Preparacao e Contratos

### Objetivo

Fechar os contratos e limites da nova arquitetura antes de integrar providers.

### Backend

- definir schema de `IntentClassification`
- definir schema de `NearbyPlace`
- definir schema da resposta de `POST /api/ai/chat`
- definir enumeracoes de intents, executores e fallbacks
- centralizar prompt base/persona do Capitao

### Frontend

- mapear onde `App.tsx` hoje assume heuristicas de prompt
- identificar os fluxos que precisam continuar compativeis durante a migracao

### Entregas

- contratos documentados
- tipos iniciais do backend definidos
- decisao se `POST /api/ai` sera estendida ou se `POST /api/ai/chat` nascera paralela

### Criterio de Saida

- backend e frontend sabem qual payload enviar e qual resposta esperar

## Fase 1 - Base Server-Side de Places e Geocode

### Objetivo

Tirar fatos geograficos do pipeline de LLM.

### Backend

- criar modulo `server/places/googlePlaces.ts`
- criar modulo `server/geo/geocode.ts`
- implementar busca nearby no backend
- implementar reverse geocoding para cidade/regiao
- normalizar resposta de places para o formato do Navegantes
- adicionar cache de nearby e place details

### `server.ts`

- adicionar `POST /api/places/nearby`
- adicionar rota factual para geocode, se necessario
- manter `POST /api/ai` legada sem quebra

### Frontend

- nenhum acoplamento novo complexo
- preparar consumo de cidade por rota factual em vez de `callAI`

### Criterio de Saida

- o backend consegue responder "o que existe perto" e "onde estou" sem LLM

## Fase 2 - Classificador de Intencao com Groq

### Objetivo

Criar o mediador semantico leve que decide a rota de execucao.

### Backend

- criar modulo `server/ai/providers/groq.ts`
- criar modulo `server/ai/intents.ts`
- implementar classificacao com saida JSON rigidamente estruturada
- aplicar validacao server-side da resposta do classificador
- definir regras de confianca e fallback

### `server.ts`

- adicionar `POST /api/ai/route` ou equivalente interno
- registrar `intent`, `confidence`, `executor` e `fallbackReason`

### Guardrails

- baixa confianca nao pode ir direto para resposta profunda
- intents factuais devem obrigar uso de places quando aplicavel
- intents sem contexto suficiente devem gerar clarificacao curta

### Criterio de Saida

- cada mensagem do usuario pode ser classificada em intent operacional reutilizavel

## Fase 3 - Chat Orquestrado no Backend

### Objetivo

Criar a rota unificada que usa o classificador e escolhe executor.

### Backend

- criar modulo `server/ai/router.ts`
- criar ou adaptar `server/ai/providers/pollinations.ts`
- plugar Groq, Pollinations e Places em um roteador central
- implementar combinacao `places + groq` para respostas rapidas baseadas em dados reais
- implementar combinacao `context + pollinations` para consultas profundas

### `server.ts`

- criar `POST /api/ai/chat`
- devolver resposta com:
  - `intent`
  - `confidence`
  - `executor`
  - `text`
  - `data`
  - `trace` opcional em ambiente de desenvolvimento

### Compatibilidade

- `POST /api/ai` continua ativa durante a migracao
- heuristicas legadas do frontend continuam funcionais ate a fase 5

### Criterio de Saida

- o backend ja responde conversa simples, nearby e consultas profundas pela nova rota

## Fase 4 - Migracao dos Fluxos de Maior Impacto

### Objetivo

Ganhar UX perceptivel sem refatoracao ampla inicial.

### Prioridade 1 - Saudacao Inicial

#### Backend

- trocar `city_lookup` por geocode factual
- gerar saudacao curta via Groq

#### Frontend

- exibir copy local imediata
- substituir o segundo passo por chamada da rota nova
- manter fallback local se a resposta nao chegar

### Prioridade 2 - "Perto de Mim"

#### Backend

- usar places nearby + ranking
- opcionalmente adicionar resumo curto via Groq

#### Frontend

- consumir cards estruturados em vez de texto puro
- manter rendering simples e leve

### Prioridade 3 - Conversa do Capitao

#### Backend

- enviar pergunta para o roteador
- usar Groq para follow-up simples
- usar Pollinations para explicacao mais profunda

#### Frontend

- trocar `callAI("openai", prompt...)` por chamada orientada a contrato

### Criterio de Saida

- os dois maiores gargalos de UX ja estao na arquitetura nova

## Fase 5 - Migracao de Roteiros e Remocao do Legado

### Objetivo

Mover os fluxos restantes e reduzir a dependencia de inferencia por prompt.

### Backend

- migrar `itinerary_suggestions` para usar roteador + places quando fizer sentido
- revisar `dashboard_suggestions`
- revisar `quick_suggestions`

### Frontend

- remover `inferLegacyOperation`
- remover `inferLegacyInput`
- reduzir o uso de prompts hardcoded para controle de fluxo

### Criterio de Saida

- o frontend para de decidir operacoes por texto

## Fase 6 - Observabilidade e Otimizacao

### Objetivo

Controlar custo, latencia e erros antes de expandir a arquitetura.

### Backend

- medir latencia por etapa
- medir taxa de fallback
- medir erro por provider
- medir cache hit rate
- revisar limites e quotas

### Produto

- revisar se a classificacao esta errando intents recorrentes
- revisar se a persona do Capitao continua consistente
- ajustar ranking do modo explorador

### Criterio de Saida

- equipe consegue operar a arquitetura com visibilidade suficiente

## Ordem Recomendada de Implementacao em Arquivos

1. `server/ai/intents.ts`
2. `server/ai/providers/groq.ts`
3. `server/places/googlePlaces.ts`
4. `server/geo/geocode.ts`
5. `server/cache/nearbyCache.ts`
6. `server/ai/router.ts`
7. `server.ts`
8. `src/components/` para novos blocos do Guia IA
9. `src/App.tsx` apenas para integrar os novos componentes e contratos

## Sequencia Recomendada de PRs ou Blocos

1. PR de contratos e tipos
2. PR de Places e geocode
3. PR de classificador Groq
4. PR de rota unificada de chat
5. PR de migracao da saudacao inicial
6. PR de migracao do "perto de mim"
7. PR de migracao da conversa geral
8. PR de limpeza do legado

## Riscos de Implementacao

- tentar migrar todos os fluxos de uma vez
- deixar o frontend continuar inferindo intent por prompt por muito tempo
- acoplar persona em varios pontos sem fonte unica
- chamar Pollinations em rotas que deveriam ser somente factuais

## Definicoes de Pronto por Fase

### Fase 1 pronta

- geocode e nearby funcionam sem LLM

### Fase 2 pronta

- classificador devolve JSON valido e roteavel

### Fase 3 pronta

- nova rota de chat entrega resposta unificada

### Fase 4 pronta

- saudacao inicial e "perto de mim" estao migrados

### Fase 5 pronta

- frontend nao depende mais de inferencia legada por prompt

### Fase 6 pronta

- latencia, fallback e custo estao observaveis
