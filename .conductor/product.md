# Vision
Navegantes é uma rede social e planejador de viagens com uma estética retrô de "diário de bordo" em papel. O objetivo é transformar a experiência de exploração urbana e internacional em uma jornada gamificada e visualmente rica.

# Core Features
- **Exploração Mundo/Brasil**: Alternância de contexto entre destinos nacionais e internacionais.
- **Assistente de IA (Capitão)**: Arquitetura híbrida com roteamento de intenção (Groq) + narrativa profunda (Pollinations) + curadoria editorial de lugares (Google Places). Persona retrô/nostálgica com perfil de segurança ajustável.
- **Roteiros Inteligentes**: Geração de itinerários personalizados por IA com descoberta de lugares via Google Places API (New) e ranking por relevância.
- **Memórias (Comunidade)**: Compartilhamento de fotos e relatos com curtidas e comentários.
- **Passaporte (Selos)**: Coleta de carimbos digitais (badges) ao visitar e favoritar locais.
- **Mapa Interativo**: Integração com Google Maps para navegação e visualização de pontos de interesse.

# User Personas
- **O Explorador Curioso**: Busca lugares autênticos e fora do circuito comercial óbvio.
- **O Viajante Organizado**: Quer roteiros prontos e eficientes, mas com flexibilidade.
- **O Colecionador de Memórias**: Valoriza o registro visual e histórico de suas jornadas.

# Roadmap (Inferido)
- [x] Base mobile com Capacitor (Android).
- [x] Integração robusta com Gemini (Proxy).
- [x] IA Híbrida: Router Groq + Pollinations + Google Places com curadoria editorial e health check.
- [x] Migração para PostgreSQL/Supabase (Schema `navegantes`).
- [x] Sistema de Carimbos (Digital Seals) e Favoritos.
- [ ] Autenticação real de usuários (Firebase/Auth.js).
- [ ] Sistema de créditos real e faturamento.
