# AGENTS.md - Operação Navegantes

Este documento orienta qualquer agente de IA (como Antigravity) que atue neste repositório. Siga estas diretrizes para manter a integridade técnica e de produto.

## 1. Propósito do Repositório
O projeto **Navegantes** é um aplicativo de rede social e planejamento de viagens com estética retrô (Vintage/Diário de Bordo). O foco é transformar a jornada do usuário em algo visualmente rico e gamificado via IA.

## 2. Documentação Obrigatória
Antes de qualquer alteração relevante, você DEVE ler:
1. [DOCUMENTO_MESTRE.md](file:///c:/Users/emanu/Documents/Projetos/Navegantes/DOCUMENTO_MESTRE.md): Fonte principal de contexto funcional e técnico.
2. [.conductor/rules.md](file:///c:/Users/emanu/Documents/Projetos/Navegantes/.conductor/rules.md): Regras de arquitetura e consistência técnica.
3. [.conductor/product.md](file:///c:/Users/emanu/Documents/Projetos/Navegantes/.conductor/product.md): Visão de produto e integridade de negócio.

## 3. Forma de Trabalhar
- **Responsabilidade**: Entenda o domínio do trecho antes de editar (Social, Mapas, Roteiros, IA).
- **Impactos**: Mapeie efeitos colaterais em toda a stack (Prisma -> Server -> App.tsx).
- **Preservação**: Mantenha o comportamento existente, a menos que solicitado explicitamente.
- **Transparência**: Destaque riscos, acoplamentos frágeis (especialmente em `App.tsx`) e inconsistências.

## 4. Prioridades Técnicas
- **Schema `navegantes`**: Use exclusivamente este schema no Postgres.
- **Backend Only**: Segredos (Gemini, DB) ficam no `server.ts`.
- **Hybrid App**: O frontend escala via Capacitor para Android; use `apiUrl` de [api.ts](file:///c:/Users/emanu/Documents/Projetos/Navegantes/src/api.ts).
- **Bússola Retrô**: Preserve o design system (cores e tipografia customizadas).

## 5. Quando Atualizar o Documento Mestre
Atualize o `DOCUMENTO_MESTRE.md` se:
- Criar ou alterar modelos no Prisma.
- Adicionar ou modificar rotas no `server.ts`.
- Criar novos módulos funcionais no `App.tsx`.
- Alterar integrações externas (Gemini, Google Maps).

## 6. Restrições e Cuidados
- **Não assuma**: Cruze informações entre os documentos listados acima.
- **Monolito UI**: `App.tsx` possui alto acoplamento; alterações pequenas podem ter efeitos grandes na interface.
- **Mock status**: Considere que o projeto ainda usa `userId: 1` fixo e mocks parciais.

## 7. Entregas Esperadas
Ao finalizar uma tarefa:
1. Implemente a alteração.
2. Revise impactos.
3. Atualize o `DOCUMENTO_MESTRE.md` se necessário.
4. Informe se os documentos operacionais foram revisados.
