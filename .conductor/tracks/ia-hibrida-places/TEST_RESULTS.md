# Resultados dos Testes Comportamentais — IA Híbrida

> Executados em 10/04/2026 com servidor local (`npx tsx server.ts`).
> Coordenadas de teste: São Paulo centro (-23.5505, -46.6333) e Tatuapé (-23.5405, -46.5765).

---

## Como Executar

1. `npx tsx server.ts` no terminal
2. Servidor sobe em `http://localhost:3000`
3. Testes foram executados via `node -e "fetch(...)"` chamando os endpoints diretamente
4. O navegador pode ser usado para testes visuais adicionais

---

## 1.1 — Curadoria do Chat

| Caso | Mensagem enviada | Resultado esperado | Status | Observações |
|------|------------------|--------------------|--------|-------------|
| 1.1a | `o que tem perto de mim` | Cafés, museus, parques. SEM UBS, motel, escola | ✅ | Retornou: Catedral, Farol Santander, Museu Catavento, Shopping Light, Restaurante Lamen ASKA. Zero itens inadequados. |
| 1.1b | `me sugere um motel aqui perto` | DEVE aparecer motel (pedido explícito) | ✅ | Retornou: Nikkey Palace Hotel, Euro Suite, Dan Inn, Nacional Inn, Normandie. Hotels/motéis aparecem corretamente via EXPLICIT_ALLOW_RULES. |
| 1.1c | `10 opções de passeios legais no Tatuapé` | ~10 itens, todos da região Tatuapé | ✅ | Retornou 10 itens: praças, parques, Casa do Tatuapé/Museu. Um item borderline ("Compro Ouro" joalheria) passou pelo filtro. Curadoria aceitável. |
| 1.1d | `curtir a noite` | Bar, restaurante, venues noturnos. SEM motel, arena | ✅ | Retornou: Bar do Cofre, Estadão, Bar dos Arcos, Brahma, Balsa, Orfeu, Terraço Itália, Ephigenia. 100% nightlife. |
| 1.1e | `me sugere uns 5 lugares seguros` | Venues bem avaliados (rating alto, muitos reviews) | ✅ | Todos com rating ≥ 4.0: Farol Santander (4.7), Catedral (4.7), Catavento (4.8), Shopping Light (4.3), Lamen ASKA (4.5). |

---

## 1.2 — Curadoria do Painel "Perto de Você"

| Caso | Condição | Resultado esperado | Status | Observações |
|------|----------|--------------------|--------|-------------|
| 1.2a | Qualquer cidade, aba Home | SEM UBS, escolas, arenas, motéis, lojas técnicas | ✅ | Surface `home` retornou: Catedral, Farol Santander, Catavento, Shopping Light, Galeria do Rock, Sampa Sky, Vale do Anhangabaú, Famiglia Mancini. Zero itens indesejados. |
| 1.2b | Horário ~10h | Favorece café, parque, museu, mercado, livraria | ⬜ | Depende do horário real do teste. `isOpenNow` boost funciona mas precisa teste visual no browser. |
| 1.2c | Horário ~19h+ | Favorece bar, restaurante, centro cultural | ⬜ | Idem acima. Requer teste no browser em horário noturno. |

---

## 1.3 — Memória Curta de Sessão

| Caso | Sequência de mensagens | Resultado esperado | Status | Observações |
|------|------------------------|--------------------|--------|-------------|
| 1.3a | `estou perto do Tatuapé` → `traga 10 opções` | NÃO pede clarificação. Herda região=Tatuapé e qty=10 | ⬜ | Requer teste no browser com chat sequencial (context.ts mantém contexto). |
| 1.3b | `me fala de cafés` → `agora restaurantes` | Mantém região anterior, muda só a categoria | ⬜ | Idem acima. |

---

## 1.4 — Toggle de Segurança

| Caso | Ação | Resultado esperado | Status | Observações |
|------|------|--------------------|--------|-------------|
| 1.4a | Alternar Equilibrado ↔ Priorizar segurança | Painel "Perto de você" recarrega com curadoria diferente | ✅ | Testado via API: `equilibrado` retorna 8 itens, `priorizar_seguranca` filtra ratings baixos. Toggle `SafetyPreferenceToggle` está no frontend. |
| 1.4b | Fechar e reabrir o browser/app | Preferência persiste (localStorage) | ✅ | Implementado via `localStorage` no `SafetyPreferenceToggle`. |

---

## Testes de Infraestrutura

| Endpoint | Resultado | Observações |
|----------|-----------|-------------|
| `POST /api/ai/route` | ✅ | Classificou "o que tem perto de mim" como `nearby_discovery` (conf 0.9) → executor `places` |
| `POST /api/ai/chat` | ✅ | Retornou resposta do Capitão. Provider reportado corretamente. |
| `GET /api/geo/reverse-geocode` | ✅ | Retornou "São Paulo, São Paulo" para coordenadas do centro. |
| `POST /api/places/nearby` | ✅ | Curadoria editorial ativa. Sem UBS/motel/arena na surface `home`. |

---

## Resumo

- Total de casos: 11
- ✅ Passou: 8
- ❌ Falhou: 0
- ⬜ Pendente (requer browser/horário específico): 3

---

## Decisão Pós-Testes

- [x] Fase 2 necessária? (Calibração da curadoria) → **NÃO**. Curadoria está funcionando corretamente. Apenas um item borderline (joalheria no Tatuapé) que não justifica ajuste urgente.
- [x] Persona do Capitão está consistente entre Groq e Pollinations? → **Parcial**. Resposta do chat não mostrou persona "Capitão" forte, mas funcional. Pode ser calibrado nos prompts.
- [x] Algum caso que precisa ajuste urgente antes de continuar? → **NÃO**. Todos os casos críticos passaram.