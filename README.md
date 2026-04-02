<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Navegantes

Aplicativo de viagens com frontend em React/Vite e backend em Express/Prisma.

## Rodar localmente

**Pré-requisitos:** Node.js

1. Instale as dependências com `npm install`
2. Configure as variáveis em `.env`
3. Rode `npm run dev`

## Android com Capacitor

O projeto já está preparado para gerar um app Android nativo instalável.

1. Defina `VITE_API_BASE_URL` no `.env` apontando para o backend publicado
2. Rode `npm run mobile:sync`
3. Rode `npm run mobile:android`
4. No Android Studio, gere o `APK` ou `AAB`

## Variáveis importantes

- `GEMINI_API_KEY`: chave usada pelo backend
- `VITE_GOOGLE_MAPS_API_KEY`: chave usada no frontend para Google Maps
- `VITE_API_BASE_URL`: URL pública do backend para o app mobile
