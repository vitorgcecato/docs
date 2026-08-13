# 🛠️ Guia Passo a Passo para Replicação do Zero

> **Módulo 5 do Guia Especialista em Engenharia de Software**  
> *Como Replicar Esta Arquitetura em Qualquer Repositório*

---

## 📌 Objetivo deste Guia

Este guia foi elaborado para que qualquer pessoa (desenvolvedor ou estudante) consiga **replicar exatamente o mesmo sistema de documentação automatizada** do zero em seu próprio repositório GitHub e conta do Notion.

---

## 📋 Pré-requisitos

1. Uma conta no [Notion](https://www.notion.so/).
2. Uma conta no [GitHub](https://github.com/).
3. Node.js (versão 18 ou superior) instalado na máquina local.

---

## 🛠️ Passo 1: Criar a Integração no Notion

1. Acesse o painel de integrações do Notion: [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations).
2. Clique no botão **`+ New integration` (Nova integração)**.
3. Preencha as informações:
   - **Name**: `GitHub Docs Sync` (ou o nome de sua preferência).
   - **Associated workspace**: Selecione o seu Workspace.
   - **Capabilities**: Marque as opções de *Read content*, *Update content* e *Insert content*.
4. Clique em **Submit** e copie o **Internal Integration Secret** (formato: `ntn_...`). Guarde essa chave!

---

## 🗄️ Passo 2: Criar o Banco de Dados (Wiki) no Notion

1. Crie uma nova página no Notion.
2. Digite `/database full page` (Banco de dados - página inteira).
3. Dê o nome de **Wiki de Documentos** (ou o título que preferir).
4. Adicione as seguintes **Propriedades (Properties)** com os nomes e tipos exatos:
   - **Nome** (ou Title): Tipo `Title` (Título nativo da página).
   - **Categoria**: Tipo `Select`.
   - **Subcategoria**: Tipo `Select`.
   - **Tipo**: Tipo `Select`.
   - **Github Path**: Tipo `Text` (Rich Text).
   - **Github URL**: Tipo `URL`.
   - **Última sincronização**: Tipo `Date`.

5. **IMPORTANTE - Conectar a Integração**:
   - No canto superior direito da página do Banco de Dados no Notion, clique no menu **`...`**.
   - Escolha **Conexões (Connections)** ➔ **Adicionar conexões**.
   - Selecione a integração criada no Passo 1 (`GitHub Docs Sync`) e confirme.

6. **Copiar o `NOTION_DATABASE_ID`**:
   - Copie o link da URL do seu Banco de Dados no navegador:
     `https://www.notion.so/workspace/3bbe980650d58055a739ce87403f08b7?v=...`
   - O ID é a sequência alfanumérica de 32 caracteres após a barra e antes do `?` (`3bbe980650d58055a739ce87403f08b7`).

---

## 📦 Passo 3: Configurar o Repositório GitHub

1. No seu repositório local, inicialize o `package.json` e instale as dependências:

```bash
npm init -y
npm install @notionhq/client @tryfabric/martian front-matter dotenv
```

2. Crie a pasta `scripts/` e adicione os arquivos:
   - `scripts/validate-links.js`
   - `scripts/sync-to-notion.js`
   - `scripts/sync-notion.js`

3. Crie o arquivo `.env` para testes locais:
```env
NOTION_TOKEN=ntn_sua_chave_aqui
NOTION_DATABASE_ID=seu_database_id_aqui
GITHUB_REPOSITORY=seu_usuario/seu_repositorio
GITHUB_BRANCH=main
```

4. Crie a estrutura da pasta de anotações:
```bash
mkdir -p documents/projetos/meu-projeto
```

---

## 🔐 Passo 4: Configurar os Secrets no GitHub

No seu repositório do GitHub:

1. Vá em **Settings** ➔ **Secrets and variables** ➔ **Actions**.
2. Clique em **New repository secret** e adicione:
   - **Nome**: `NOTION_TOKEN` | **Valor**: Sua chave `ntn_...`
   - **Nome**: `NOTION_DATABASE_ID` | **Valor**: O ID de 32 caracteres da sua Database.

3. Crie o arquivo de workflow `.github/workflows/sync-docs-notion.yml`.

---

## 🚀 Passo 5: Testando e Executando

### Teste Local:
```bash
# 1. Validar URLs
node scripts/validate-links.js

# 2. Sincronizar com o Notion
node scripts/sync-to-notion.js
```

### Teste via Git Push:
```bash
git add .
git commit -m "docs: adicionar primeira documentacao"
git push origin main
```

Acesse a aba **Actions** no GitHub para acompanhar a execução automática e veja suas páginas aparecendo organizadas na sua Wiki no Notion!
