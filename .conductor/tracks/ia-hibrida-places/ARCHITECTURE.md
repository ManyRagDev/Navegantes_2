# Architecture - Orquestracao Hibrida do Capitao

## Visao Geral

O backend passa a atuar como orquestrador soberano. O frontend deixa de decidir implicitamente pela combinacao de prompt e provider.

Fluxo alvo:

1. frontend envia mensagem e contexto
2. backend classifica a intencao com Groq
3. backend valida a classificacao com regras deterministicas
4. backend executa o plano:
   - Google Places para fatos geoespaciais
   - Groq para copy curta ou enriquecimento rapido
   - Pollinations para respostas profundas
5. backend devolve resposta estruturada e texto final

## Componentes

### Frontend

Responsabilidades:

- capturar mensagem do usuario
- enviar contexto minimo
- exibir resposta textual e cards estruturados
- mostrar loading progressivo e estados de fallback

Nao deve:

- decidir provider
- conter segredos
- concentrar heuristicas complexas de intencao

### Backend - Roteador

Responsabilidades:

- consolidar contexto da requisicao
- classificar intent
- definir executor
- normalizar contratos
- aplicar cache
- registrar trace basico da execucao

### Google Places

Responsabilidades:

- nearby search
- detalhes de local
- eventualmente geocoding/reverse geocoding conforme API escolhida no projeto

### Groq

Responsabilidades:

- classificacao estruturada de intencao
- respostas curtas
- enriquecimento textual de listas reais

### Pollinations

Responsabilidades:

- narrativa aprofundada
- roteiro mais complexo
- explicacoes e comparacoes mais ricas

## Decisoes Arquiteturais

### 1. `city_lookup` deixa de ser LLM

Motivo:

- a tarefa e factual e quase deterministica
- reduz duas fontes de erro: latencia e alucinacao

### 2. O frontend consome contratos estaveis

Motivo:

- facilitar evolucao interna do backend sem reescrever `App.tsx`

### 3. Uma persona, multiplos executores

Motivo:

- o Capitao precisa parecer um so agente para o usuario

Implicacao:

- prompts base compartilhados
- tom curto e retro em respostas utilitarias
- style guide centralizado no backend

### 4. Fallback por seguranca de UX

Motivo:

- e melhor pedir esclarecimento do que responder errado com conviccao

## Estrutura de Modulos Sugerida

Arquivos novos sugeridos:

- `server/ai/router.ts`
- `server/ai/intents.ts`
- `server/ai/providers/groq.ts`
- `server/ai/providers/pollinations.ts`
- `server/places/googlePlaces.ts`
- `server/places/ranking.ts`
- `server/geo/geocode.ts`
- `server/cache/nearbyCache.ts`

Observacao:

- o nome exato pode variar, mas a logica nova nao deve crescer dentro de `src/App.tsx`

## Estrategia de Cache

### Nearby search

Chave sugerida:

- geohash ou lat/lng arredondado + categoria + faixa horaria + modo

TTL sugerido:

- 10 a 30 minutos para nearby search

### Place details

TTL sugerido:

- 6 a 24 horas, conforme campos utilizados

## Estrategia de Rollout

Plano detalhado:

- `.conductor/tracks/ia-hibrida-places/EXECUTION_PLAN.md`

### Fase 1

- integrar places
- integrar classificador
- manter rotas antigas

### Fase 2

- migrar saudacao inicial
- migrar fluxo "perto de mim"

### Fase 3

- migrar conversa geral com roteamento
- migrar planejamento de roteiro

### Fase 4

- remover heuristicas legadas baseadas em prompt no frontend

## Decisoes Abertas

- usar Places API classica ou Places API New
- nivel de persistencia de cache
- estrategia de telemetria
- se `POST /api/ai` sera evoluida ou se nasce uma nova rota `POST /api/ai/chat`
