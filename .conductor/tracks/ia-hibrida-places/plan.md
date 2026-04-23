# Plano de Implantação: IA Híbrida & Places v2

Este track foca na finalização da migração do sistema de IA legado para a nova arquitetura híbrida (Groq/Pollinations/Google Places).

## Objetivo
Eliminar dependências de rotas legadas (`/api/ai`), unificar contratos de descoberta de lugares e garantir observabilidade total do roteamento.

## Tarefas

### Fase 3: Limpeza Técnica e Estabilização [CONCLUÍDO]
- [x] Remover funções legadas em `src/App.tsx` (`callAI`, `inferLegacyOperation`, etc)
- [x] Corrigir contrato de `itinerary_suggestions` para usar `callNearbyPlaces` no frontend
- [x] Corrigir corrupção de sintaxe em `src/App.tsx` (resquício de erro TS1128)
- [x] Remover rotas legadas no `server.ts` (`POST /api/ai`, `POST /api/gemini`)
- [x] Restaurar helpers utilitários no `server.ts` (`sendAIError`, `asFiniteNumber`, etc)
- [x] Validar build completo (`tsc --noEmit` PASSANDO)

### Fase 1: Validação Comportamental [CONCLUÍDO]
- [x] **Teste de Chat**: Roteamento entre Groq e Pollinations validado via `POST /api/ai/route` e `POST /api/ai/chat`.
- [x] **Teste de Descoberta**: Feed da Home carrega via Google Places. Curadoria editorial filtrando UBS/motel/arena.
- [x] **Teste de Itinerário**: Geração de locais para destinos específicos (São Paulo, Tatuapé) validada.
- [x] **Segurança**: Perfil "priorizar_seguranca" retorna apenas venues com rating ≥ 4.0.
- [x] **Resultados detalhados**: Ver `.conductor/tracks/ia-hibrida-places/TEST_RESULTS.md` (8/11 passaram, 3 pendem de teste visual no browser).

### Fase 4: Observabilidade e Logging [CONCLUÍDO]
- [x] Implementar endpoint de status `GET /api/health/ai` com ping real nos 3 provedores (Groq, Pollinations, Google Places).
- [x] Medição de latência por provedor (Groq ~337ms, Pollinations ~2.4s em teste local).
- [x] `pingGroq()` e `pingPollinations()` adicionados como funções reutilizáveis nos respectivos providers.

### Fase 5: Documentação Final [CONCLUÍDO]
- [x] Atualizar `DOCUMENTO_MESTRE.md` com as novas rotas e arquitetura.
- [x] Revisar `.conductor/product.md` para alinhar visões de custo/performance da IA Híbrida.
- [x] Atualizar handoff final em `.conductor/handoff-ia-hibrida.md`.

## Estado Atual do Sistema
- **Integridade**: Backend e Frontend sincronizados e compilando.
- **Compilação**: VERDE (`tsc --noEmit` passando 100%).
- **Testes Comportamentais**: 8/11 passaram (3 pendem teste visual no browser).
- **Observabilidade**: `GET /api/health/ai` operacional com ping real em todos os provedores.
- **Handoff**: Documento final em `.conductor/handoff-ia-hibrida.md`.

## Próximos Passos (Futuro)
- [ ] Testar no browser os 3 casos pendentes (1.2b horário diurno, 1.2c horário noturno, 1.3a/1.3b memória de sessão).
- [ ] Deploy em produção (Railway) e validar health check em ambiente real.
- [ ] Autenticação real de usuários (Firebase/Auth.js).
- [ ] Sistema de créditos real e faturamento.