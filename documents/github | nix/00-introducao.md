# 🦋 Projeto Partículas (Linktree Animado de Borboletas)

> **Documentação de Estudo & Análise Técnica do Projeto**  
> *Localização original do código-fonte: `programa/particulas`*

---

## 📌 Visão Geral do Projeto

O **Projeto Partículas** é uma aplicação **React 19 + Vite** que funciona como uma página de links (estilo *Linktree*), combinando elementos visuais interativos avançados:

1. **Fundo Dinâmico de Partículas SVG**: Borboletas vetorizadas flutuantes que sobem pela tela com tamanhos, velocidades, opacidades e movimentos horizontais gerados aleatoriamente.
2. **Sistema de Animações CSS com Variáveis Dinâmicas**: Utilização de CSS Custom Properties (`--size`, `--duration`, `--delay`, etc.) passadas diretamente pelo React no atributo `style`.
3. **Mudança de Tema Reativa (Hover & Modal)**: Transição visual de cores e iluminação de fundo ao passar o mouse ou abrir o modal de *Cardápio de Doações*.
4. **Componentes Reutilizáveis**: Sistema modular com `Card.jsx` e `ButterflyIcon.jsx`.

---

## 🧭 Sumário das Anotações de Estudo

Esta documentação analisa **apenas os arquivos que estão em uso ativo no projeto**:

1. **[00-introducao.md](./00-introducao.md)** *(Este arquivo)* — Visão geral e mapa de estudo.
2. **[01-estrutura-arquitetura.md](./01-estrutura-arquitetura.md)** — Estrutura de arquivos ativos, inicialização do React 19 (`main.jsx`), componentes principais (`App.jsx`) e fluxo de estados.
3. **[02-gerador-particulas-utils.md](./02-gerador-particulas-utils.md)** — Análise do algoritmo `createButterflies()` em `utils/butterflies.js` e propriedades CSS dinâmicas.
4. **[03-componente-svg-butterfly-icon.md](./03-componente-svg-butterfly-icon.md)** — Análise da construção vetorial do SVG `ButterflyIcon.jsx` e keyframes de bater de asas (`flap-left`/`flap-right`).
5. **[04-componente-card-e-estilos.md](./04-componente-card-e-estilos.md)** — Estudo do componente modular `Card.jsx`, tratamento de eventos (`onMouseEnter`, `onClick`) e regras CSS do layout.

---

## 🛠️ Stack Tecnológica

* **React 19 (`react` & `react-dom`)**: Biblioteca principal.
* **Vite 8**: Bundler e servidor de desenvolvimento ultrarrápido.
* **FontAwesome 7**: Ícones sociais e visuais.
* **CSS Vanilla Ricos**: Keyframes, filtros `drop-shadow` e variáveis CSS dinâmicas.
