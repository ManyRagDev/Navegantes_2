# Regras Gerais (Senior)
- **KISS**: Manter o código simples; evitar sobre-engenharia em um projeto protótipo.
- **DRY**: Reutilizar lógica de UI (cores, SVGs retrô) e helpers de API.
- **Clean Code**: Nomes de variáveis em português/inglês conforme o contexto (dominio Navegantes).

# Regras de Arquitetura do Projeto
- **Schema `navegantes`**: Toda nova tabela ou migração Prisma DEVE ser criada dentro do schema `navegantes` no Postgres.
- **Segurança (Backend First)**: Nenhuma chave de API (Gemini, Supabase) deve ser exposta no frontend. Usar o proxy no `server.ts`.
- **API Base**: Todas as chamadas do frontend devem usar o helper `apiUrl` de [src/api.ts](file:///c:/Users/emanu/Documents/Projetos/Navegantes/src/api.ts).
- **Usuário Padrão**: Na fase atual, assume-se `userId: 1` para todas as persistências até que a autenticação real seja implementada.
- **Aparência Retrô**: Manter a paleta de cores (`#f3ecdb`, `#b45a35`) e fontes retrô em novos componentes.

# Regras de Manutenção
- **Documento Mestre**: Qualquer mudança estrutural relevante deve ser refletida no `DOCUMENTO_MESTRE.md`.
- **Integridade do Produto**: Novas funcionalidades devem respeitar a visão do "Diário de Bordo" (product.md).
