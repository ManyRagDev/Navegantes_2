# Frontend
- **Framework**: React 19 (SPA)
- **Built Tool**: Vite
- **Mobile**: Capacitor (@capacitor/android, @capacitor/core)
- **Styling**: Tailwind CSS v4, Lucide React
- **Animations**: Motion (Framer Motion)
- **Mapas**: @react-google-maps/api

# Backend
- **Server**: Express (Node.js)
- **Runner**: tsx (TypeScript e ESM)
- **API Proxy**: Gemini AI Proxy via server.ts

# Persistence
- **ORM**: Prisma
- **Provider**: PostgreSQL (Configurado no schema `navegantes`) / SQLite (Dev local em `dev.db`)
- **Schema**: Custom schema `navegantes` no Postgres

# Integrations
- **AI**: Gemini Pro (via Proxy seguro no backend)
- **Maps**: Google Maps API
- **Client Helpers**: [api.ts](file:///c:/Users/emanu/Documents/Projetos/Navegantes/src/api.ts) para rotas dinâmicas (Android/Web)

# Infrastructure (Planned)
- **Deploy Backend**: Railway
- **Deploy Database**: Supabase
- **Android Support**: Gradle, Java/Kotlin via Capacitor Android platform
