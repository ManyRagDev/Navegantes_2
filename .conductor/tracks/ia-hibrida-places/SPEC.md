# Spec - IA Hibrida com Places e Roteador de Intencao

## Problema

O Navegantes hoje trata descoberta de lugares, geolocalizacao semantica e conversa do Capitao como variacoes do mesmo pipeline de LLM. Isso aumenta latencia, custo e fragilidade factual.

## Hipotese

Se o app separar fatos de narrativa, usando Places para descoberta geoespacial, Groq para classificacao e respostas rapidas, e Pollinations para respostas profundas, a experiencia sera mais fluida sem perder personalidade.

## Principios

1. Facts first.
2. Backend sovereign.
3. LLM para interpretar e narrar, nao para inventar fatos proximos.
4. Frontend leve; logica de orquestracao fica no backend.
5. Fallbacks explicitos sao melhores que respostas erradas.

## Casos de Uso Alvo

### 1. Saudacao inicial

Entrada:

- usuario abre a aba do Guia IA
- app tem ou nao tem geolocalizacao

Comportamento esperado:

- o frontend exibe uma mensagem local imediata
- o backend resolve cidade por geocoder, nao por LLM
- Groq gera uma saudacao curta e contextual
- se Groq falhar, o app usa copy local de fallback

### 2. O que tem perto de mim

Entrada:

- usuario pede lugares proximos
- app envia coordenadas, contexto e filtros basicos

Comportamento esperado:

- backend chama Google Places
- backend aplica ranking deterministico do Navegantes
- Groq pode resumir a lista em linguagem do Capitao
- resposta final inclui dados estruturados e texto opcional

### 3. Consulta sobre bairro ou contexto historico

Entrada:

- usuario pergunta sobre historia, clima cultural ou contexto de uma regiao

Comportamento esperado:

- classificador detecta intencao narrativa ou contextual
- backend pode combinar contexto factual disponivel com Pollinations
- resposta prioriza narrativa e explicacao

### 4. Planejamento de roteiro

Entrada:

- usuario pede um roteiro

Comportamento esperado:

- se houver lugares reais disponiveis, usar como insumo
- Pollinations gera encadeamento e justificativa
- Groq nao deve ser responsavel principal por planejamento mais profundo

## Intents Operacionais

Conjunto inicial:

- `nearby_discovery`
- `place_detail`
- `neighborhood_story`
- `itinerary_planning`
- `comparison`
- `quick_followup`
- `smalltalk`
- `clarification`

## Contrato de Classificacao

Saida esperada do classificador:

```json
{
  "intent": "nearby_discovery",
  "confidence": 0.93,
  "needsPlacesSearch": true,
  "needsDeepModel": false,
  "locationScope": "current_location",
  "placeQuery": "cafes historicos",
  "clarificationQuestion": ""
}
```

## Regras de Roteamento

### Nearby

- executor principal: codigo + Google Places
- enriquecimento opcional: Groq
- Pollinations: nao

### Place detail

- executor principal: codigo + Place Details
- enriquecimento opcional: Groq
- Pollinations: apenas se o usuario pedir contexto ou explicacao mais rica

### Neighborhood story

- executor principal: Pollinations
- insumos: nome do bairro, cidade, contexto previo, dados factuais disponiveis

### Itinerary planning

- executor principal: Pollinations
- insumos: preferencias, tempo disponivel, locais reais quando houver

### Quick follow-up e smalltalk

- executor principal: Groq

### Clarification

- executor principal: codigo com mensagem curta
- Groq opcional somente para copy

## Confianca e Fallback

- `confidence >= 0.85`: roteamento direto
- `0.60 <= confidence < 0.85`: resposta conservadora, evitando assumir detalhes extras
- `confidence < 0.60`: pedir esclarecimento curto

## Contratos de API Propostos

### `POST /api/ai/route`

Objetivo:

- classificar intencao e devolver plano de execucao

Payload:

```json
{
  "message": "o que tem de legal perto de mim agora?",
  "context": {
    "lat": -12.97,
    "lng": -38.50,
    "activeTab": "ia",
    "selectedPlaceId": null,
    "modo": "brasil"
  }
}
```

Resposta:

```json
{
  "ok": true,
  "intent": "nearby_discovery",
  "confidence": 0.94,
  "executor": "places",
  "needsClarification": false
}
```

### `POST /api/places/nearby`

Objetivo:

- buscar lugares proximos com ranking do Navegantes

Payload:

```json
{
  "lat": -12.97,
  "lng": -38.50,
  "radiusMeters": 1500,
  "categories": ["cafe", "museum"],
  "mode": "brasil",
  "moment": "afternoon"
}
```

Resposta:

```json
{
  "ok": true,
  "source": "google_places",
  "items": [
    {
      "placeId": "abc",
      "name": "Nome",
      "address": "Endereco",
      "distanceMeters": 420,
      "rating": 4.7,
      "userRatingsTotal": 128,
      "photoUrl": "",
      "categories": ["cafe"]
    }
  ]
}
```

### `POST /api/ai/chat`

Objetivo:

- responder mensagem do usuario usando roteador de intencao

Resposta minima:

```json
{
  "ok": true,
  "intent": "nearby_discovery",
  "confidence": 0.94,
  "executor": "places+groq",
  "text": "Capitao recomenda ...",
  "data": {
    "items": []
  }
}
```

## Regras de Produto

- o app deve preferir descobertas caminhaveis e contextuais
- franquias e opcoes genericas podem ser penalizadas no modo explorador
- a copy do Capitao deve continuar curta em fluxos utilitarios
- a UI deve receber estruturado + narrativa, nunca so texto livre

## Telemetria Minima Recomendada

- intencao classificada
- confianca
- executor final
- latencia por etapa
- fallback acionado
- erro por provider

## Fora de Escopo da Primeira Iteracao

- memoria longa por usuario
- ranking por historico de uso real
- personalizacao profunda por perfil
- offline completo
