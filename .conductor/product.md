# DOCUMENTO_MESTRE_PRODUTO_NEGOCIO.md - Navegantes

Este documento consolida a visão estratégica, de produto, posicionamento e negócio do **Navegantes**.
Serve como fonte central para a visão de produto, proposta de valor, público-alvo, monetização, papel da IA, comunidade e prioridades.
Este documento deve orientar decisões sobre roadmap, UX, pricing, growth e posicionamento para todos os agentes de IA e desenvolvedores.

---

## 1. Visão do Produto

O **Navegantes** é um assistente de viagem com IA e curadoria em formato de rede social e planejador, com uma estética retrô de "diário de bordo" em papel. Ele ajuda o usuário a:
- descobrir o que fazer sem perder tempo
- montar roteiros personalizados
- viver a viagem com mais controle
- registrar e revisitar memórias (jornada gamificada)
- conectar-se com experiências e relatos reais

**Frase comercial atual:**
> Viaje sem preocupações com o que fazer, e como buscar roteiros e conte com o assistente definitivo para te acompanhar.

**Tese central:**
O Navegantes não deve competir apenas como “mais um mapa” ou “mais uma rede social”. Seu papel é ser o **copiloto prático da viagem**.

## 2. Core Features
- **Exploração Mundo/Brasil**: Alternância de contexto entre destinos nacionais e internacionais.
- **Assistente de IA (Capitão)**: Arquitetura híbrida com roteamento de intenção (Groq) + narrativa profunda (Pollinations) + curadoria editorial de lugares (Google Places). Persona retrô/nostálgica com perfil de segurança ajustável.
- **Roteiros Inteligentes**: Geração de itinerários personalizados por IA com descoberta de lugares via Google Places API (New) e ranking por relevância.
- **Memórias (Comunidade)**: Compartilhamento de fotos e relatos com curtidas e comentários.
- **Passaporte (Selos)**: Coleta de carimbos digitais (badges) ao visitar e favoritar locais.
- **Mapa Interativo**: Integração com Google Maps para navegação e visualização de pontos de interesse.

## 3. Público-Alvo Inicial & Personas

**Público principal:** Viajantes adultos entre **20 e 45 anos**, especialmente no Brasil, que valorizam tempo, praticidade e curadoria de qualidade.
**Foco geográfico inicial:** Brasil (O modo “mundo” é uma expansão futura).

**User Personas:**
- **O Explorador Curioso**: Busca lugares autênticos e fora do circuito comercial óbvio.
- **O Viajante Organizado**: Quer roteiros prontos e eficientes, mas com flexibilidade.
- **O Colecionador de Memórias**: Valoriza o registro visual e histórico de suas jornadas.

## 4. Posicionamento e Proposta de Valor

**Categoria mental principal:** **Assistente de viagem** com curadoria e IA.
**Promessa principal mais forte:** Tenha roteiros personalizados com IA.
**O que o usuário paga para obter:** Economia de tempo, menos ansiedade, melhores experiências e orientação prática.
**Diferencial Competitivo:** Curadoria (filtrar opções, priorizar o perfil, reduzir o óbvio, transformar recomendação em plano utilizável).

**Anti-Prioridades (O que NÃO é):**
- Um app esquecível no celular, mapa genérico sem personalidade, rede social vazia ou produto puramente "bonito".
- Não focar em features cosméticas, nem em "tudo em um" sem clareza do core.

## 5. Papel da IA
A IA do Navegantes é o **copiloto prático da viagem** atuando como assistente, curador, planejador e narrador.
- **Deve fazer:** sugerir o que fazer com contexto, montar roteiros, adaptar opções ao perfil, considerar arredores, reduzir atrito de decisão.
- **Não deve fazer:** perfumaria excessiva, falação vazia ou interações decorativas demais (ex: ficar só falando "bom dia").
- **Personagem "O Capitão":** Tom de aventureiro premium, prático, sem excesso de teatralidade.

## 6. Jornada do Usuário
- **Antes:** Descobrir opções, montar roteiro, reduzir insegurança.
- **Durante:** Navegar, adaptar decisões, encontrar experiências, registrar momentos.
- **Depois:** Lembrar, revisar momentos, compartilhar, alimentar comunidade.
- **Momento "uau":** Ao abrir o app, perceber pontos incríveis perto, sensação de descoberta e vontade de continuar usando.

## 7. Comunidade
**Papel estratégico:** Central, para enriquecer a curadoria, gerar confiança, trazer relatos reais e inspirar.
**Tipos de conteúdo:** Relatos, resenhas, dicas com fotos (com incentivos de recompensa para contribuições valiosas).

## 8. Monetização e Ambição de Negócio
**Estratégia principal de curto prazo:** Vender planos (Passe por viagem e Plano anual com créditos). Evitar assinatura mensal como principal formato.
**Papel dos créditos:** Consultas premium à IA, geração de roteiros, recursos avançados de planejamento.
**Premium:** Deve oferecer roteiros mais poderosos, IA profunda e navegação orientada.

**Objetivo de Negócio:** Ajudar muita gente e ganhar dinheiro com isso (crescimento acelerado e lucro).

## 9. Princípios de Decisão
Sempre que houver dúvida, usar os filtros:
1. Isso reforça a curadoria?
2. Isso melhora o roteiro personalizado?
3. Isso reduz ansiedade ou economiza tempo do usuário?
4. Isso torna a viagem melhor de forma prática?
5. Isso aumenta a chance de o app ser usado durante a viagem real?
6. Isso ajuda o usuário a voltar depois?
7. Isso fortalece o valor percebido do premium?

## 10. Roteiro (Roadmap de Produto Mapeado)
- [x] Base mobile com Capacitor (Android).
- [x] Integração robusta com Gemini (Proxy).
- [x] IA Híbrida: Router Groq + Pollinations + Google Places com curadoria editorial e health check.
- [x] Migração para PostgreSQL/Supabase (Schema `navegantes`).
- [x] Sistema de Carimbos (Digital Seals) e Favoritos.
- [ ] Autenticação real de usuários (Supabase Auth).
- [ ] Sistema de créditos real, faturamento (Stripe) e analytics (PostHog).
