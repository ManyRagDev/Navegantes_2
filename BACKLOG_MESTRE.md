# BACKLOG_MESTRE.md - Navegantes

Este documento organiza o backlog principal do **Navegantes** com prioridade estratégica e técnica.

Ele existe para responder:

- o que deve ser feito primeiro
- o que depende do quê
- o que gera valor de produto mais cedo
- o que ainda não deve entrar

Este backlog complementa:

- `DOCUMENTO_MESTRE.md`
- `DOCUMENTO_MESTRE_PRODUTO_NEGOCIO.md`
- `DOCUMENTO_MESTRE_STACK.md`

---

## 1. Princípios de Priorização

Toda priorização do Navegantes deve obedecer a estes filtros:

1. Isso reforça o core do produto?
   - curadoria
   - roteiros personalizados
   - experiência prática de viagem

2. Isso aumenta a chance de uso real durante a viagem?

3. Isso ajuda a monetizar sem destruir a experiência?

4. Isso reduz risco técnico ou destrava frentes futuras?

5. Isso evita retrabalho grande no curto prazo?

### Regra geral

Antes de escalar:

- estabilizar o core
- medir uso
- autenticar usuário
- estruturar monetização

Só depois disso expandir pesadamente comunidade, growth e recursos periféricos.

---

## 2. Macro-Ordem Recomendada

### Fase 1 — Consolidar o core usável

Objetivo:

- o usuário conseguir descobrir lugares, gerar roteiro e usar o mapa com confiança

### Fase 2 — Dar identidade de usuário real ao produto

Objetivo:

- sair do modo mock e criar conta, persistência confiável e dados reais por usuário

### Fase 3 — Instrumentar e medir

Objetivo:

- saber o que as pessoas fazem, onde abandonam e o que tem potencial de conversão

### Fase 4 — Monetização

Objetivo:

- vender o primeiro plano/passe com proposta clara

### Fase 5 — Comunidade e retenção forte

Objetivo:

- transformar uso pontual em retorno e conteúdo vivo

### Fase 6 — Escala, offline e refinamento

Objetivo:

- tornar o app mais resiliente, leve e mais preparado para crescimento

---

## 3. Backlog por Fase

---

## FASE 1 — CORE UTILIZÁVEL E CONFIÁVEL

### Objetivo da fase

Fazer o Navegantes funcionar muito bem no seu núcleo:

- curadoria local
- sugestões por IA
- roteiros personalizados
- mapa estável

### Resultado esperado

O usuário abre o app, encontra valor, entende o produto e consegue realizar a jornada principal.

### Itens

#### 1.1 Modularizar a aba Mapa

**Tipo:** técnico  
**Prioridade:** altíssima  
**Motivo:** reduzir peso, facilitar manutenção e preparar lazy load

**Entregas:**
- extrair a aba `Mapa` para componente próprio
- isolar lógica do Google Maps
- preparar carregamento sob demanda

**Dependências:** nenhuma

---

#### 1.2 Otimizar o carregamento do Google Maps

**Tipo:** técnico + performance  
**Prioridade:** altíssima  
**Motivo:** reduzir custo, peso e tempo de carregamento

**Entregas:**
- remover bibliotecas Google não utilizadas
- lazy load da API apenas na aba mapa
- revisar custo de renderização da aba

**Dependências:**
- 1.1

---

#### 1.3 Refinar a experiência de “perto de mim”

**Tipo:** produto  
**Prioridade:** altíssima  
**Motivo:** este é o principal momento “uau” da primeira experiência

**Entregas:**
- melhorar copy, destaque e relevância dos pontos próximos
- deixar clara a promessa de descoberta imediata
- reforçar o CTA para explorar/generar roteiro

**Dependências:** nenhuma

---

#### 1.4 Estruturar melhor a geração de roteiros pela IA

**Tipo:** produto + backend  
**Prioridade:** altíssima  
**Motivo:** é a hero feature e principal funcionalidade pagável

**Entregas:**
- revisar prompts e operações de IA ligadas a roteiros
- padronizar saída dos roteiros
- melhorar consistência do que é sugerido
- garantir transformação de sugestão em plano utilizável

**Dependências:** nenhuma

---

#### 1.5 Definir e implementar o fluxo principal de geração de roteiro

**Tipo:** produto + UX  
**Prioridade:** altíssima  
**Motivo:** o usuário precisa percorrer a jornada central sem fricção

**Entregas:**
- entrada clara para criar roteiro
- escolha de perfil/tema/destino
- visualização objetiva do resultado
- CTA para usar no mapa / salvar / seguir viagem

**Dependências:**
- 1.4

---

#### 1.6 Melhorar a curadoria local exibida

**Tipo:** produto  
**Prioridade:** alta  
**Motivo:** curadoria é o principal diferencial declarado do produto

**Entregas:**
- enriquecer card/lista de lugares
- explicar melhor “por que isso foi recomendado”
- diferenciar sugestões genéricas de sugestões personalizadas

**Dependências:** nenhuma

---

#### 1.7 Revisar o papel da IA na interface

**Tipo:** produto + UX  
**Prioridade:** alta  
**Motivo:** remover perfumaria e aumentar utilidade percebida

**Entregas:**
- reduzir interações superficiais
- tornar o “Capitão” mais objetivo
- reforçar a IA como copiloto prático

**Dependências:** nenhuma

---

#### 1.8 Organizar o frontend por domínios mínimos

**Tipo:** técnico  
**Prioridade:** alta  
**Motivo:** o produto já cresceu além de um `App.tsx` concentrador

**Entregas:**
- extrair componentes/telas por domínio
- separar hooks utilitários
- reduzir acoplamento da lógica principal

**Dependências:** nenhuma

---

#### 1.9 Fechar a definição do fluxo gratuito x premium (conceitualmente)

**Tipo:** produto + negócio  
**Prioridade:** alta  
**Motivo:** sem isso, UX e monetização ficam difusas

**Entregas:**
- definir o que o grátis faz bem
- definir o que o premium desbloqueia de fato
- documentar os gatilhos de upgrade

**Dependências:** nenhuma

---

### Critério para encerrar a Fase 1

Encerrar quando o app:

- entregar descoberta local com clareza
- gerar roteiro com consistência
- usar mapa com boa experiência
- comunicar valor do premium mesmo sem cobrança ativa ainda

---

## FASE 2 — USUÁRIO REAL E PERSISTÊNCIA CONFIÁVEL

### Objetivo da fase

Trocar a lógica mockada por identidade de usuário real.

### Resultado esperado

Cada usuário passa a ter conta, histórico e dados próprios.

### Itens

#### 2.1 Escolher oficialmente a estratégia de dados

**Tipo:** técnico/arquitetura  
**Prioridade:** altíssima  
**Motivo:** existe ambiguidade entre Prisma e Supabase direto

**Entregas:**
- formalizar a camada oficial de acesso a dados
- documentar decisão
- evitar expansão da dualidade atual

**Dependências:** nenhuma

---

#### 2.2 Implementar autenticação real

**Tipo:** técnico + produto  
**Prioridade:** altíssima  
**Motivo:** essencial para comunidade, monetização e persistência confiável

**Entregas:**
- login/cadastro
- sessão persistente
- associação de dados ao usuário real

**Dependências:**
- 2.1

---

#### 2.3 Migrar operações que ainda dependem de mock user

**Tipo:** técnico  
**Prioridade:** altíssima  
**Motivo:** consolidar integridade do produto

**Entregas:**
- perfil
- favoritos
- memórias/posts
- roteiros
- créditos/estado premium

**Dependências:**
- 2.2

---

#### 2.4 Preparar upload e storage de mídia

**Tipo:** técnico + produto  
**Prioridade:** alta  
**Motivo:** memórias e comunidade precisam de mídia real

**Entregas:**
- storage
- upload de imagem
- associação com post/memória/perfil

**Dependências:**
- 2.2

---

#### 2.5 Estruturar perfis reais de usuário

**Tipo:** produto  
**Prioridade:** alta  
**Motivo:** a IA e a curadoria precisam de contexto melhor

**Entregas:**
- perfil editável
- preferências básicas de viagem
- insumos para personalização

**Dependências:**
- 2.2

---

### Critério para encerrar a Fase 2

Encerrar quando:

- não houver dependência funcional do usuário mockado
- dados essenciais estiverem atrelados a conta real
- memória, favoritos e roteiros forem persistentes por usuário

---

## FASE 3 — ANALYTICS E MEDIÇÃO DE PRODUTO

### Objetivo da fase

Parar de decidir apenas por intuição.

### Resultado esperado

O Navegantes passa a medir ativação, uso e intenção de compra.

### Itens

#### 3.1 Escolher e integrar ferramenta de analytics

**Tipo:** técnico + produto  
**Prioridade:** altíssima  
**Motivo:** sem medição, não há validação real de produto

**Entregas:**
- ferramenta escolhida
- ambiente de produção preparado
- eventos básicos enviados

**Dependências:** nenhuma

---

#### 3.2 Implementar eventos principais de produto

**Tipo:** produto/data  
**Prioridade:** altíssima  
**Motivo:** medir o funil central

**Eventos mínimos:**
- app aberto
- pontos próximos visualizados
- roteiro iniciado
- roteiro gerado
- local salvo
- memória criada
- rota iniciada
- tela premium visualizada

**Dependências:**
- 3.1

---

#### 3.3 Definir métricas oficiais de ativação e retenção

**Tipo:** produto/negócio  
**Prioridade:** alta  
**Motivo:** hoje isso ainda está em aberto

**Entregas:**
- definição de ativação
- definição de retenção
- metas iniciais

**Dependências:**
- 3.2

---

#### 3.4 Instrumentar visualização de intenções de upgrade

**Tipo:** produto + monetização  
**Prioridade:** alta  
**Motivo:** entender interesse antes mesmo da cobrança final

**Entregas:**
- track de clique em premium
- track de interesse em passe por viagem
- track de recursos mais desejados

**Dependências:**
- 3.2

---

### Critério para encerrar a Fase 3

Encerrar quando:

- o produto tiver métricas básicas de uso
- existir clareza sobre ativação
- houver visão inicial sobre intenção de compra

---

## FASE 4 — MONETIZAÇÃO

### Objetivo da fase

Transformar valor percebido em receita real.

### Resultado esperado

O usuário consegue entender, considerar e comprar uma oferta clara.

### Itens

#### 4.1 Definir oficialmente a oferta premium

**Tipo:** negócio + produto  
**Prioridade:** altíssima  
**Motivo:** monetização precisa de proposta simples

**Entregas:**
- plano anual definido
- passe por viagem definido
- lógica básica de créditos definida

**Dependências:**
- 1.9
- 3.3

---

#### 4.2 Desenhar a experiência de upgrade

**Tipo:** produto + UX  
**Prioridade:** altíssima  
**Motivo:** sem boa comunicação, o valor não converte

**Entregas:**
- tela/fluxo premium
- paywall leve
- diferenciação clara entre grátis e pago

**Dependências:**
- 4.1

---

#### 4.3 Escolher gateway de pagamento

**Tipo:** técnico + negócio  
**Prioridade:** alta  
**Motivo:** viabilizar cobrança no Brasil com aderência adequada

**Entregas:**
- decisão formal de gateway
- documentação do fluxo

**Dependências:** nenhuma

---

#### 4.4 Implementar compra e ativação de plano/passe

**Tipo:** técnico + produto  
**Prioridade:** altíssima  
**Motivo:** primeira receita real

**Entregas:**
- checkout
- confirmação de compra
- liberação de acesso
- atualização de estado premium/viagem

**Dependências:**
- 4.2
- 4.3
- 2.2

---

#### 4.5 Medir conversão e comportamento pós-compra

**Tipo:** produto/data  
**Prioridade:** alta  
**Motivo:** validar valor real da oferta

**Entregas:**
- track de conversão
- uso pós-compra
- consumo de créditos, se houver

**Dependências:**
- 4.4
- 3.1

---

### Critério para encerrar a Fase 4

Encerrar quando:

- o produto tiver cobrança real
- o usuário entender o que está comprando
- houver primeiros sinais de conversão

---

## FASE 5 — COMUNIDADE E RETENÇÃO

### Objetivo da fase

Transformar o Navegantes em um produto com retorno, prova social e utilidade contínua.

### Resultado esperado

O app deixa de ser apenas uma ferramenta de uso pontual e ganha vida própria.

### Itens

#### 5.1 Estruturar o feed/comunidade com intencionalidade

**Tipo:** produto  
**Prioridade:** alta  
**Motivo:** comunidade é central na visão, mas precisa ter propósito

**Entregas:**
- feed com foco em relatos, resenhas e dicas
- diferenciação entre conteúdo útil e ruído
- regras mínimas de relevância

**Dependências:**
- 2.2
- 2.4

---

#### 5.2 Melhorar criação de memórias e relatos

**Tipo:** produto + UX  
**Prioridade:** alta  
**Motivo:** retenção e memória são parte forte da proposta

**Entregas:**
- fluxo mais prazeroso para registrar viagem
- incentivo à postagem útil
- integração com contexto do local

**Dependências:**
- 2.4

---

#### 5.3 Definir mecanismo de recompensa para contribuições valiosas

**Tipo:** produto + negócio  
**Prioridade:** média  
**Motivo:** incentivar conteúdo de qualidade

**Entregas:**
- sistema conceitual de recompensa
- critérios de qualidade
- eventual relação com créditos

**Dependências:**
- 5.1

---

#### 5.4 Criar experiências pós-viagem

**Tipo:** produto  
**Prioridade:** média  
**Motivo:** reforçar retorno e memória

**Entregas:**
- resumo da viagem
- melhores momentos
- revisitação da jornada

**Dependências:**
- 5.2

---

#### 5.5 Melhorar o retorno ao app fora da viagem

**Tipo:** produto + retenção  
**Prioridade:** média  
**Motivo:** tornar o produto menos dependente só do momento da viagem

**Entregas:**
- motivos para revisitar
- recomendações contínuas
- histórico útil

**Dependências:**
- 5.1
- 5.4

---

### Critério para encerrar a Fase 5

Encerrar quando:

- a comunidade gerar valor perceptível
- o usuário tiver motivos para voltar
- o conteúdo alimentar a curadoria do produto

---

## FASE 6 — ESCALA, OFFLINE E REFINO

### Objetivo da fase

Preparar o app para experiência mais robusta e crescimento sustentável.

### Resultado esperado

Produto mais resiliente, mais rápido, mais útil em contexto real de viagem.

### Itens

#### 6.1 Melhorar cache e suporte offline mínimo

**Tipo:** técnico + produto  
**Prioridade:** alta  
**Motivo:** viagem real exige resiliência

**Entregas:**
- cache de roteiros
- cache de favoritos
- acesso básico a memórias recentes

**Dependências:**
- 2.2

---

#### 6.2 Revisar bundle e performance mobile

**Tipo:** técnico  
**Prioridade:** alta  
**Motivo:** APK/PWA mais leves e rápidos

**Entregas:**
- análise de bundle
- code splitting
- otimização de assets

**Dependências:** nenhuma

---

#### 6.3 Evoluir a IA para adaptação contextual mais forte

**Tipo:** produto + IA  
**Prioridade:** média  
**Motivo:** aumentar valor premium e diferenciação

**Entregas:**
- ajustes por perfil
- ajustes por momento da viagem
- sugestões melhores em tempo real

**Dependências:**
- 2.5
- 3.3

---

#### 6.4 Refinar a estratégia de mapa para custo/performance

**Tipo:** técnico/arquitetura  
**Prioridade:** média  
**Motivo:** controlar custos e escalar melhor

**Entregas possíveis:**
- preview leve
- uso mais modular do Google Maps
- avaliação de alternativas futuras

**Dependências:**
- 1.2

---

#### 6.5 Preparar expansão de plataforma e território

**Tipo:** produto + negócio  
**Prioridade:** média  
**Motivo:** crescimento futuro

**Entregas possíveis:**
- iOS
- modo mundo
- expansão de distribuição

**Dependências:**
- fases anteriores bem-sucedidas

---

### Critério para encerrar a Fase 6

Encerrar quando o app estiver:

- mais resiliente em viagem real
- mais eficiente em mobile
- com base sólida para expansão

---

## 4. Backlog Transversal

Estes itens atravessam múltiplas fases e devem ser tratados continuamente.

### 4.1 Documentação

- manter documentos mestres atualizados
- registrar decisões de arquitetura
- registrar decisões de produto e pricing

### 4.2 Qualidade

- reduzir regressões
- validar fluxos críticos
- revisar erros de rede/backend/mobile

### 4.3 UX Writing e proposta de valor

- clareza da copy
- clareza da promessa do premium
- consistência entre produto e marketing

### 4.4 Segurança e moderação

Especialmente importante após autenticação e comunidade real.

---

## 5. Itens que NÃO devem entrar agora

Estes itens podem existir no futuro, mas não devem consumir foco antes do core:

- carteira de bilhetes/passagens
- sistema complexo de passaporte
- features sociais presenciais entre usuários
- expansão internacional precoce
- excesso de gamificação
- novas camadas cosméticas sem ganho funcional

---

## 6. Próximos Passos Imediatos Recomendados

Se for necessário escolher um recorte operacional curto, os próximos passos mais corretos são:

1. modularizar e otimizar o mapa
2. refinar geração e fluxo de roteiros
3. definir grátis x premium
4. escolher estratégia oficial de dados
5. implementar autenticação real
6. integrar analytics

Essa é a trilha que melhor respeita produto, técnica e negócio ao mesmo tempo.

---

## 7. Resumo Executivo

O backlog do Navegantes deve seguir esta ordem:

1. **fazer o core ser bom**
2. **dar identidade real ao usuário**
3. **medir o que acontece**
4. **monetizar**
5. **fortalecer comunidade e retenção**
6. **escalar e refinar**

Qualquer item que pule essa lógica precisa de justificativa forte.
