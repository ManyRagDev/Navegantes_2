# Task - Orquestracao Hibrida de IA e Places

## Contexto

O Navegantes hoje usa a camada de IA para descobrir cidade por coordenada, iniciar a saudacao do Guia IA e responder conversas gerais. Esse desenho gera latencia desnecessaria no primeiro contato e mistura tarefas factuais de descoberta geoespacial com tarefas narrativas.

Para sustentar uma experiencia mais fluida, o app precisa separar:

- descoberta factual de locais proximos
- classificacao de intencao do usuario
- roteamento entre execucao deterministica e modelos
- narrativa e profundidade da resposta do Capitao

## Objetivo

Implementar uma arquitetura hibrida em que:

- codigo e APIs de places resolvem fatos e proximidade
- Groq atua como classificador leve e motor de respostas rapidas
- Pollinations atua como motor de respostas mais elaboradas e geracao profunda
- o backend decide a rota de execucao de forma centralizada

## Resultado Esperado

Ao final da trilha, o Navegantes deve:

- abrir o Guia IA com menor latencia percebida
- responder "o que tem perto de mim" com dados reais
- distinguir buscas simples de consultas complexas sem megazord de regras no frontend
- manter o tom unico do Capitao apesar do uso de multiplos executores
- preservar segredos e regras de negocio apenas no backend

## Escopo

Inclui:

- nova estrategia de intents no backend
- integracao de Google Places no backend
- integracao de Groq no backend para classificacao e respostas rapidas
- manutencao de Pollinations como executor de respostas profundas
- novos contratos de API para busca nearby e chat orquestrado
- cache e fallback de baixo risco
- atualizacao da documentacao operacional

Nao inclui:

- autenticacao real
- persistencia completa de historico conversacional
- analytics detalhado
- redesign amplo da UI
- remocao total imediata dos fluxos legados

## Entregas

1. Roteador de intencao server-side com schema estruturado.
2. Endpoint de busca factual de locais proximos via Google Places.
3. Endpoint unificado de chat orquestrado com intents, confidence e source trace.
4. Camada de cache para nearby search e detalhes de lugar.
5. Adaptacao incremental do frontend para consumir o fluxo novo.
6. Guardrails de fallback para baixa confianca e falhas de provider.
7. Documentacao de arquitetura, spec e rollout.
8. Plano de execucao por fase para backend e frontend.

## Dependencias Externas

- Google Maps Platform com Places API habilitada
- chave server-side para Places no backend
- chave server-side para Groq
- chave server-side para Pollinations

## Riscos Principais

- inconsistencias de persona entre Groq e Pollinations
- custo de Places sem cache ou restricao de consulta
- classificacao errada de intencao em mensagens ambiguas
- regressao de UX se o frontend continuar dependendo de `App.tsx` para logica complexa

## Criterios de Aceite

- o app nao usa LLM para `city_lookup`
- o fluxo "perto de mim" parte de dados reais obtidos por API factual
- intents sao classificadas no backend com saida estruturada
- queries simples usam rota curta e baixa latencia
- queries complexas usam modelo mais profundo
- em baixa confianca, o app pede esclarecimento curto em vez de errar silenciosamente
- toda chave nova permanece fora do frontend

## Ordem Recomendada

1. Fechar contratos de intent e roteamento.
2. Integrar Google Places no backend.
3. Integrar Groq como classificador.
4. Adaptar `/api/ai` ou criar rota orquestrada sem quebrar compatibilidade.
5. Migrar a saudacao inicial e o fluxo "perto de mim".
6. Migrar conversa geral e roteiros.
7. Medir latencia, custo e taxa de fallback.
8. Consolidar a limpeza do legado no frontend.
