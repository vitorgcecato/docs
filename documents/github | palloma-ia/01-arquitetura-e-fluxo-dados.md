# 🗺️ Arquitetura & Fluxo Completo de Dados

> **Documentação Técnica do Projeto Teacher Up & Assistent**  
> *Módulo de Arquitetura de Software e Ciclo de Vida das Requisições*

---

## 📌 Visão Arquitetural

O projeto adota uma arquitetura **Single Page Application (SPA)** desacoplada, utilizando **React 19** no Front-End e comunicando-se diretamente com os serviços em nuvem da **Google Generative Language API (Gemini 2.5 Flash)** via requisições HTTP RESTful (`fetch`).

```mermaid
graph TD
    subgraph CLIENT["🌐 Cliente (Navegador do Usuário)"]
        direction TB
        App["App.jsx (React Router v7)"]
        
        subgraph ROTAS["Rotas da Aplicação"]
            R_Home["/ (Home.jsx)"]
            R_Login["/login (Login.jsx)"]
            R_Assistente["/assistente (AssistenteIA.jsx)"]
            R_Expectativas["/expectativas (Expectativas.jsx)"]
            R_Sobre["/sobrenos (SobreNos.jsx)"]
        end

        subgraph COMPONENTES_GLOBAIS["Componentes Compartilhados"]
            Navbar["Navbar.jsx"]
            Footer["Footer.jsx"]
        end
    end

    subgraph SERVICOS_EXTERNOS["☁️ Serviços Externos & APIs"]
        GeminiAPI["Google Gemini 2.5 Flash API (v1beta)"]
        BNCC_Doc["Documento Fonte BNCC (.pdf)"]
    end

    App --> ROTAS
    R_Assistente --> Navbar
    R_Assistente --> Footer
    R_Expectativas --> Navbar
    R_Expectativas --> Footer
    R_Sobre --> Navbar
    R_Sobre --> Footer

    R_Assistente -- "POST /v1beta/models/gemini-2.5-flash:generateContent" --> GeminiAPI
    R_Expectativas -- "Prompt com Fonte BNCC" --> GeminiAPI
```

---

## 🔄 Fluxo de Ciclo de Vida do Assistente de IA

O fluxo de geração de planos de aula em `AssistenteIA.jsx` segue uma sequência precisa desde o input do usuário até a renderização visual e opções de exportação:

```mermaid
sequenceDiagram
    autonumber
    actor Professor as Professora Palloma
    participant UI as AssistenteIA.jsx (Interface)
    participant State as React States (useState)
    participant Gemini as Google Gemini 2.5 Flash API
    participant Parser as renderResponse() & parseBold()
    participant DOM as DOM & Window Print/Clipboard

    Professor->>UI: Preenche Tema, Série, Duração e Obs
    Professor->>UI: Clica em "Gerar Plano de Aula"
    UI->>State: setLoading(true) & setGeneratedContent(null)
    UI->>UI: Executa buildPrompt(tema, serie, duracao, obs)
    UI->>Gemini: POST generateContent (JSON Payload + x-goog-api-key)
    
    alt Sucesso na Resposta
        Gemini-->>UI: Retorna JSON com texto Markdown estruturado
        UI->>State: setGeneratedContent(reply)
        UI->>State: setLoading(false)
        UI->>Parser: renderResponse(generatedContent)
        Parser->>Parser: Converte Markdown em elementos HTML (h4, ul, li, strong)
        Parser-->>UI: Injeta nós React na árvore DOM
        UI->>DOM: scrollIntoView({ behavior: 'smooth' })
    else Falha na Conexão / Rate Limit
        Gemini-->>UI: Erro HTTP ou Timeout
        UI->>State: setGeneratedContent('Erro de conexão com a IA.')
        UI->>State: setLoading(false)
    end

    opt Exportação via Clipboard
        Professor->>UI: Clica em "Copiar Plano"
        UI->>DOM: navigator.clipboard.writeText(generatedContent)
        DOM-->>Professor: Alerta "Copiado para a área de transferência!"
    end

    opt Exportação via PDF
        Professor->>UI: Clica em "Baixar PDF"
        UI->>DOM: Abre printWindow = window.open(...)
        UI->>DOM: Injeta printWindow.document.write(contentToPrintRef.innerHTML)
        UI->>DOM: Executa printWindow.print()
    end
```

---

## 🔄 Fluxo de Consulta de Expectativas da BNCC

Em `Expectativas.jsx`, a interação do usuário com o `select` dispara automaticamente uma requisição orientada a extração estrita de JSON:

```mermaid
sequenceDiagram
    autonumber
    actor Professor as Professora Palloma
    participant UI as Expectativas.jsx
    participant Effect as useEffect([serie])
    participant Gemini as Google Gemini 2.5 Flash API
    participant Regex as Extrator Regex /\[([\s\S]*)\]/
    participant JSONEngine as JSON.parse()

    Professor->>UI: Seleciona uma série no seletor (Ex: "6º ano")
    UI->>Effect: Atualiza estado serie -> dispara fetchExpectativas()
    Effect->>UI: setLoadingApi(true) & setApiError(null)
    Effect->>Gemini: POST generateContent com prompt de extração e link BNCC
    Gemini-->>Effect: Resposta com string bruta (JSON encapsulado)
    
    Effect->>Regex: match(/(\[([\s\S]*)\])/)
    alt JSON Válido Encontrado
        Regex-->>JSONEngine: Extrai substring do array
        JSONEngine-->>Effect: Array de objetos estruturados
        Effect->>UI: setExpectativasDaSerie(parsed)
        UI->>UI: Renderiza lista de componentes <CartaoExpectativa />
    else Erro no Parse / Formato Inválido
        Effect->>UI: setApiError("Falha ao parsear JSON...")
        UI->>UI: Renderiza mensagem amigável de erro
    end
    Effect->>UI: setLoadingApi(false)
```

---

## 🔒 Gestão de Variáveis de Ambiente e Segurança

O projeto utiliza o sistema de variáveis de ambiente do **Vite**:
* `import.meta.env.VITE_GEMINI_KEY`: Injetada em tempo de build/execução para autenticar as chamadas à API Gemini.
* Cabeçalho de autorização: `x-goog-api-key`.

> [!WARNING]
> Em aplicações React Client-Side (SPA), chaves prefixadas com `VITE_` são embutidas no bundle JavaScript final do cliente. Em ambientes produtivos de larga escala corporativa, a melhor prática é criar um proxy de Backend (Node.js/Express) para proteger a chave e aplicar rate limiting.
