const fs = require("fs");
const path = require("path");
const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const ROOT_PAGE_ID = process.env.NOTION_PARENT_ID;
const DOCS_DIR = path.resolve("docs");

function normalizeName(name) {
  return name
    .trim()
    .replace(/\.md$/i, "");
}

function getTitle(page) {
  const titleProperty = Object.values(page.properties || {}).find(
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
      start_cursor: cursor,
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

async function getOrCreateFolder(parentId, title) {
  const existing = await findChildPage(parentId, title);

  if (existing) {
    return existing.id;
  }

  const created = await createFolder(parentId, title);

  return created.id;
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

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      result.push(fullPath);
    }
  }

  return result;
}

async function syncFile(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath);

  const parts = relativePath.split(path.sep);

  const fileName = parts.pop();

  const folders = parts;

  let parentId = ROOT_PAGE_ID;

  // Cria/encontra as pastas
  for (const folder of folders) {
    parentId = await getOrCreateFolder(parentId, folder);
  }

  const title = normalizeName(fileName);

  const markdown = fs.readFileSync(filePath, "utf8");

  const existing = await findChildPage(parentId, title);

  if (!existing) {
    await createDocument(parentId, title, markdown);
    return;
  }

  await updateDocument(existing.id, markdown);
}

async function main() {
  if (!process.env.NOTION_TOKEN) {
    throw new Error("NOTION_TOKEN não configurado.");
  }

  if (!ROOT_PAGE_ID) {
    throw new Error("NOTION_PARENT_ID não configurado.");
  }

  if (!fs.existsSync(DOCS_DIR)) {
    throw new Error(`Diretório não encontrado: ${DOCS_DIR}`);
  }

  const files = getFilesRecursive(DOCS_DIR);

  console.log(`🔎 Encontrados ${files.length} arquivos Markdown.`);

  for (const file of files) {
    await syncFile(file);
  }

  console.log("✅ Sincronização concluída.");
}

main().catch((error) => {
  console.error("❌ Erro durante a sincronização:");
  console.error(error);

  process.exit(1);
});