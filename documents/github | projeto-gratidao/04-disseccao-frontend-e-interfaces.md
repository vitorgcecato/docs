# 🔬 Dissecção Detalhe por Detalhe: Frontend & Interfaces

> **Engenharia Reversa dos Scripts Client-Side, Manipulação Dinâmica do DOM e Estilos**

---

## 1. 🖼️ `Frontend/script.js` — Slider Automatizado & Tradução i18n

* **Localização**: [`Frontend/script.js`](file:///home/desenvolvedores/programa/projeto-gratidao/Frontend/script.js)
* **Responsabilidade**: Orquestrar a transição contínua e cíclica das imagens na página inicial e permitir a tradução instantânea dos textos conceituais para o inglês ao toque das bandeiras.

### 📝 Código Integralmente Comentado:

```javascript
// [L1-L6] Seleção de elementos do DOM do Slider
const imagens = document.querySelectorAll("#slider section");
let imagemAtual = 0;
let bolinhas = document.getElementsByClassName("bolinhas");

// [L9-L18] Função para alternar visibilidade e classes das bolinhas indicadoras
function mostrarImagem(index) {
  imagens.forEach((section) => (section.style.display = "none")); // Oculta todos os slides
  imagens[index].style.display = "block";                         // Torna visível apenas o slide ativo

  for (let i = 0; i < bolinhas.length; i++) {
    bolinhas[i].className = bolinhas[i].className.replace(" ativo", "");
  }
  bolinhas[imagemAtual].className += " ativo";
}

// [L22-L30] Transições circulares com operador de resto de divisão (%)
function proximaImagem() {
  imagemAtual = (imagemAtual + 1) % imagens.length;
  mostrarImagem(imagemAtual);
}

function imagemAnterior() {
  imagemAtual = (imagemAtual - 1 + imagens.length) % imagens.length;
  mostrarImagem(imagemAtual);
}

mostrarImagem(imagemAtual);

// [L36-L48] Listeners de clique para os botões de navegação
const botaoProximo = document.getElementById("proximo");
const botaoAnterior = document.getElementById("anterior");

botaoProximo.addEventListener("click", () => proximaImagem());
botaoAnterior.addEventListener("click", () => imagemAnterior());

// [L52] Loop automático a cada 3 segundos
let intervalo = setInterval(proximaImagem, 3000);

// [L56-L94] Sistema de Tradução Bilingue em Tempo Real
function traduzirIngles() {
  document.getElementById("titulo1").textContent = `CONCEPT`;
  document.getElementById("paragrafo1").textContent = `Gratitude is a feeling of recognition and an emotion of wanting to thank another individual for taking an action...`;

  document.getElementById("titulo2").textContent = `RELATION`;
  document.getElementById("paragrafo2").textContent = `Thanksgiving Day is a commemorative holiday, most popular in the United States...`;
}

function traduzirBrasil() {
  document.getElementById("titulo1").textContent = `CONCEITO`;
  document.getElementById("paragrafo1").textContent = `A gratidão é um sentimento de reconhecimento e uma emoção de querer agradecer outro indivíduo...`;

  document.getElementById("titulo2").textContent = `RELAÇÃO`;
  document.getElementById("paragrafo2").textContent = `O Thanksgiving Day (Dia de Ação de Graças), é uma data comemorativa, mais popular nos Estados Unidos...`;
}
```

---

## 2. 🎲 `Frontend/JavaScript/msgDeGratidao.js` — Consumo de Mensagens

* **Localização**: [`Frontend/JavaScript/msgDeGratidao.js`](file:///home/desenvolvedores/programa/projeto-gratidao/Frontend/JavaScript/msgDeGratidao.js)
* **Responsabilidade**: Buscar frases aleatórias do backend e enviar novas frases de gratidão submetidas pelos usuários.

```javascript
const apiURLMsg = "http://localhost:3000/mensagens/";

// 1. Buscar Frase Aleatória
async function mensagemAleatoria() {
    const msgContainer = document.getElementById("mensagem-container");
    document.getElementById("mensagemInicial").style.display = "none";
    document.getElementById("loading").style.display = "block";

    try {
        const response = await fetch(`http://localhost:3000/mensagens/random`);
        if (!response.ok) throw new Error("Erro ao buscar mensagem aleatória.");

        msgContainer.style.flexDirection = "column";
        const data = await response.json();

        const msgTema = document.getElementById("msgTema");
        msgTema.textContent = `Tema: ${data.tema}`;

        const msgEscrita = document.getElementById("msgEscrita");
        msgEscrita.textContent = `Mensagem: ${data.mensagem}`;

        msgContainer.appendChild(msgTema);
        msgContainer.appendChild(msgEscrita);
    } catch (error) {
        console.error("Erro ao buscar dados da mensagem:", error);
        document.getElementById("mensagemInicial").textContent = "Falha ao buscar mensagem.";
        document.getElementById("mensagemInicial").style.display = "block";
    }
    document.getElementById("loading").style.display = "none";
}

// 2. Cadastrar Nova Mensagem (POST)
async function criarMensagemGratidao() {
    const msgSucesso = document.getElementById("addSucesso");
    const inputTema = document.getElementById("userTemaGratidao");
    const inputMensagem = document.getElementById("userFraseGratidao");

    const tema = inputTema.value.trim();
    const mensagem = inputMensagem.value.trim();

    if (!tema || !mensagem) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }

    const response = await fetch(apiURLMsg, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, mensagem })
    });

    if (response.ok) {
        msgSucesso.style.display = "block";
        inputTema.value = "";
        inputMensagem.value = "";
    } else {
        const error = await response.json();
        alert(`Erro ao adicionar mensagem: ${error.message}`);
    }
}
```

---

## 3. 🔍 `Frontend/JavaScript/histDeInspira.js` — Motor de Pesquisa e Renderização Dinâmica

* **Localização**: [`Frontend/JavaScript/histDeInspira.js`](file:///home/desenvolvedores/programa/projeto-gratidao/Frontend/JavaScript/histDeInspira.js)
* **Responsabilidade**: Consultar relatos históricos pela palavra-chave informada, limpar nós anteriores do DOM e instanciar novos cartões com título, parágrafo e imagem resolvidos de forma híbrida.

```javascript
const apiURLHistorias = "http://localhost:3000/historias";
let contador = 0; // Rastreia o número de cartões ativos no DOM

async function buscarHistoriaPalavra() {
    const userPalavraInput = document.getElementById("historiaPalavra");
    const userPalavra = userPalavraInput.value.trim();
    const containerHist = document.getElementById("historias-container");
    const msgLoading = document.getElementById("mensagemLoading");
    const msgNotFound = document.getElementById("historiaNaoEncontrada");

    if (!userPalavra) {
        alert("Por favor, preencha o campo para buscar a história.");
        return;
    }

    containerHist.style.display = "none";
    msgLoading.style.display = "block";
    msgNotFound.style.display = "none";

    try {
        const response = await fetch(`${apiURLHistorias}/${userPalavra}`);
        if (response.status === 404) {
            msgNotFound.style.display = "block";
        } else if (!response.ok) {
            alert("Erro desconhecido ao buscar história");
        } else {
            const historias = await response.json();

            // Limpeza atômica dos nós do DOM da busca anterior
            while (contador !== 0) {
                let paginaDeletar = document.getElementById(`pg-${contador}`);
                let tituloDeletar = document.getElementById(`titulo-${contador}`);
                let paragrafoDeletar = document.getElementById(`paragrafo-${contador}`);
                let imagemDeletar = document.getElementById(`imagem-${contador}`);

                paginaDeletar.removeChild(tituloDeletar);
                paginaDeletar.removeChild(paragrafoDeletar);
                paginaDeletar.removeChild(imagemDeletar);
                containerHist.removeChild(paginaDeletar);
                contador--;
            }

            // Criação dinâmica dos novos cartões
            historias.forEach((data) => {
                contador++;
                const paginaHistoria = document.createElement("section");
                paginaHistoria.className = "paginaHistoria";
                paginaHistoria.id = `pg-${contador}`;
                containerHist.appendChild(paginaHistoria);

                const tituloHistoria = document.createElement("h3");
                tituloHistoria.className = "tituloHistoria";
                tituloHistoria.textContent = data.titulo;
                tituloHistoria.id = `titulo-${contador}`;
                paginaHistoria.appendChild(tituloHistoria);

                const paragrafoHistoria = document.createElement("p");
                paragrafoHistoria.className = "paragrafoHistoria";
                paragrafoHistoria.textContent = data.historia;
                paragrafoHistoria.id = `paragrafo-${contador}`;
                paginaHistoria.appendChild(paragrafoHistoria);

                const imagemHistoria = document.createElement("img");
                imagemHistoria.className = "imagemHistoria";
                const stringURL = `${data.imagemURL}`;

                // Heurística de resolução híbrida
                if (stringURL.length <= 8) {
                    imagemHistoria.src = `../Imagens/BancoDeDados/${data.imagemURL}.png`;
                } else {
                    imagemHistoria.src = data.imagemURL;
                }
                imagemHistoria.alt = `Imagem de ${data.titulo}`;
                imagemHistoria.id = `imagem-${contador}`;
                paginaHistoria.appendChild(imagemHistoria);
            });
        }
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        alert("Erro ao buscar histórias. Verifique sua conexão.");
    }

    containerHist.style.display = "block";
    msgLoading.style.display = "none";
}
```
