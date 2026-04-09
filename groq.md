# Groq Cloud — Modelos & Tutorial de Integração

> Documento gerado em: 09/04/2026  
> Fonte: [console.groq.com/docs/models](https://console.groq.com/docs/models) e [console.groq.com/docs/rate-limits](https://console.groq.com/docs/rate-limits)

---

## Índice

1. [Modelos em Destaque (Featured)](#1-modelos-em-destaque-featured)
2. [Modelos de Produção (Production)](#2-modelos-de-produção-production)
3. [Sistemas de Produção (Production Systems)](#3-sistemas-de-produção-production-systems)
4. [Modelos Preview](#4-modelos-preview)
5. [Modelos Gratuitos — Free Plan Limits](#5-modelos-gratuitos--free-plan-limits)
6. [Tutorial de Integração](#6-tutorial-de-integração)
   - [Configuração da API Key](#61-configuração-da-api-key)
   - [Listar modelos disponíveis](#62-listar-modelos-disponíveis)
   - [curl — Chat Completions](#63-curl--chat-completions)
   - [curl — Responses API](#64-curl--responses-api)
   - [Python SDK](#65-python-sdk)
   - [TypeScript / Node.js](#66-typescript--nodejs)
   - [Parâmetros avançados](#67-parâmetros-avançados)
   - [Streaming](#68-streaming)
   - [Speech-to-Text (Whisper)](#69-speech-to-text-whisper)
   - [Tratamento de Rate Limits](#610-tratamento-de-rate-limits)

---

## 1. Modelos em Destaque (Featured)

| Nome | Model ID | Velocidade | Contexto |
|------|----------|-----------|---------|
| **Groq Compound** | `groq/compound` | ~450 tps | 131.072 |
| **OpenAI GPT-OSS 120B** | `openai/gpt-oss-120b` | ~500 tps | 131.072 |

> **Groq Compound** é um sistema agentic com web search e execução de código embutidos.  
> **GPT-OSS 120B** é o modelo flagship da OpenAI open-weight com reasoning, browser search e code execution.

---

## 2. Modelos de Produção (Production)

Prontos para ambientes produtivos — alta disponibilidade e SLA garantidos.

| Nome | Model ID | Velocidade | Input /1M | Output /1M | Context | Max Completion |
|------|----------|-----------|-----------|------------|---------|----------------|
| **Llama 3.1 8B** | `llama-3.1-8b-instant` | 560 t/s | $0.05 | $0.08 | 131.072 | 131.072 |
| **Llama 3.3 70B** | `llama-3.3-70b-versatile` | 280 t/s | $0.59 | $0.79 | 131.072 | 32.768 |
| **GPT OSS 120B** | `openai/gpt-oss-120b` | 500 t/s | $0.15 | $0.60 | 131.072 | 65.536 |
| **GPT OSS 20B** | `openai/gpt-oss-20b` | 1.000 t/s | $0.075 | $0.30 | 131.072 | 65.536 |
| **Whisper Large v3** *(STT)* | `whisper-large-v3` | — | $0.111/hora | — | — | — |
| **Whisper Large v3 Turbo** *(STT)* | `whisper-large-v3-turbo` | — | $0.04/hora | — | — | — |

---

## 3. Sistemas de Produção (Production Systems)

Coleção de modelos + ferramentas que trabalham juntos para responder queries.

| Nome | Model ID | Velocidade | Context | Max Completion |
|------|----------|-----------|---------|----------------|
| **Groq Compound** | `groq/compound` | 450 t/s | 131.072 | 8.192 |
| **Groq Compound Mini** | `groq/compound-mini` | 450 t/s | 131.072 | 8.192 |

---

## 4. Modelos Preview

> ⚠️ Apenas para avaliação. Não usar em produção — podem ser descontinuados sem aviso prévio.

| Nome | Model ID | Velocidade | Preço | Context |
|------|----------|-----------|-------|---------|
| **Orpheus Arabic Saudi** | `canopylabs/orpheus-arabic-saudi` | — | $40.00/1M chars | 4.000 |
| **Orpheus V1 English** | `canopylabs/orpheus-v1-english` | — | $22.00/1M chars | 4.000 |
| **Llama 4 Scout 17B 16E** | `meta-llama/llama-4-scout-17b-16e-instruct` | 750 t/s | $0.11 / $0.34 | 131.072 |
| **Llama Prompt Guard 2 22M** | `meta-llama/llama-prompt-guard-2-22m` | — | $0.03 / $0.03 | 512 |
| **Prompt Guard 2 86M** | `meta-llama/llama-prompt-guard-2-86m` | — | $0.04 / $0.04 | 512 |
| **Safety GPT OSS 20B** | `openai/gpt-oss-safeguard-20b` | 1.000 t/s | $0.075 / $0.30 | 131.072 |
| **Qwen3-32B** | `qwen/qwen3-32b` | 400 t/s | $0.29 / $0.59 | 131.072 |

---

## 5. Modelos Gratuitos — Free Plan Limits

Todos os modelos abaixo são acessíveis **sem custo** no plano gratuito.

> **Legenda:** RPM = requests/min | RPD = requests/dia | TPM = tokens/min | TPD = tokens/dia | ASH = audio seconds/hora | ASD = audio seconds/dia

| # | Model ID | RPM | RPD | TPM | TPD | ASH | ASD |
|---|----------|-----|-----|-----|-----|-----|-----|
| 1 | `allam-2-7b` | 30 | 7K | 6K | 500K | — | — |
| 2 | `canopylabs/orpheus-arabic-saudi` | 10 | 100 | 1.2K | 3.6K | — | — |
| 3 | `canopylabs/orpheus-v1-english` | 10 | 100 | 1.2K | 3.6K | — | — |
| 4 | `groq/compound` | 30 | 250 | 70K | — | — | — |
| 5 | `groq/compound-mini` | 30 | 250 | 70K | — | — | — |
| 6 | `llama-3.1-8b-instant` | 30 | 14.4K | 6K | 500K | — | — |
| 7 | `llama-3.3-70b-versatile` | 30 | 1K | 12K | 100K | — | — |
| 8 | `meta-llama/llama-4-scout-17b-16e-instruct` | 30 | 1K | 30K | 500K | — | — |
| 9 | `meta-llama/llama-prompt-guard-2-22m` | 30 | 14.4K | 15K | 500K | — | — |
| 10 | `meta-llama/llama-prompt-guard-2-86m` | 30 | 14.4K | 15K | 500K | — | — |
| 11 | `moonshotai/kimi-k2-instruct` | 60 | 1K | 10K | 300K | — | — |
| 12 | `moonshotai/kimi-k2-instruct-0905` | 60 | 1K | 10K | 300K | — | — |
| 13 | `openai/gpt-oss-120b` | 30 | 1K | 8K | 200K | — | — |
| 14 | `openai/gpt-oss-20b` | 30 | 1K | 8K | 200K | — | — |
| 15 | `openai/gpt-oss-safeguard-20b` | 30 | 1K | 8K | 200K | — | — |
| 16 | `qwen/qwen3-32b` | 60 | 1K | 6K | 500K | — | — |
| 17 | `whisper-large-v3` | 20 | 2K | — | — | 7.2K | 28.8K |
| 18 | `whisper-large-v3-turbo` | 20 | 2K | — | — | 7.2K | 28.8K |

### Destaques do Free Plan

| Caso de uso | Modelo recomendado | Motivo |
|-------------|-------------------|--------|
| Maior volume de requests | `llama-3.1-8b-instant` | 14.4K RPD e 500K TPD |
| Maior velocidade grátis | `openai/gpt-oss-20b` | 1.000 t/s |
| Melhor para visão/imagem | `meta-llama/llama-4-scout-17b-16e-instruct` | 30K TPM + suporte multimodal |
| Melhor para coding | `moonshotai/kimi-k2-instruct` | 60 RPM, modelo especializado |
| STT mais barato | `whisper-large-v3-turbo` | 7.2K ASH grátis |
| Safety/moderação | `openai/gpt-oss-safeguard-20b` | 1.000 t/s, 1K RPD |

---

## 6. Tutorial de Integração

### 6.1 Configuração da API Key

1. Acesse [console.groq.com/keys](https://console.groq.com/keys)
2. Clique em **"Create API Key"** e copie a chave gerada
3. Configure como variável de ambiente:

```bash
# Linux / macOS
export GROQ_API_KEY="gsk_sua_chave_aqui"

# Windows (PowerShell)
$env:GROQ_API_KEY = "gsk_sua_chave_aqui"

# .env (projetos Node/Python)
GROQ_API_KEY=gsk_sua_chave_aqui
```

---

### 6.2 Listar Modelos Disponíveis

```bash
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

```python
import requests, os

headers = {"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"}
r = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
for model in r.json()["data"]:
    print(model["id"])
```

---

### 6.3 curl — Chat Completions

```bash
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [
      { "role": "system", "content": "Você é um assistente útil." },
      { "role": "user", "content": "Explique o que é IA em 2 frases." }
    ]
  }'
```

---

### 6.4 curl — Responses API (estilo OpenAI)

```bash
curl -X POST https://api.groq.com/openai/v1/responses \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "input": "Resuma em português o que é machine learning."
  }'
```

---

### 6.5 Python SDK

#### Instalação

```bash
pip install groq
```

#### Uso básico

```python
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "system", "content": "Você é um assistente útil."},
        {"role": "user", "content": "Liste 5 ideias de SaaS com IA."},
    ],
    temperature=0.7,
    max_completion_tokens=512,
)

print(response.choices.message.content)
```

#### Com função/tool use

```python
import json
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Retorna a temperatura atual de uma cidade",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "Nome da cidade"}
                },
                "required": ["city"],
            },
        },
    }
]

response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[{"role": "user", "content": "Qual a temperatura em São Paulo agora?"}],
    tools=tools,
    tool_choice="auto",
)

print(response.choices.message.tool_calls)
```

---

### 6.6 TypeScript / Node.js

#### Instalação

```bash
npm install groq-sdk
# ou
pnpm add groq-sdk
```

#### Uso básico

```typescript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: