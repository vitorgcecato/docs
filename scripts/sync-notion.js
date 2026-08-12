const fs = require("fs");
const path = require("path");
const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const ROOT_PAGE_ID = process.env.NOTION_PARENT_ID;
const DOCS_DIR = path.resolve("documents");

const NOTION_VERSION = "2026-03-11";

/*
 * Estrutura esperada:
 *
 * docs/
 * ├── React/
 * │   ├── hooks/
 * │   │   ├── useState.md
 * │   │   └── useEffect.md
 * │   └── componentes.md
 * └── Git/
 *     └── branches.md
 *
 * No Notion:
 *
 * Base de Conhecimento
 * ├── React
 * │   ├── hooks
 * │   │   ├── useState
 * │   │   └── useEffect
 * │   │
 * │   └── componentes
 * └── Git
 *     └── branches
 *
 * Recursos:
 * - Criação automática de páginas/pastas
 * - Atualização automática dos .md
 * - Arquivos apagados no GitHub -> lixeira do Notion
 * - Pastas vazias/removidas -> lixeira do Notion
 * - Markdown nativo do Notion
 * - Ícones automáticos
 * - Paginação da API
 */

function normalizeName(name) {
  return name
    .trim()
    .replace(/\.md$/i, "");
}

function normalizePath(relativePath) {
  return relativePath
    .split(path.sep)
    .join("/")
    .replace(/^\.\//, "");
}

function getFilesRecursive(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  const result = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      result.push(...getFilesRecursive(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".md")
    ) {
      result.push(fullPath);
    }
  }

  return result;
}

function getDirectoriesRecursive(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  const result = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    result.push(fullPath);
    result.push(...getDirectoriesRecursive(fullPath));
  }

  return result;
}

function getPageTitle(page) {
  if (!page.properties) {
    return null;
  }

  const titleProperty = Object.values(page.properties).find(
    (property) => property.type === "title"
  );

  if (!titleProperty?.title) {
    return null;
  }

  return titleProperty.title
    .map((item) => item.plain_text)
    .join("");
}

async function getChildren(parentId) {
  const children = [];

  let cursor = undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: parentId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    children.push(...response.results);

    cursor = response.has_more
      ? response.next_cursor
      : undefined;
  } while (cursor);

  return children;
}

async function findChildPage(parentId, title) {
  const children = await getChildren(parentId);

  for (const child of children) {
    if (child.type !== "child_page") {
      continue;
    }

    if (child.child_page.title === title) {
      return child;
    }
  }

  return null;
}

async function findAllChildPages(parentId) {
  const children = await getChildren(parentId);

  return children.filter(
    (child) => child.type === "child_page"
  );
}

async function createFolder(parentId, title) {
  console.log(`📁 Criando pasta: ${title}`);

  const page = await notion.pages.create({
    parent: {
      page_id: parentId,
    },

    icon: {
      type: "emoji",
      emoji: "📁",
    },

    properties: {
      title: [
        {
          type: "text",
          text: {
            content: title,
          },
        },
      ],
    },
  });

  return page;
}

async function createDocument(parentId, title, markdown) {
  console.log(`📄 Criando documento: ${title}`);

  const page = await notion.pages.create({
    parent: {
      page_id: parentId,
    },

    icon: {
      type: "emoji",
      emoji: "📄",
    },

    markdown,
  });

  return page;
}

async function updateDocument(pageId, markdown) {
  console.log(`✏️ Atualizando documento: ${pageId}`);

  await notion.pages.updateMarkdown({
    page_id: pageId,

    type: "replace_content",

    replace_content: {
      new_str: markdown,
    },
  });
}

async function trashPage(pageId, title) {
  console.log(`🗑️ Enviando para a lixeira: ${title}`);

  await notion.pages.update({
    page_id: pageId,
    in_trash: true,
  });
}

async function getOrCreateFolder(parentId, title) {
  const existing = await findChildPage(parentId, title);

  if (existing) {
    return existing.id;
  }

  const created = await createFolder(parentId, title);

  return created.id;
}

function buildExpectedStructure() {
  const expectedFolders = new Set();
  const expectedDocuments = new Set();

  const markdownFiles = getFilesRecursive(DOCS_DIR);

  for (const filePath of markdownFiles) {
    const relativePath = normalizePath(
      path.relative(DOCS_DIR, filePath)
    );

    const parts = relativePath.split("/");

    const fileName = parts.pop();

    const folders = parts;

    let currentPath = "";

    for (const folder of folders) {
      currentPath = currentPath
        ? `${currentPath}/${folder}`
        : folder;

      expectedFolders.add(currentPath);
    }

    const documentPath = folders.length
      ? `${folders.join("/")}/${normalizeName(fileName)}`
      : normalizeName(fileName);

    expectedDocuments.add(documentPath);
  }

  /*
   * Se existir uma pasta sem nenhum .md diretamente abaixo,
   * ela ainda pode ser necessária por possuir subpastas.
   *
   * Para isso, coletamos todas as pastas existentes em docs/.
   */
  const directories = getDirectoriesRecursive(DOCS_DIR);

  for (const directory of directories) {
    const relativeDirectory = normalizePath(
      path.relative(DOCS_DIR, directory)
    );

    if (relativeDirectory) {
      expectedFolders.add(relativeDirectory);
    }
  }

  return {
    expectedFolders,
    expectedDocuments,
  };
}

async function syncPath(parentId, currentRelativePath, localPath) {
  const entries = fs.readdirSync(localPath, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(localPath, entry.name);

    if (entry.isDirectory()) {
      const relativeFolderPath = currentRelativePath
        ? `${currentRelativePath}/${entry.name}`
        : entry.name;

      const folderPage = await findChildPage(
        parentId,
        entry.name
      );

      let folderId;

      if (folderPage) {
        folderId = folderPage.id;
      } else {
        const created = await createFolder(
          parentId,
          entry.name
        );

        folderId = created.id;
      }

      await syncPath(
        folderId,
        relativeFolderPath,
        fullPath
      );

      continue;
    }

    if (
      !entry.isFile() ||
      !entry.name.toLowerCase().endsWith(".md")
    ) {
      continue;
    }

    const title = normalizeName(entry.name);

    const relativeDocumentPath = currentRelativePath
      ? `${currentRelativePath}/${title}`
      : title;

    const markdown = fs.readFileSync(fullPath, "utf8");

    const existing = await findChildPage(
      parentId,
      title
    );

    if (!existing) {
      await createDocument(
        parentId,
        title,
        markdown
      );

      continue;
    }

    await updateDocument(
      existing.id,
      markdown
    );

    console.log(
      `✅ Sincronizado: ${relativeDocumentPath}`
    );
  }
}

async function cleanupDeletedContent(
  parentId,
  currentRelativePath,
  localPath,
  expectedFolders,
  expectedDocuments
) {
  const notionPages = await findAllChildPages(parentId);

  for (const page of notionPages) {
    const title = page.child_page.title;

    /*
     * Descobrimos se a página representa uma pasta
     * ou documento comparando com a estrutura esperada.
     *
     * Como o Notion não possui aqui um "tipo customizado"
     * nosso, fazemos a distinção pelo caminho.
     */

    const possibleDocumentPath = currentRelativePath
      ? `${currentRelativePath}/${title}`
      : title;

    const possibleFolderPath = possibleDocumentPath;

    const isExpectedDocument =
      expectedDocuments.has(possibleDocumentPath);

    const isExpectedFolder =
      expectedFolders.has(possibleFolderPath);

    if (isExpectedDocument || isExpectedFolder) {
      /*
       * Se for pasta, entramos nela para conferir seus filhos.
       */
      if (isExpectedFolder) {
        const localFolderPath = path.join(
          DOCS_DIR,
          ...possibleFolderPath.split("/")
        );

        if (fs.existsSync(localFolderPath)) {
          await cleanupDeletedContent(
            page.id,
            possibleFolderPath,
            localFolderPath,
            expectedFolders,
            expectedDocuments
          );
        }
      }

      continue;
    }

    /*
     * Aqui chegamos a uma página que existe no Notion,
     * mas não existe mais na estrutura do GitHub.
     */
    await trashPage(
      page.id,
      possibleDocumentPath
    );
  }
}

async function main() {
  if (!process.env.NOTION_TOKEN) {
    throw new Error(
      "❌ NOTION_TOKEN não configurado."
    );
  }

  if (!ROOT_PAGE_ID) {
    throw new Error(
      "❌ NOTION_PARENT_ID não configurado."
    );
  }

  if (!fs.existsSync(DOCS_DIR)) {
    throw new Error(
      `❌ Diretório não encontrado: ${DOCS_DIR}`
    );
  }

  console.log("🚀 Iniciando sincronização...");
  console.log(`📂 Diretório: ${DOCS_DIR}`);
  console.log(
    `🔗 Página raiz: ${ROOT_PAGE_ID}`
  );
  console.log(
    `🧩 Notion API: ${NOTION_VERSION}`
  );

  const {
    expectedFolders,
    expectedDocuments,
  } = buildExpectedStructure();

  const markdownFiles = getFilesRecursive(
    DOCS_DIR
  );

  console.log(
    `🔎 Encontrados ${markdownFiles.length} arquivos Markdown.`
  );

  /*
   * 1. Cria/atualiza tudo que existe no GitHub.
   */
  await syncPath(
    ROOT_PAGE_ID,
    "",
    DOCS_DIR
  );

  /*
   * 2. Remove do Notion o que não existe mais no GitHub.
   */
  console.log(
    "🧹 Verificando conteúdo removido..."
  );

  await cleanupDeletedContent(
    ROOT_PAGE_ID,
    "",
    DOCS_DIR,
    expectedFolders,
    expectedDocuments
  );

  console.log(
    "✅ Sincronização concluída com sucesso!"
  );
}

main().catch((error) => {
  console.error(
    "\n❌ Erro durante a sincronização:"
  );

  if (error.body) {
    console.error(
      JSON.stringify(
        error.body,
        null,
        2
      )
    );
  } else {
    console.error(error);
  }

  process.exit(1);
});