# ⚙️ GitHub Actions: Automação & CI/CD Workflow

> **Módulo 2 do Guia Especialista em Engenharia de Software**  
> *Estudo Detalhado do Workflow `.github/workflows/sync-docs-notion.yml`*

---

## 📌 O que é o GitHub Actions neste Projeto?

O **GitHub Actions** é a ferramenta de automação responsável por interceptar eventos de alteração de código (`git push`) e disparar os scripts Node.js que mantêm o Notion atualizado sem que o desenvolvedor precise rodar comandos manuais.

---

## 📄 Código Completo do Workflow

O arquivo principal reside em [`.github/workflows/sync-docs-notion.yml`](../../.github/workflows/sync-docs-notion.yml):

```yaml
name: Sync Docs to Notion

on:
  push:
    branches:
      - main
    paths:
      - '**/*.md'
  workflow_dispatch:
    inputs:
      force_full_sync:
        description: 'Forçar Sincronização Completa (Ignorar Cache MD5)'
        required: false
        type: boolean
        default: false
      hard_rebase:
        description: '⚠️ CUIDADO: HARD REBASE (Apaga TUDO e recria a documentação do zero no Notion)'
        required: false
        type: boolean
        default: false

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 2
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install Dependencies
        run: npm install

      - name: Validar URLs nos arquivos Markdown
        run: node scripts/validate-links.js

      - name: Sync to Notion Database
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
          NOTION_DATA_SOURCE_ID: ${{ secrets.NOTION_DATA_SOURCE_ID }}
          GITHUB_REPOSITORY: ${{ github.repository }}
          GITHUB_BRANCH: ${{ github.ref_name }}
          FORCE_FULL_SYNC: ${{ github.event.inputs.force_full_sync }}
          HARD_REBASE: ${{ github.event.inputs.hard_rebase }}
        run: |
          MAX_ATTEMPTS=3
          ATTEMPT=1
          until node scripts/sync-to-notion.js; do
            EXIT_CODE=$?
            if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
              echo "❌ Sync falhou após $MAX_ATTEMPTS tentativas."
              exit $EXIT_CODE
            fi
            echo "⚠️  Tentativa $ATTEMPT falhou (código $EXIT_CODE). Aguardando 30s antes de tentar novamente..."
            sleep 30
            ATTEMPT=$((ATTEMPT + 1))
          done

      - name: Commit Updated Metadata
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update notion sync state and changelog [skip ci]"
```

---

## 🔍 Análise Linha por Linha do Workflow

### 1. Gatilhos (`on:`)
- **`push.branches: [main]`**: O workflow só é acionado quando commits são enviados para a branch principal `main`.
- **`push.paths: ['**/*.md']`**: **Otimização crítica!** O GitHub Actions só será iniciado se pelo menos um arquivo `.md` for modificado. Commits em arquivos `.js`, `.json` ou de configuração não gastam minutos de CI/CD à toa.
- **`workflow_dispatch`**: Permite disparar o workflow manualmente pela interface do GitHub (Aba *Actions*), fornecendo seletores booleanos para:
  - `force_full_sync`: Força o recarregamento de todo o conteúdo no Notion ignorando o cache MD5.
  - `hard_rebase`: Apaga todas as páginas da Wiki no Notion e recria a estrutura do zero.

### 2. Permissões (`permissions:`)
- **`contents: write`**: Concede permissão para o bot do GitHub Actions salvar e fazer commit das alterações nos arquivos `scripts/notion-state.json` e `changelog.md` de volta no repositório.

### 3. Passos de Execução (`steps:`)

#### A. Checkout do Repositório (`actions/checkout@v4`)
```yaml
- name: Checkout Repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 2
    token: ${{ secrets.GITHUB_TOKEN }}
```
Baixa o código do repositório no runner Linux. Definimos `fetch-depth: 2` para que o Git saiba comparar o commit atual com o anterior.

#### B. Instalação do Node.js (`actions/setup-node@v4`)
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
```
Prepara o ambiente com Node.js versão 22 LTS.

#### C. Validação de URLs (`node scripts/validate-links.js`)
Garante que nenhum link inválido ou malformado quebre a execução antes de chamar a API do Notion.

#### D. Loop de Retentativa Resiliente (Retry Mechanism)
```bash
MAX_ATTEMPTS=3
ATTEMPT=1
until node scripts/sync-to-notion.js; do
  EXIT_CODE=$?
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo "❌ Sync falhou após $MAX_ATTEMPTS tentativas."
    exit $EXIT_CODE
  fi
  echo "⚠️ Tentativa $ATTEMPT falhou... Aguardando 30s..."
  sleep 30
  ATTEMPT=$((ATTEMPT + 1))
done
```
**Por que este script em Shell é vital?**  
APIs de nuvem como a do Notion podem sofrer instabilidades temporárias ou atingir limites de taxa (*rate-limiting / 429 Too Many Requests*). O comando `until ... do` executa o script e, se o código de saída for diferente de `0` (erro), ele aguarda 30 segundos e tenta novamente até 3 vezes antes de marcar a pipeline como falha.

#### E. Auto-Commit de Metadados (`stefanzweifel/git-auto-commit-action@v5`)
Após o término do sync, os arquivos `scripts/notion-state.json` e `changelog.md` foram alterados. Esta ação faz o commit automático dessas alterações para a branch `main` com a tag `[skip ci]` para evitar loops infinitos de disparo da Action.
