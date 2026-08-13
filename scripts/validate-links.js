/**
 * validate-links.js
 *
 * Valida todas as URLs encontradas nos arquivos .md antes do sync com o Notion.
 * Detecta URLs malformadas, incompletas ou inválidas que causariam erros na API do Notion.
 *
 * Uso: node scripts/validate-links.js
 */

const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..');

// Regex para capturar URLs "soltas" no texto (não dentro de markdown links)
const BARE_URL_REGEX = /(?<!\]\()https?:\/\/[^\s)\]"'<>]+/g;

// Regex para capturar URLs dentro de markdown links: [texto](url)
const MD_LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;

// Padrões considerados URLs claramente incompletas/inválidas
const INVALID_PATTERNS = [
  { test: (url) => /\/html\/rfc[^0-9]/.test(url) || /\/html\/rfc$/.test(url), reason: 'URL de RFC incompleta (faltando número do RFC)' },
  { test: (url) => /[?&][a-zA-Z0-9_]+=\s*$/.test(url.trim()), reason: 'Parâmetro de query string sem valor' },
  { test: (url) => /^https?:\/\/$/.test(url), reason: 'URL sem host (apenas scheme)' },
  { test: (url) => /^https?:\/\/[^\s]+\s+[^\s]/.test(url), reason: 'URL com espaço não codificado' },
];

function findMarkdownFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir).sort();
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.git', '.github', 'scripts'].includes(entry)) {
        findMarkdownFiles(fullPath, fileList);
      }
    } else if (entry.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function validateUrl(url) {
  url = url.trim();

  if (url.startsWith('#')) return null;
  if (!/^https?:\/\//i.test(url)) return null;

  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(url)) {
      return pattern.reason;
    }
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname || parsed.hostname.length < 2) {
      return 'Host inválido ou ausente';
    }
  } catch {
    return 'URL malformada (não passou no parse)';
  }

  return null;
}

function stripCodeBlocks(content) {
  content = content.replace(/```[\s\S]*?```/g, (match) => '\n'.repeat(match.split('\n').length - 1));
  content = content.replace(/`[^`\n]+`/g, (match) => ' '.repeat(match.length));
  return content;
}

function validateFile(filePath) {
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const content = stripCodeBlocks(rawContent);
  const errors = [];

  let match;
  MD_LINK_REGEX.lastIndex = 0;
  const fullText = content;
  while ((match = MD_LINK_REGEX.exec(fullText)) !== null) {
    const url = match[2].trim();
    const lineNum = fullText.slice(0, match.index).split('\n').length;
    if (/^https?:\/\//i.test(url)) {
      const reason = validateUrl(url);
      if (reason) {
        errors.push({ line: lineNum, url, reason, context: 'markdown link' });
      }
    }
  }

  const textWithoutMdLinks = fullText.replace(MD_LINK_REGEX, (m) => ' '.repeat(m.length));
  BARE_URL_REGEX.lastIndex = 0;
  while ((match = BARE_URL_REGEX.exec(textWithoutMdLinks)) !== null) {
    const url = match[0].trim().replace(/[.,;:!?)\]]+$/, '');
    const lineNum = textWithoutMdLinks.slice(0, match.index).split('\n').length;
    const reason = validateUrl(url);
    if (reason) {
      errors.push({ line: lineNum, url, reason, context: 'URL no texto' });
    }
  }

  return errors;
}

function main() {
  const files = findMarkdownFiles(docsDir);
  let totalErrors = 0;
  const report = [];

  for (const filePath of files) {
    const relativePath = path.relative(docsDir, filePath);
    const errors = validateFile(filePath);
    if (errors.length > 0) {
      totalErrors += errors.length;
      report.push({ file: relativePath, errors });
    }
  }

  if (report.length === 0) {
    console.log('✅ Nenhuma URL inválida encontrada nos arquivos Markdown.');
    process.exit(0);
  }

  console.error(`\n❌ URLs inválidas encontradas em ${report.length} arquivo(s):\n`);
  for (const { file, errors } of report) {
    console.error(`📄 ${file}`);
    for (const { line, url, reason, context } of errors) {
      console.error(`   Linha ${line} [${context}]: ${reason}`);
      console.error(`   URL: ${url}`);
    }
    console.error('');
  }

  console.error(`Total: ${totalErrors} URL(s) inválida(s). Corrija antes de sincronizar com o Notion.`);
  process.exit(1);
}

main();
