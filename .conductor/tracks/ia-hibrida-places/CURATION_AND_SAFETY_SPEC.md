# Curation and Safety Spec - Guia IA e Painel "Perto de Voce"

## Objetivo

Consolidar as correcoes e melhorias aprovadas para:

- o Guia IA do Navegantes
- o painel inicial "Perto de voce"

O foco desta especificacao e melhorar:

- relevancia das recomendacoes
- continuidade de contexto
- seguranca editorial
- adequacao ao produto
- utilidade pratica sem perder flexibilidade

## Problemas Observados

### 1. Recomendacoes inadequadas

Exemplos detectados:

- motel sugerido como passeio generico
- UBS e cursos tecnicos aparecendo no painel "Perto de voce"
- loja de gas, salao de festas e venues pouco aderentes aparecendo como destaque

### 2. Perda de contexto conversacional

Exemplo:

- o usuario pergunta algo sobre Tatuape
- logo depois pede "traga umas 10 opcoes"
- o sistema pede clarificacao mesmo com contexto recente suficiente

### 3. Falta de aderencia ao pedido

Exemplos:

- usuario pede 10 opcoes e recebe 2 ou 3
- usuario pede "curtir a noite" e recebe venues genericos ou ambiguos
- o modelo mistura passeio, utilidade cotidiana e estabelecimentos inadequados

### 4. Falta de diferenca entre surfaces

Hoje o sistema tende a tratar:

- chat do Guia IA
- painel "Perto de voce"

como se exigissem o mesmo nivel de abertura semantica.

Isso e um erro. A home precisa de curadoria mais rigida do que o chat.

## Principios Aprovados

1. O app nao deve sugerir qualquer lugar apenas por estar perto.
2. O app deve sugerir lugares adequados ao contexto e ao produto.
3. O usuario pode pedir categorias especificas, inclusive restritas.
4. O sistema deve bloquear por padrao e liberar por intencao explicita quando necessario.
5. Seguranca deve ser contextual e gradual, nao binaria e cega.
6. A home deve ser mais editorial e conservadora que o chat.

## Diferenca Entre Superficies

### Guia IA

Objetivo:

- responder pedidos do usuario com flexibilidade
- permitir descoberta contextual
- aceitar pedidos especificos e fora do padrao quando explicitamente solicitados

Perfil:

- curadoria equilibrada
- mais abertura semantica
- contexto conversacional importa muito

### Painel "Perto de Voce"

Objetivo:

- destacar somente lugares que realmente valem atencao imediata
- servir como vitrine editorial do produto

Perfil:

- curadoria rigida
- filtro mais conservador
- apenas lugares aderentes a descoberta, lazer, cultura e experiencia urbana

## Politica de Curadoria por Categoria

### 1. Categorias permitidas por padrao

Entram naturalmente quando coerentes com o contexto:

- `tourist_attraction`
- `museum`
- `art_gallery`
- `park`
- `cafe`
- `restaurant`
- `bakery`
- `bar`
- `cultural_center`
- `book_store`
- `market`
- `shopping_mall` com moderacao

### 2. Categorias restritas ate pedido explicito

Nao entram em recomendacoes genericas, mas podem entrar se o usuario pedir de forma clara:

- motel
- hotel e lodging utilitario
- sex shop
- karaoke, narguile ou venues sensiveis, conforme politica final do produto
- salao de eventos generico
- arena ou estadio sem contexto de evento
- comercios hiper-especificos como tapeçaria, ferragem, autopecas, material de construcao
- servicos praticos do dia a dia como chaveiro, despachante, cartorio

### 3. Categorias bloqueadas por padrao editorial

Devem ser fortemente penalizadas ou removidas dos fluxos genericos:

- `hospital`
- `doctor`
- `pharmacy`
- `school`
- `training_center`
- `government_office`
- `finance`
- `real_estate`
- `gas_station`
- `car_repair`
- `funeral_home`
- `storage`
- `industrial`
- `service` generico sem valor experiencial

## Regra Principal de Liberacao

### Curadoria padrao

O sistema nao recomenda categorias restritas ou inadequadas em pedidos genericos como:

- "o que tem de legal por aqui?"
- "10 lugares para visitar"
- "o que fazer a noite?"
- "me sugira uns passeios"

### Liberacao por intencao explicita

Se o usuario pedir explicitamente uma categoria restrita, o sistema pode sugeri-la.

Exemplos:

- "me sugere um motel aqui perto"
- "tem tapeçaria boa no Tatuape?"
- "quero um lugar para comprar estofado"

Conclusao:

- proximidade sozinha nao justifica recomendacao
- pedido explicito pode destravar categorias restritas

## Contexto Conversacional Minimo Obrigatorio

O backend deve manter contexto curto da sessao para evitar perda de continuidade.

Campos minimos:

- ultima regiao ou bairro citado
- ultima cidade citada
- ultima categoria ou tema pedido
- ultima quantidade pedida
- ultimo intent classificado
- ultimo perfil de curadoria aplicado

Exemplo esperado:

Se o usuario disser:

- "estou proximo ao Tatuape"
- depois "traga 10 opcoes de passeios legais"

o sistema deve herdar:

- regiao = Tatuape
- intencao = nearby discovery
- quantidade = 10

Sem pedir clarificacao desnecessaria.

## Perfis de Curadoria

### 1. `home_curated`

Uso:

- painel "Perto de voce"

Comportamento:

- whitelist estreita
- elimina venues ambiguos
- exige qualidade minima
- penaliza utilidade cotidiana
- prioriza lifestyle, cultura, gastronomia e descoberta

### 2. `chat_balanced`

Uso:

- Guia IA por padrao

Comportamento:

- whitelist principal
- categorias restritas continuam bloqueadas sem pedido explicito
- maior flexibilidade que a home
- pode responder a preferencias do usuario com mais abertura

### 3. `explicit_user_request`

Uso:

- quando o usuario pede uma categoria restrita de forma clara

Comportamento:

- libera a categoria pedida
- ainda respeita filtros de qualidade e seguranca
- nao mistura essa categoria com sugestoes genericas

## Curadoria de Seguranca

## Principio

Seguranca nao deve ser um bloqueio geografico burro por bairro. Deve ser um score contextual.

### O que NAO fazer

- bloquear bairros inteiros por fama de criminalidade
- assumir seguranca absoluta
- esconder regioes culturalmente relevantes por regra binaria

### O que fazer

Aplicar `risk scoring` por venue e contexto.

Sinais recomendados:

- horario atual
- local aberto agora
- volume e nota de avaliacoes
- recorrencia de termos negativos nas avaliacoes, quando houver suporte
- tipo de venue
- se a area parece mais movimentada ou mais isolada
- distancia e necessidade de deslocamento
- tipo de passeio pedido

### Saidas do score

- `baixo risco`: recomendar normalmente
- `medio risco`: recomendar com aviso contextual leve
- `alto risco`: penalizar fortemente ou remover por padrao

### Linguagem recomendada

Evitar:

- "e totalmente seguro"
- "nao ha risco"

Preferir:

- "costuma ser mais movimentado nesse horario"
- "vale chegar por app ou carro"
- "se voce quer algo mais tranquilo, eu priorizaria estas opcoes"

## Preferencia de Seguranca do Usuario

O app deve ter filtro automatico de seguranca por padrao, mas permitir aumento de rigor pelo usuario.

### Modelo recomendado

- `Equilibrado` - padrao
- `Priorizar seguranca`

### O que nao usar

- "qualquer tipo de lugar"
- "totalmente seguro"

Motivo:

- "qualquer tipo de lugar" enfraquece a curadoria
- "totalmente seguro" promete o que o app nao pode garantir

## Regras Especificas para o Painel "Perto de Voce"

### O que o painel deve responder

Nao:

- "o que existe por perto"

Sim:

- "o que vale descobrir por perto agora"

### Requisitos minimos para entrar no painel

1. categoria aderente ao produto
2. qualidade minima
3. relevancia pratica ou experiencial
4. foto ou apresentacao visual aceitavel, quando possivel
5. coerencia com horario e contexto

### Itens que o painel deve evitar fortemente

- UBS e postos de saude
- cursos tecnicos e escolas
- lojas tecnicas e de suprimento
- saloes de evento genericos
- motel sem pedido explicito
- arena/estadio sem contexto de evento
- servicos de rotina e utilidade operacional

## Regras Especificas para Nightlife

Quando o pedido for:

- "curtir a noite"
- "o que fazer a noite"
- "vida noturna"

Priorizar:

- `bar`
- `night_club`
- `restaurant`
- `live_music`
- venues culturais noturnos

Penalizar ou excluir:

- motel
- salao de festas generico
- arena sem evento
- venue ambiguo sem sinal claro de lazer

## Enforcamento de Quantidade

Se o usuario pedir quantidade explicita, o backend deve respeitar isso estruturalmente antes da narrativa.

Exemplos:

- pediu 10 -> gerar 10 itens estruturados
- pediu 3 -> gerar 3 itens estruturados

O texto do Capitao deve ser derivado da lista ja pronta.

Nao depender de texto livre para cumprir quantidade.

## Pipeline Recomendado

### Para o Guia IA

1. classificar intent
2. recuperar contexto recente
3. escolher perfil de curadoria
4. definir categorias permitidas
5. aplicar liberacao explicita se houver
6. buscar venues
7. aplicar filtros editoriais
8. aplicar risk scoring
9. ordenar
10. montar lista estruturada
11. gerar resposta do Capitao

### Para o Painel "Perto de Voce"

1. usar perfil `home_curated`
2. buscar venues com whitelist mais estreita
3. aplicar blacklist editorial forte
4. aplicar score de qualidade
5. aplicar score de seguranca
6. ordenar e cortar apenas os melhores
7. exibir como vitrine editorial

## Heuristicas Complementares

Mesmo com tipos estruturados, o sistema deve ter heuristicas textuais leves.

Exemplos:

- se o nome contem "motel", penalizar ou excluir em fluxos genericos
- se o nome indica servico tecnico ou utilitario, excluir do painel inicial
- se o venue tem taxonomia ambigua, usar nome + contexto + intent para decidir

## Itens de Implementacao

### Backend

- criar mapa de perfis de curadoria
- criar mapa de categorias permitidas por intent
- criar categorias restritas e bloqueadas
- armazenar contexto curto de sessao
- aplicar liberacao por pedido explicito
- adicionar score editorial
- adicionar score de seguranca
- separar pipeline da home e pipeline do chat

### Frontend

- exibir filtro de seguranca opcional com linguagem adequada
- manter painel "Perto de voce" mais editorial
- nao chamar genericamente de "sugerido por IA" quando a sugestao vier majoritariamente do filtro factual e curatorial

## Criterios de Aceite

1. O sistema nao sugere motel, UBS, loja de gas ou curso tecnico em fluxos genericos.
2. O sistema sugere categoria restrita apenas quando o usuario pede explicitamente.
3. O painel "Perto de voce" mostra lugares coerentes com descoberta, lazer e lifestyle.
4. O Guia IA preserva contexto recente sem pedir clarificacao desnecessaria.
5. A quantidade pedida pelo usuario e respeitada na resposta estruturada.
6. O filtro de seguranca nao apaga bairros inteiros de forma burra.
7. O produto comunica prudencia sem prometer seguranca absoluta.

## Ordem Recomendada de Implementacao

1. Perfis de curadoria (`home_curated`, `chat_balanced`, `explicit_user_request`)
2. Whitelist por intent
3. Categorias restritas e bloqueadas
4. Heuristicas de nome
5. Memoria curta de contexto
6. Enforcement de quantidade
7. Risk scoring contextual
8. Preferencia de seguranca do usuario

## Decisoes em Aberto

- lista final de categorias restritas
- quais venues esportivos podem entrar com contexto especial
- nivel de rigidez para shopping e grandes redes
- estrategia futura para usar reviews como sinal de seguranca/insalubridade
