# 📚 Guia Especialista: Sincronização de Conhecimento GitHub ➔ Notion

> **Documentação Técnica Completa e Arquitetura do Repositório**  
> *Projetado para Estudo, Compreensão Profunda e Replicação de Sistemas de Documentação Automatizados.*

---

## 🧭 Sumário dos Módulos

Esta série documental é dividida em 5 módulos detalhados, cobrindo da arquitetura de software ao código-fonte linha por linha e instruções de replicação:

1. **[Módulo 1: Visão Geral da Arquitetura & Conceitos Fundamentais](./01-visao-geral-arquitetura.md)**
   - Filosofia da Fonte da Verdade (GitHub como dado, Notion como interface).
   - Fluxo de dados e diagramas de arquitetura.
   - Convenções de categorização de pastas e esquema da Database.

2. **[Módulo 2: GitHub Actions e Workflows](./02-github-actions-workflows.md)**
   - Análise detalhada de `.github/workflows/sync-docs-notion.yml`.
   - Filtragem por caminhos (`paths`), gatilhos manuais (`workflow_dispatch`).
   - Mecanismo resiliente de retentativas em shell script e auto-commit de metadados.

3. **[Módulo 3: Validação de Links (`validate-links.js`)](./03-script-validacao-links.md)**
   - Linter pré-sincronização de URLs.
   - Expressões regulares (`BARE_URL_REGEX`, `MD_LINK_REGEX`).
   - Remoção inteligente de código inline/fenced (`stripCodeBlocks`) e tratamento de erros.

4. **[Módulo 4: Mecanismo de Sincronização (`sync-to-notion.js`)](./04-script-sincronizacao-notion.md)**
   - Motor de conversão AST Markdown ➔ Notion Blocks (`@tryfabric/martian`).
   - A técnica do `synced_block` para exclusão de páginas em sub-segundos.
   - Caching por Hashing MD5, tradução automática de links relativos e geração do Changelog.

5. **[Módulo 5: Guia de Replicação do Zero](./05-guia-passo-a-passo-replicacao.md)**
   - Passo a passo completo para criar a integração no Notion, configurar o Banco de Dados, definir Secrets no GitHub e rodar em qualquer repositório.

---

## 🛠️ Tecnologias Utilizadas

<p align="center">
  <img src="https://skillicons.dev/icons?i=nodejs,github,githubactions,notion,markdown,js" />
</p>

* **Node.js (v22)**: Execução dos scripts de sincronização e validação.
* **@notionhq/client (v5)**: SDK oficial da API do Notion.
* **@tryfabric/martian**: Parser AST Markdown para blocos de dados do Notion.
* **GitHub Actions**: Pipeline de CI/CD para disparos automáticos via git push.
