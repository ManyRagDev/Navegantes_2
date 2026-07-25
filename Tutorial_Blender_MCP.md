# Tutorial: Como Configurar e Utilizar o MCP do Blender

Depois de bastante investigação e testes, descobrimos os detalhes exatos de como o Blender MCP se comunica com o sistema operacional. Este tutorial serve como referência para configurar e fazer scripts externos controlarem o Blender perfeitamente.

## 1. Configuração do Add-on no Blender

1. **Instalação:** Abra o Blender, vá em `Edit > Preferences > Add-ons` e instale o arquivo `.zip` do Add-on do Blender MCP.
2. **Ativação:** Ative o Add-on clicando na caixa de seleção.
3. **Configuração de Rede:**
   - **Host:** `localhost`
   - **Port:** `9876` (ou a porta de sua preferência)
   - Ative o "Log" se quiser que o servidor registre as chamadas no terminal.
4. **Iniciar o Servidor:** Clique no botão **"Start MCP Bridge Server"**. O Blender agora estará ouvindo na porta 9876 através da sua *Main Thread*.

> **Aviso de Cenário de Arquivos Novos:** Lembre-se que se o botão *Auto Start* não estiver ativado com *Persistent*, abrir um arquivo novo (File > New) ou abrir um projeto existente (File > Open) pode limpar o timer de execução.

---

## 2. O Problema do FastMCP

O pacote oficial em Python (`blender-mcp`) utiliza a biblioteca **FastMCP**. Descobrimos que o uso direto de requisições `tools/call` enviadas para o processo `uvx blender-mcp` pode resultar em erros de inicialização, como:
`Failed to validate request: Received request before initialization was complete`.

Isso ocorre porque o padrão do MCP exige um handshake completo (`initialize` -> `initialized`) antes de executar comandos.

**A Solução (O "Pulo do Gato"):** Em vez de lutar contra as barreiras do FastMCP, podemos **comunicar diretamente com o Socket TCP do Blender**!

---

## 3. Comunicação Direta via Socket (TCP)

O Add-on do Blender roda um servidor TCP simples. Você pode enviar código Python do seu sistema diretamente para essa porta.

### Formato da Requisição

O servidor espera um objeto JSON seguido de um byte nulo (`\x00`). O formato exato (na versão mais recente) **exige** a chave `"strict_json": True`.

```json
{
    "type": "execute",
    "code": "print('Olá do Blender!')",
    "strict_json": true
}
```

### Exemplo de Script Python Externo

Para enviar o código para o Blender, use o seguinte script em Python de qualquer lugar no seu computador:

```python
import socket
import json

def enviar_para_blender(codigo_python):
    req = {
        "type": "execute",
        "code": codigo_python,
        "strict_json": True
    }
    
    # O Blender MCP exige que o pacote termine com o byte nulo
    req_bytes = json.dumps(req).encode('utf-8') + b'\x00'
    
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5.0)
        s.connect(('127.0.0.1', 9876))
        s.sendall(req_bytes)
        
        response_bytes = bytearray()
        while True:
            chunk = s.recv(4096)
            if not chunk:
                break
            response_bytes.extend(chunk)
            if b'\x00' in chunk:
                break
                
        # O Blender responde com um JSON
        resp = json.loads(response_bytes.strip(b'\x00').decode('utf-8'))
        print("Resposta do Blender:", json.dumps(resp, indent=2))

# Exemplo de uso:
codigo = "import sys\nsys.stdout.write('Tudo certo!')"
enviar_para_blender(codigo)
```

---

## 4. Dicas Avançadas: Contexto e Interface (GUI)

Como o código é executado dentro de um `timer` (callback em background), o **contexto do Blender (`bpy.context`) é restrito**:

1. **Janelas e Áreas:** Variáveis como `bpy.context.window` ou `bpy.context.area` retornam `None`.
2. **Uso do bpy.ops:** Operadores que dependem de ver uma tela 3D (ex: `bpy.ops.mesh.primitive_uv_sphere_add()`) **vão falhar** com erro de contexto.
   - *Solução:* Utilize as funções de dados de baixo nível como `bpy.data.objects.new()` e a API `bmesh` para criar objetos via script, contornando a necessidade do `bpy.ops`.
3. **Atualização da Viewport:** Alterações feitas nos dados `bpy.data` por script de Socket **não atualizam a interface gráfica automaticamente**.
   - *Solução:* Após modificar a cena (como adicionar ou deletar um objeto), **sempre** inclua no final do seu código:
     `bpy.context.view_layer.update()`
   - Se os objetos forem criados mas não aparecerem na tela (no *Outliner*), garanta que você os "linkou" à coleção principal com:
     `bpy.context.scene.collection.objects.link(seu_objeto)`
