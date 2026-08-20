# 🔬 Dissecção Detalhe por Detalhe: Componentes Core

> **Engenharia Reversa dos Componentes Reutilizáveis do Projeto SENAI X História**

---

## 1. 🧩 `APIWikipedia.jsx` — O Consumidor da MediaWiki API

* **Localização**: [`src/components/APIWikipedia.jsx`](file:///home/desenvolvedores/programa/projeto-historia/src/components/APIWikipedia.jsx)
* **Responsabilidade**: Consultar dinamicamente o endpoint REST da Wikipédia em português (`pt.wikipedia.org`), extrair o primeiro parágrafo formatado e a imagem original do artigo, e injetá-los no DOM.

### 📝 Código Integralmente Comentado:

```javascript
import { useEffect, useState } from "react"

function APIWikipedia(props) {
    // [L4-L7] Estados de controle de dados e erros
    const [info, setInfo] = useState("")            // Armazena o HTML do resumo retornado pela API
    const [imagemURL, setImagemURL] = useState(null)// Armazena a URL da imagem de capa original
    const [erro, setErro] = useState(false)         // Flag booleana indicativa de falha
    const [mensagemErro, setMensagemErro] = useState("") // Descrição do erro para feedback visual

    // [L8-L12] Desestruturação de props com sanitização para URL
    const campoWiki = props.campoWiki       // ID do elemento HTML onde o texto será injetado
    const imagemID = props.imagemID         // ID da tag <img> de destino
    const imagemAlt = props.imagemAlt       // Texto alternativo (acessibilidade)
    const imagemClass = props.imagemClass   // Classe CSS para estilização da imagem
    const titulo = encodeURIComponent(props.titulo) // Codifica caracteres especiais (espaços, acentos)

    // [L14-L41] Efeito de Busca Assíncrona na MediaWiki API
    useEffect(() => {
        async function buscarWiki() {
            try {
                // Monta a URL da API solicitando imagens originais, extrato introdutório e formato JSON
                const url = `https://pt.wikipedia.org/w/api.php?action=query&prop=pageimages|extracts&exintro&piprop=original&titles=${titulo}&format=json&origin=*`;
                const resposta = await fetch(url);
                const dados = await resposta.json();

                // Valida se o objeto de retorno contém as páginas solicitadas
                if (dados && dados.query && dados.query.pages) {
                    const pagina = dados.query.pages;
                    // A chave da página é dinâmica (um Page ID numérico). Pegamos a primeira chave:
                    const paginaID = Object.keys(pagina)[0];
                    const conteudo = pagina[paginaID].extract;
                    const imagem = pagina[paginaID].original ? pagina[paginaID].original.source : null;

                    setInfo(conteudo);
                    setImagemURL(imagem);
                } else {
                    setErro(true);
                }
            } catch (error) {
                console.error(error);
                setMensagemErro(error.message);
                setErro(true);
            }
        }
        buscarWiki();
    }, [titulo, info]);

    // [L43-L54] Efeito de Injeção no DOM
    useEffect(() => {
        if (info) {
            const wikiSection = document.getElementById(campoWiki);
            if (wikiSection) {
                wikiSection.innerHTML = info; // Injeta o HTML bruto retornado pela Wikipédia
            }
        }
        if (imagemURL && imagemID) {
            const imagem = document.getElementById(`${imagemID}`);
            if (imagem) {
                imagem.src = imagemURL || "";
                imagem.alt = imagemAlt || "";
                imagem.className = imagemClass || "";
            }
        }
    }, [info, imagemURL, campoWiki, imagemID, imagemAlt, imagemClass]);

    // [L56-L61] Renderização apenas de mensagens de erro se houver falha
    return (
        <>
            <p style={{ color: "red" }}>{erro ? `Ocorreu um erro: '${mensagemErro}'` : ""}</p>
        </>
    );
}

export default APIWikipedia;
```

---

## 2. 💖 `BotaoCurtirTema.jsx` — Sistema Granular de Votação por Bloco

* **Localização**: [`src/components/BotaoCurtirTema.jsx`](file:///home/desenvolvedores/programa/projeto-historia/src/components/BotaoCurtirTema.jsx)
* **Responsabilidade**: Permitir que cada seção de cada página histórica seja curtida individualmente, persistindo um array de objetos `{ id, tema }` no `localStorage`.

### 📝 Código Integralmente Comentado:

```javascript
import { useEffect, useState } from "react"
import "./styles/BotaoCurtirTema.css"

function BotaoCurtirTema(props) {
    const [curtido, setCurtido] = useState(false)
    // Recupera array inicial do localStorage com fallback para array vazio
    const [arrayCurtidas, setArrayCurtidas] = useState(JSON.parse(localStorage.getItem("curtidas")) || [])

    const idSection = props.idSection   // ID único da seção (ex: "Bloco1Crise", "BlocoCanudosIntro")
    const temaSection = props.tema      // Nome do tema macro (ex: "Crise de 1929", "Guerra de Canudos")
    
    const informacoes = {
        id: idSection,
        tema: temaSection
    }

    // [L19-L24] Polling de leitura do localStorage
    useEffect(() => {
        const timer = setTimeout(() => {
            setArrayCurtidas(JSON.parse(localStorage.getItem("curtidas")) || [])
        }, 100);
        return () => clearTimeout(timer);
    });

    // [L26-L36] Verificação contínua se esta seção específica está curtida
    useEffect(() => {
        const timer = setInterval(() => {
            const curtidoExistente = arrayCurtidas.find(item => item.id === idSection);
            if (curtidoExistente) {
                setCurtido(true);
            } else {
                setCurtido(false);
            }
        }, 100);
        return () => clearInterval(timer);
    });

    // [L38-L47] Alternador de Curtida (Toggle)
    const botaoCurtir = () => {
        if (!curtido) {
            // Se não estava curtido, cria novo array com spread operator e salva
            const novaArray = [...arrayCurtidas, informacoes];
            localStorage.setItem("curtidas", JSON.stringify(novaArray));
            setCurtido(true);
        } else {
            // Se já estava curtido, filtra removendo o item desta seção
            const arrayFiltrada = arrayCurtidas.filter((item) => item.id !== idSection);
            localStorage.setItem("curtidas", JSON.stringify(arrayFiltrada));
            setCurtido(false);
        }
    };

    return (
        <>
            <button 
                className={curtido ? "icone-coracao fa-solid fa-heart" : "icone-coracao fa-regular fa-heart"} 
                id="botaoCurtirTema" 
                onClick={() => botaoCurtir()}
            />
        </>
    );
}

export default BotaoCurtirTema;
```

---

## 3. 🌙 `BotaoTema.jsx` — Alternador Global Claro / Escuro

* **Localização**: [`src/components/BotaoTema.jsx`](file:///home/desenvolvedores/programa/projeto-historia/src/components/BotaoTema.jsx)
* **Responsabilidade**: Alternar o tema do sistema entre `claro` e `escuro`, persistindo a escolha no `localStorage` e aplicando a classe `.escuro` no `<body>` da página.

### 📝 Código Integralmente Comentado:

```javascript
import { useEffect, useState } from "react"
import './styles/BotaoTema.css'

function BotaoTema() {
    // Inicializa o estado com a preferência salva no localStorage ou 'claro' por padrão
    const [tema, setTema] = useState(localStorage.getItem('tema') || 'claro')

    // Efeito para sincronizar a classe do body e persistir no storage
    useEffect(() => {
        localStorage.setItem('tema', tema)
        if (tema === "escuro") {
            document.body.classList.add("escuro") // Altera o fundo do site todo
        } else {
            document.body.classList.remove("escuro")
        }
    }, [tema])

    const alterarTema = () => {
        setTema(prevTema => (prevTema === "claro" ? "escuro" : "claro"))
    }
    
    return (
        <>
            {/* Exibe ícone de lua (para mudar para escuro) ou sol (para mudar para claro) */}
            <button 
                className={tema === "claro" ? "botao-tema icon fa-solid fa-moon" : "botao-tema icon fa-solid fa-sun"} 
                onClick={alterarTema}
            />
        </>
    )
}

export default BotaoTema
```

---

## 4. 🧭 `Navbar.jsx` & 🔻 `Footer.jsx` — Navegação e Rodapé Acordeão

### [`src/components/Navbar.jsx`](file:///home/desenvolvedores/programa/projeto-historia/src/components/Navbar.jsx)
O cabeçalho recebe `backgroundId` e `logo` via props para assumir a identidade visual exata de cada período histórico:
```javascript
function Navbar({ backgroundId, logo }) {
  return (
    <nav id={backgroundId} className="blocoPrincipalNavbar">
      <HashLink smooth to="/#conteudos"> Conteúdos </HashLink>
      <HashLink smooth to="/#producoes"> Produções </HashLink>
      <img src={logo} alt="Logo do site" />
      <Link to="/Ranking"> Ranking </Link>
      <Link to="/SobreNos">Sobre Nós</Link>
    </nav>
  );
}
```

### [`src/components/Footer.jsx`](file:///home/desenvolvedores/programa/projeto-historia/src/components/Footer.jsx)
O rodapé implementa um sistema de abertura em sanfona/acordeão via estado `aberto`:
```javascript
function Footer(props) {  
    const [aberto, setAberto] = useState(false);

    function verInfo() {
        setAberto(!aberto); // Alterna exibição do acordeão
    }

    return (
        <footer>
            <section className="footerHeader" id={props.corHeaderFooter} onClick={verInfo}>
                <img src={props.logo} className="logoSite" alt="Logo do site" />
                <span className={`seta ${aberto ? "aberto" : ""}`}> </span>
                ...
            </section>

            <section id={props.corInfoFooter} className={`footerInfo ${aberto ? "aberto" : ""}`}>
                {/* Informações detalhadas do projeto, links e lista de integrantes */}
            </section>
        </footer>
    );
}
```
