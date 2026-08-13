require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('@notionhq/client');
const { markdownToBlocks } = require('@tryfabric/martian');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || process.env.NOTION_DATA_SOURCE_ID;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'vitorgcecato/docs';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || process.env.GITHUB_REF_NAME || 'main';

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error("❌ Erro: NOTION_TOKEN ou NOTION_DATABASE_ID / NOTION_DATA_SOURCE_ID ausentes.");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });
const stateFile = path.join(__dirname, 'notion-state.json');

let state = { folders: {}, files: {}, hashes: {} };
if (fs.existsSync(stateFile)) {
  try {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (!state.hashes) state.hashes = {};
    if (!state.files) state.files = {};
  } catch (e) {
    console.warn("⚠️ Não foi possível ler notion-state.json, iniciando estado novo.");
  }
}

function getHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

function sortAlphabetically(files) {
  return files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  sortAlphabetically(files);

  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.github' && file !== 'scripts') {
        findMarkdownFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function clearPageContent(pageId) {
  let hasMore = true;
  let cursor = undefined;
  while (hasMore) {
    const res = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor });
    
    for (const block of res.results) {
      try {
        await notion.blocks.delete({ block_id: block.id });
      } catch (e) {
        console.warn(`[AVISO] Falha ao deletar bloco ${block.id}: ${e.message}`);
      }
    }
    
    hasMore = res.has_more;
    cursor = res.next_cursor;
  }
}

function flattenDeepBlocks(blocks, currentDepth = 0) {
  let flattened = [];
  for (const block of blocks) {
    let children = null;
    const type = block.type;
    if (block[type] && block[type].children) {
      children = block[type].children;
      if (currentDepth >= 2) {
        delete block[type].children;
      }
    }
    
    flattened.push(block);

    if (children && children.length > 0) {
      if (currentDepth >= 2) {
        const flattenedChildren = flattenDeepBlocks(children, currentDepth);
        flattened.push(...flattenedChildren);
      } else {
        block[type].children = flattenDeepBlocks(children, currentDepth + 1);
      }
    }
  }
  return flattened;
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function getDocumentType(fileName) {
  const lower = fileName.toLowerCase();
  if (lower === 'readme.md' || lower === '00-introducao.md') return 'README';
  if (lower === 'changelog.md' || lower === 'change-log.md') return 'Changelog';
  return 'Documento';
}

function getGithubUrl(relativePath) {
  if (!GITHUB_REPOSITORY) return null;
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
  return `https://github.com/${GITHUB_REPOSITORY}/blob/${GITHUB_BRANCH}/${encodedPath}`;
}

async function ensurePageExists(relativePath, fileDir, fileName, retry = false) {
  let notionPageId = state.files[relativePath];
  
  if (!notionPageId || retry) {
    if (!retry) console.log(`[CRIANDO] Página no Notion para: ${relativePath}`);
    else console.log(`[RECRIANDO] Página inacessível ou arquivada detectada, recriando: ${relativePath}`);
    
    const normalizedDir = fileDir.replace(/\\/g, '/');
    
    let effectiveDir = normalizedDir;
    if (effectiveDir === 'documents' || effectiveDir.startsWith('documents/')) {
      effectiveDir = effectiveDir.replace(/^documents\/?/, '');
    }

    const rootDir = (effectiveDir === '.' || effectiveDir === '') ? 'Raiz' : effectiveDir.split('/')[0];
    const subDirs = (effectiveDir === '.' || effectiveDir === '' || effectiveDir.split('/').length <= 1)
      ? null
      : effectiveDir.split('/').slice(1).join('/');

    const docType = getDocumentType(path.basename(relativePath));
    const githubUrl = getGithubUrl(relativePath);
    
    const properties = {
      "Nome": { title: [{ text: { content: fileName } }] },
      "Categoria": { select: { name: rootDir } },
      "Tipo": { select: { name: docType } },
      "Github Path": { rich_text: [{ text: { content: relativePath } }] },
      "Última sincronização": { date: { start: new Date().toISOString() } }
    };

    if (subDirs) {
      properties["Subcategoria"] = { select: { name: subDirs } };
    } else {
      properties["Subcategoria"] = { select: null };
    }

    if (githubUrl) {
      properties["Github URL"] = { url: githubUrl };
    }
    
    try {
      const response = await notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: properties,
        icon: {
          type: "emoji",
          emoji: docType === 'README' ? '📘' : docType === 'Changelog' ? '📋' : '📄'
        }
      });
      notionPageId = response.id;
      state.files[relativePath] = notionPageId;
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      console.error(`[ERRO NA CRIAÇÃO] Erro ao criar página para ${relativePath}:`, e.message);
      throw e;
    }
  }
  return notionPageId;
}

async function updatePageContent(relativePath, filePath, docsDir, notionPageId, retry = false) {
  console.log(`[SYNC] Sincronizando conteúdo de: ${relativePath}`);
  
  try {
    await clearPageContent(notionPageId);
  } catch (e) {
    const isGone = e.message.includes('archived')
      || e.code === 'object_not_found'
      || e.status === 403
      || (e.message && e.message.includes('403'));
    if (isGone && !retry) {
      console.log(`[RECRIANDO] Página inacessível (${e.status || e.code}), recriando: ${relativePath}`);
      const fileDir = path.dirname(relativePath);
      const fileName = path.basename(filePath, '.md');
      const newId = await ensurePageExists(relativePath, fileDir, fileName, true);
      return await updatePageContent(relativePath, filePath, docsDir, newId, true);
    }
    throw e;
  }

  const fileDir = path.dirname(relativePath);
  let markdownBody = fs.readFileSync(filePath, 'utf8');

  const githubUrl = getGithubUrl(relativePath);
  if (githubUrl && !markdownBody.includes('Ver documento original no GitHub')) {
    markdownBody += `\n\n---\n\n> 🔗 [Ver documento original no GitHub](${githubUrl})`;
  }

  markdownBody = markdownBody.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) {
      return match;
    }

    if (url.startsWith('file://')) {
      const urlPath = url.replace('file://', '');
      const parts = urlPath.split('/');
      const repoName = parts[0];
      const filePathInRepo = parts.slice(1).join('/');
      return `[${text}](https://github.com/vitorgcecato/${repoName}/blob/main/${filePathInRepo})`;
    }

    let cleanUrl = url.split('#')[0];
    if (!cleanUrl) return text;

    const absoluteTarget = path.resolve(docsDir, fileDir, cleanUrl);
    let relativeTarget = path.relative(docsDir, absoluteTarget);
    if (relativeTarget === '') relativeTarget = '.';

    if (state.files[relativeTarget]) {
      const notionId = state.files[relativeTarget].replace(/-/g, '');
      return `[${text}](https://notion.so/${notionId})`;
    }

    return `[${text}](https://github.com/vitorgcecato/docs/blob/main/${relativeTarget})`;
  });

  let blocks = markdownToBlocks(markdownBody);
  blocks = flattenDeepBlocks(blocks, 0);

  const wrapperResponse = await notion.blocks.children.append({
    block_id: notionPageId,
    children: [
      {
        object: 'block',
        type: 'synced_block',
        synced_block: {
          synced_from: null,
          children: []
        }
      }
    ]
  });

  const containerId = wrapperResponse.results[0].id;

  const blockChunks = chunkArray(blocks, 100);
  for (const chunk of blockChunks) {
    await notion.blocks.children.append({
      block_id: containerId,
      children: chunk
    });
  }

  try {
    await notion.pages.update({
      page_id: notionPageId,
      properties: {
        "Última sincronização": { date: { start: new Date().toISOString() } }
      }
    });
  } catch (e) {
    console.warn(`[AVISO] Não foi possível atualizar data de sincronização: ${e.message}`);
  }
  
  console.log(`[SUCESSO] ${relativePath} sincronizado com sucesso!`);
  
  state.hashes[relativePath] = getHash(fs.readFileSync(filePath, 'utf8'));
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
}

async function processFiles() {
  const docsDir = path.join(__dirname, '..');
  const mdFilesAbsolute = findMarkdownFiles(docsDir);
  
  const relativeFiles = sortAlphabetically(mdFilesAbsolute.map(f => path.relative(docsDir, f)));
  const localFiles = new Set(relativeFiles);

  const changelog = { deleted: [], created: [], updated: [] };

  if (process.env.HARD_REBASE === 'true') {
    console.log('--- ⚠️ INICIANDO HARD REBASE (LIMPANDO NOTION) ---');
    let hasMore = true;
    let cursor = undefined;
    while (hasMore) {
      const res = await notion.search({
        filter: { property: 'object', value: 'page' },
        start_cursor: cursor
      });
      for (const page of res.results) {
        try {
          await notion.pages.update({ page_id: page.id, archived: true });
        } catch (e) {
          console.error(`Falha ao arquivar página ${page.id}:`, e.message);
        }
      }
      hasMore = res.has_more;
      cursor = res.next_cursor;
    }
    console.log('--- NOTION LIMPO, RESETANDO ESTADO ---');
    state = { folders: {}, files: {}, hashes: {} };
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
  }

  for (const relativePath of Object.keys(state.files)) {
    if (!localFiles.has(relativePath)) {
      console.log(`[DELETANDO] Arquivo não encontrado localmente. Arquivando no Notion: ${relativePath}`);
      try {
        await notion.pages.update({
          page_id: state.files[relativePath],
          archived: true
        });
        if (relativePath !== 'changelog.md') changelog.deleted.push(relativePath);
        console.log(`[SUCESSO] ${relativePath} arquivado no Notion.`);
      } catch (e) {
        console.error(`[AVISO] Não foi possível arquivar ${relativePath}:`, e.message);
      }
      delete state.files[relativePath];
      if (state.hashes) delete state.hashes[relativePath];
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
    }
  }

  console.log('\n--- FASE 1: VERIFICANDO E CRIANDO PÁGINAS NO NOTION ---');
  for (const relativePath of localFiles) {
    const filePath = path.join(docsDir, relativePath);
    const fileDir = path.dirname(relativePath);
    const fileName = path.basename(filePath, '.md');
    const isNew = !state.files[relativePath];
    try {
      await ensurePageExists(relativePath, fileDir, fileName);
      if (isNew && relativePath !== 'changelog.md') changelog.created.push(relativePath);
    } catch (error) {
      console.error(`[ERRO NA CRIAÇÃO] ${relativePath}:`, error.message);
    }
  }

  console.log('\n--- FASE 2: SINCRONIZANDO CONTEÚDO E LINKS ---');
  let modifiedCount = 0;
  let failedFiles = [];
  for (const relativePath of localFiles) {
    const filePath = path.join(docsDir, relativePath);
    try {
      const notionPageId = state.files[relativePath];
      if (notionPageId) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const currentHash = getHash(fileContent);
        
        const isForceSync = process.env.FORCE_FULL_SYNC === 'true';

        if (isForceSync || state.hashes[relativePath] !== currentHash) {
          if (!isForceSync && !changelog.created.includes(relativePath) && relativePath !== 'changelog.md') {
            changelog.updated.push(relativePath);
          }
          await updatePageContent(relativePath, filePath, docsDir, notionPageId);
          modifiedCount++;
        } else {
          console.log(`[PULANDO] ${relativePath} sem alterações.`);
        }
      }
    } catch (error) {
      console.error(`[ERRO NO SYNC] ${relativePath}:`, error.message);
      failedFiles.push(relativePath);
    }
  }

  if (changelog.created.length > 0 || changelog.updated.length > 0 || changelog.deleted.length > 0) {
    const changelogPath = path.join(docsDir, 'changelog.md');

    const header = `# Changelog da Documentação\n\nEste arquivo mantém um registro automatizado de todas as modificações, criações e exclusões de arquivos de documentação neste repositório.\n\nAs entradas abaixo são geradas automaticamente sempre que a documentação é sincronizada com o Notion.\n\n---\n\n`;

    const existingContent = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : header;

    const headerEnd = existingContent.indexOf('---\n\n');
    const bodyOnly = headerEnd !== -1 ? existingContent.slice(headerEnd + 5) : existingContent;

    const today = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let block = `## Sincronização: ${today} (UTC)\n\n`;

    if (changelog.created.length > 0) {
      block += `### 🟢 Arquivos Criados\n`;
      sortAlphabetically(changelog.created).forEach(f => block += `- \`${f}\`\n`);
      block += `\n`;
    }
    if (changelog.updated.length > 0) {
      block += `### 🟡 Arquivos Atualizados\n`;
      sortAlphabetically(changelog.updated).forEach(f => block += `- \`${f}\`\n`);
      block += `\n`;
    }
    if (changelog.deleted.length > 0) {
      block += `### 🔴 Arquivos Deletados\n`;
      sortAlphabetically(changelog.deleted).forEach(f => block += `- \`${f}\`\n`);
      block += `\n`;
    }

    const content = header + block + '---\n\n' + bodyOnly.replace(/^\n+/, '');

    fs.writeFileSync(changelogPath, content, 'utf8');
    
    if (state.files['changelog.md']) {
      console.log('\n[CHANGELOG] Enviando o novo changelog.md para o Notion...');
      await updatePageContent('changelog.md', changelogPath, docsDir, state.files['changelog.md']);
    }
  }

  console.log(`\n🎉 Processamento concluído. ${modifiedCount} arquivo(s) atualizado(s).`);

  if (failedFiles.length > 0) {
    console.error(`\n❌ ${failedFiles.length} arquivo(s) falharam no sync:`);
    failedFiles.forEach(f => console.error(`   - ${f}`));
    process.exit(1);
  }
}

processFiles();
