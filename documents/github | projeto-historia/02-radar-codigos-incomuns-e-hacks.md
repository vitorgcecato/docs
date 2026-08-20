# ⚡ Radar Proativo de Códigos Incomuns & Hacks de Engenharia

> **Análise Técnica e Didática das Soluções Criativas, Hacks e Padrões Fora da Curva no Projeto SENAI X História**

---

### 🎯 1. Polling Reativo com `setInterval(..., 100)` para Sincronização Inter-Componentes
* **Arquivo e Linha**: [`src/components/BotaoCurtirTema.jsx:L19-L36`](file:///home/desenvolvedores/programa/projeto-historia/src/components/BotaoCurtirTema.jsx#L19-L36) e [`src/pages/Rankings.jsx:L19-L27`](file:///home/desenvolvedores/programa/projeto-historia/src/pages/Rankings.jsx#L19-L27)

```javascript
  useEffect(() => {   // Loop para pegar alterações do localStorage
    const timer = setTimeout(() => {
        setArrayCurtidas(JSON.parse(localStorage.getItem("curtidas")) || [])
    }, 100);
    return () => clearTimeout(timer);
  })

  useEffect(() => {   //  Loop para verificar se o tema está curtido ou não
    const timer = setInterval(() => {
      const curtidoExistente = arrayCurtidas.find(item => item.id === idSection);
      if (curtidoExistente) {
        setCurtido(true);
      } else {
        setCurtido(false);
      }
    }, 100);
    return () => clearInterval(timer);
  })
```

* ❓ **Por que parece estranho à primeira vista?**: O código usa loops de temporizador (`setInterval`/`setTimeout` a cada 100 milissegundos) para ler repetidamente o `localStorage` e atualizar o estado local de curtidas do componente.
* 💡 **A Sacada Genial**: Em aplicações React puras sem um gerenciador de estado global (como Redux, Zustand ou React Context API), múltiplos componentes não têm como saber quando outro componente atualizou o `localStorage` dentro da mesma aba (o evento nativo `window.onstorage` só dispara entre **abas diferentes**, nunca na mesma aba). O polling em 100ms atua como um "pulso cardíaco" (*heartbeat*) que mantém todos os botões de curtida e a tela de Ranking em perfeita sincronia em tempo real, sem a complexidade de configurar provedores de contexto na árvore de componentes.
* ⚠️ **Se usássemos o método tradicional**: Sem Context API ou Redux, ao curtir um item em uma página e voltar para a navegação ou alternar abas, o estado ficaria desincronizado e a contagem do Ranking exigiria um reload manual da página (`F5`).

---

### 🎯 2. Injeção Imperativa de Dados Externos no DOM (`innerHTML` + `document.getElementById`)
* **Arquivo e Linha**: [`src/components/APIWikipedia.jsx:L43-L54`](file:///home/desenvolvedores/programa/projeto-historia/src/components/APIWikipedia.jsx#L43-L54)

```javascript
    useEffect(() => {
        if (info) {
            const wikiSection = document.getElementById(campoWiki)  // Pega a seção onde o conteúdo será adicionado
            wikiSection.innerHTML = info // Adiciona o conteúdo da página à seção
        }
        if (imagemURL && imagemID) { // Verifica se a imagem e o ID da imagem estão definidos
            const imagem = document.getElementById(`${imagemID}`) // Cria um elemento de imagem
            imagem.src = imagemURL ? imagemURL : "" // Define a URL da imagem
            imagem.alt = imagemAlt ? imagemAlt : "" // Define o texto alternativo da imagem
            imagem.className = imagemClass ? imagemClass : "" // Define a classe da imagem
        }
    }, [info, imagemURL, campoWiki, imagemID, imagemAlt, imagemClass])
```

* ❓ **Por que parece estranho à primeira vista?**: Em React, a boa prática padrão é renderizar elementos declarativamente via JSX (ou `dangerouslySetInnerHTML`). Aqui, o componente age como um "injetor cirúrgico invisível": ele não renderiza quase nada em seu próprio retorno, mas busca elementos no DOM da página-mãe via `document.getElementById` e manipula diretamente o `innerHTML`, `src` e `className`.
* 💡 **A Sacada Genial**: A API da MediaWiki retorna o resumo da Wikipédia como uma string contendo tags HTML formatadas (`<p>`, `<b>`, `<i>`). Ao receber o ID do container e o ID da tag de imagem como props, o componente `APIWikipedia` pode ser plugado em qualquer ponto de qualquer página histórica sem alterar o layout estrutural da página consumidora. O componente consumidor apenas reserva as tags com os IDs e o `APIWikipedia` preenche os dados remotamente.
* ⚠️ **Se usássemos o método tradicional**: Seria necessário que cada página histórica gerenciasse seu próprio estado de `fetch`, `loading`, parsing de HTML e manipulação de imagem, gerando dezenas de linhas de código duplicadas em cada uma das 7 páginas temáticas.

---

### 🎯 3. Carrossel Cíclico Circular com Atualizador Funcional de Estado
* **Arquivo e Linha**: [`src/pages/Crisede1929.jsx:L47-L71`](file:///home/desenvolvedores/programa/projeto-historia/src/pages/Crisede1929.jsx#L47-L71)

```javascript
  {/* Botão para imagem anterior */}
  <button
    className="Botao-Carrossel EsquerdaC"
    onClick={() =>
      setIndex((prev) => (prev === 0 ? imagens.length - 1 : prev - 1))
    }
  >
    ‹
  </button>

  {/* Botão para próxima imagem */}
  <button
    className="Botao-Carrossel DireitaC"
    onClick={() =>
      setIndex((prev) => (prev === imagens.length - 1 ? 0 : prev + 1))
    }
  >
    ›
  </button>
```

* ❓ **Por que parece estranho à primeira vista?**: O carrossel dispensa completamente bibliotecas externas (como Swiper.js ou Slick), implementando o efeito de loop infinito com operadores ternários aplicados sobre a função de callback de atualização de estado (`setIndex(prev => ...)`).
* 💡 **A Sacada Genial**: O uso do padrão funcional `prev => ...` garante acesso atômico e imutável ao estado mais recente do React, prevenindo problemas de *stale closures* (quando cliques rápidos poderiam ler um índice defasado). A fórmula matemática circular `prev === 0 ? imagens.length - 1 : prev - 1` cria uma rotação toroidal perfeita com zero kilobytes de dependências extras.
* ⚠️ **Se usássemos o método tradicional**: A importação de bibliotecas de carrossel pesadas aumentaria o tamanho do bundle em dezenas de kilobytes e exigiria configurações complexas de CSS externo.

---

### 🎯 4. Mutação Direta de Classes no `document.body` para Dark Mode Global
* **Arquivo e Linha**: [`src/components/BotaoTema.jsx:L7-L14`](file:///home/desenvolvedores/programa/projeto-historia/src/components/BotaoTema.jsx#L7-L14)

```javascript
    useEffect(() => {   // Atualiza o tema e a classe
        localStorage.setItem('tema', tema)  // Atualiza o tema no local storage
        if (tema === "escuro") {    // Se o tema for escuro
            document.body.classList.add("escuro")   // Adiciona a classe escuro para o body
        } else {    // Caso não seja escuro
            document.body.classList.remove("escuro")    // Remove a classe escuro para o body
        }
    }, [tema])
```

* ❓ **Por que parece estranho à primeira vista?**: O componente manipula diretamente a lista de classes do elemento `document.body`, que fica fora da árvore gerenciada pelo React (`#root`).
* 💡 **A Sacada Genial**: Em aplicações com múltiplos arquivos CSS isolados, propagar um tema escuro para o fundo da página inteira, barras de rolagem e rodapés exigiria Styled Components, CSS Modules complexos ou React Context. Ao injetar a classe `.escuro` no próprio `<body>`, regras CSS simples como `.escuro { background-color: black; color: white; }` passam a ter efeito cascata imediato sobre 100% da aplicação.
* ⚠️ **Se usássemos o método tradicional**: Ao trocar de página pelo React Router, partes do fundo poderiam piscar em branco ou exigir que cada componente individual escutasse o estado de tema.

---

### 🎯 5. Navegação Cruzada com Âncoras Suaves (`HashLink`)
* **Arquivo e Linha**: [`src/components/Navbar.jsx:L10-L11`](file:///home/desenvolvedores/programa/projeto-historia/src/components/Navbar.jsx#L10-L11)

```javascript
  <HashLink smooth to="/#conteudos"> Conteúdos </HashLink>
  <HashLink smooth to="/#producoes"> Produções </HashLink>
```

* ❓ **Por que parece estranho à primeira vista?**: O componente mistura componentes `<Link>` nativos do `react-router-dom` com `<HashLink smooth>` do pacote `react-router-hash-link`.
* 💡 **A Sacada Genial**: O roteador padrão do React não sabe lidar com links de âncora (`#id`) quando o usuário está em uma rota diferente (ex: o usuário está em `/GuerraDeCanudos` e clica em "Conteúdos"). O `<HashLink smooth>` detecta se o usuário já está na Home; se não estiver, realiza a transição de rota para `/` e, assim que o DOM da Home monta, rola a página suavemente até o elemento com `id="conteudos"`.
* ⚠️ **Se usássemos o método tradicional**: O usuário clicaria em âncoras a partir de páginas internas e nada aconteceria, ou a página seria recarregada bruscamente sem animação de scroll suave.
