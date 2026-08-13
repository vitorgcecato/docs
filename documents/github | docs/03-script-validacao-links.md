# 🔍 Validação de Links: `scripts/validate-links.js`

> **Módulo 3 do Guia Especialista em Engenharia de Software**  
> *Análise Detalhada do Validador Pré-Sync*

---

## 📌 Por que Validar Links Antes de Enviar ao Notion?

A API do Notion possui validações rígidas de esquemas de blocos. Se um documento Markdown contiver uma URL com erro de sintaxe, um parâmetro query sem valor ou um caractere inválido (ex: `https://` sem host ou `http://example.com?param=`), a chamada `notion.pages.create` ou `notion.blocks.children.append` falhará com um erro `400 Bad Request`.

O script [`scripts/validate-links.js`](../../scripts/validate-links.js) atua como um **Linter Pré-Sincronização**, varrendo todos os arquivos `.md` antes de qualquer requisição HTTP ser disparada.

---

## 💻 Código-Fonte Completo Explicado Comentado

```javascript
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..');

// Regex 1: Captura URLs soltas no texto puro (ex: "Visite https://google.com para mais informações")
// Usa Lookbehind negativo (?<!\]\() para IGNORAR URLs que já estejam no formato [texto](url)
const BARE_URL_REGEX = /(?<!\]\()https?:\/\/[^\s)\]"'<>]+/g;

// Regex 2: Captura links em formato Markdown sintático: [texto do link](https://exemplo.com)
const MD_LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;

// Lista de Regras de Validação Customizadas para Padrões Problemáticos
const INVALID_PATTERNS = [
  { test: (url) => /\/html\/rfc[^0-9]/.test(url) || /\/html\/rfc$/.test(url), reason: 'URL de RFC incompleta (faltando número do RFC)' },
  { test: (url) => /[?&][a-zA-Z0-9_]+=\s*$/.test(url.trim()), reason: 'Parâmetro de query string sem valor (ex: ?key=)' },
  { test: (url) => /^https?:\/\/$/.test(url), reason: 'URL sem host (apenas scheme https://)' },
  { test: (url) => /^https?:\/\/[^\s]+\s+[^\s]/.test(url), reason: 'URL com espaço não codificado no meio' },
];
```

---

## 🧩 Principais Funções do Algoritmo

### 1. Busca Recursiva de Arquivos (`findMarkdownFiles`)
```javascript
function findMarkdownFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir).sort();
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      // Ignora pastas do sistema, dependências e scripts
      if (!['node_modules', '.git', '.github', 'scripts'].includes(entry)) {
        findMarkdownFiles(fullPath, fileList);
      }
    } else if (entry.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}
```
Esta função percorre recursivamente qualquer profundidade de pastas a partir do diretório raiz, ignorando pastas administrativas (`node_modules`, `.git`, `.github`, `scripts`).

---

### 2. Remoção de Blocos de Código (`stripCodeBlocks`)
```javascript
function stripCodeBlocks(content) {
  // Substitui blocos cercados por ``` por quebras de linha preservando os números das linhas
  content = content.replace(/```[\s\S]*?```/g, (match) => '\n'.repeat(match.split('\n').length - 1));
  // Substitui código inline (`exemplo`) por espaços
  content = content.replace(/`[^`\n]+`/g, (match) => ' '.repeat(match.length));
  return content;
}
```
**Decisão Arquitetural Vital**: URLs escritas dentro de exemplos de código (ex: `const url = "https://api.exemplo.com?key=123";`) não devem ser validadas como links reais, pois são trechos fictícios de código. A função `stripCodeBlocks` zera o código sem alterar a contagem de linhas do arquivo!

---

### 3. Validação com o Objeto Nativo `URL` (`validateUrl`)
```javascript
function validateUrl(url) {
  url = url.trim();

  if (url.startsWith('#')) return null; // Ignora âncoras locais
  if (!/^https?:\/\//i.test(url)) return null; // Ignora links relativos locais (.md)

  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(url)) return pattern.reason;
  }

  try {
    const parsed = new URL(url); // Construtor nativo do V8 / Node.js
    if (!parsed.hostname || parsed.hostname.length < 2) {
      return 'Host inválido ou ausente';
    }
  } catch {
    return 'URL malformada (falha ao analisar estrutura HTTP)';
  }

  return null; // URL VÁLIDA
}
```

---

## 📊 Relatório de Erros e Código de Saída (`main`)

Se o script encontrar URLs inválidas, ele exibe um relatório formatado indicando o arquivo, a linha exata e a razão do erro, encerrando a execução com **`process.exit(1)`**:

```text
❌ URLs inválidas encontradas em 1 arquivo(s):

📄 documents/projetos/test.md
   Linha 14 [markdown link]: Parâmetro de query string sem valor
   URL: `https://api.exemplo.com/v1/users?token=`

Total: 1 URL(s) inválida(s). Corrija antes de sincronizar com o Notion.
```

Essa saída com `exit 1` faz com que o GitHub Actions pare imediatamente o workflow, evitando enviar dados corrompidos para o Notion.
