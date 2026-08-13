# 🏗️ Estrutura & Arquitetura da Aplicação

> **Estudo dos Arquivos Ativos**: `main.jsx` e `App.jsx`

---

## 📁 Árvore de Arquivos em Uso Ativo

Dos arquivos presentes no projeto `particulas`, os seguintes estão **em uso direto**:

```text
src/
├── main.jsx                 --> Ponto de entrada do React 19
├── index.css                --> Estilos globais e reset
├── App.jsx                  --> Componente principal da aplicação
├── App.css                  --> Estilos e keyframes das partículas e layout
├── components/
│   ├── ButterflyIcon.jsx    --> Desenho SVG vetorial da borboleta
│   ├── Card.jsx             --> Componente de card reutilizável de links
│   └── styles/
│       ├── ButterflyIcon.css--> Animação do bater de asas (keyframe flap)
│       └── Card.css         --> Estilização e hover dos cards
└── utils/
    └── butterflies.js       --> Algoritmo matemático gerador de dados das partículas
```

---

## 🔌 1. Ponto de Entrada: `src/main.jsx`

```jsx
// Importa o utilitário StrictMode para identificar efeitos colaterais e trechos legados em dev
import { StrictMode } from 'react'

// Importa createRoot da API de cliente do React 18/19 para inicialização concorrente
import { createRoot } from 'react-dom/client'

// Importa os estilos globais que resetam margens e definem a tipografia base
import './index.css'

// Importa o componente raiz da aplicação
import App from './App.jsx'

// Localiza a div com id="root" no index.html e injeta a árvore do React dentro dela
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Componente principal que gerencia os estados e partículas */}
    <App />
  </StrictMode>,
)
```

---

## ⚛️ 2. Componente Principal: `src/App.jsx`

O `App.jsx` orquestra o estado da página, a renderização das partículas e a troca de visões (tela principal vs modal do cardápio).

```jsx
import { useEffect, useMemo, useState } from "react";

// Importação das imagens estáticas dos avatares e do cardápio
import avatarImage from "./assets/avatar.png";
import avatarDiabesImage from "./assets/avatarDiabes.png";
import cardapioImage from "./assets/cardapio.png";

// Importação dos estilos globais do aplicativo (inclui regras de partículas e layout)
import './App.css'

// Pacote de ícones sociais e utilitários da biblioteca FontAwesome
import '@fortawesome/fontawesome-free/css/all.min.css';

// Importação do componente de ícone SVG da borboleta animada
import ButterflyIcon from './components/ButterflyIcon';

// Importação do utilitário matemático que gera o array com os parâmetros aleatórios
import { createButterflies } from './utils/butterflies';

// Importação do componente genérico reutilizável de Cards
import Card from "./components/Card";


export default function App() {
  // useMemo: Memoriza o array de 18 borboletas na inicialização.
  // Evita recriar novos números aleatórios a cada mudança de estado (mouse hover, cliques),
  // impedindo que as borboletas "pisquem" ou reiniciem do chão durante a navegação.
  const butterflies = useMemo(() => createButterflies(), []);

  // useState: Controla se o tema roxo/neon deve ser ativado (ex: ao passar o mouse no cardápio)
  const [isMenuThemeActive, setIsMenuThemeActive] = useState(false);

  // useState: Controla se a tela inteira deve exibir a visualização em destaque do Cardápio de Doações
  const [isDonationMenuOpen, setIsDonationMenuOpen] = useState(false);

  // Variável derivada: se qualquer um dos menus visuais estiver ativo, aplica as alterações de tema
  const isMenuVisualActive = isMenuThemeActive || isDonationMenuOpen;

  // useEffect: Pré-carregamento imediato da imagem pesada do cardápio em segundo plano.
  // Garante que, quando o usuário clicar em "Cardápio", a imagem abra sem atrasos de download.
  useEffect(() => {
    const preloadedImage = new Image(); // Cria um elemento de imagem no DOM em memória
    preloadedImage.src = cardapioImage; // Inicia o download assíncrono pelo navegador
  }, []); // [] significa que roda apenas 1 vez ao montar o componente

  return (
    <>
      {/* Aplica dinamicamente a classe "app--menu-theme" se o tema visual estiver ativo */}
      <main className={isMenuVisualActive ? "app app--menu-theme" : "app"}>
        
        {/* Container de fundo para a camada de borboletas (aria-hidden oculta de leitores de tela) */}
        <div className="butterfly-background" aria-hidden="true">
          {butterflies.map((butterfly) => (
            <div
              key={butterfly.id} // Chave única para o algoritmo de reconciliação do React
              className="butterfly"
              style={{
                // Injeção de CSS Custom Properties (Variáveis CSS) diretamente no estilo inline:
                left: `${butterfly.left}%`,                            // Posição horizontal inicial (0% a 96%)
                "--size": `${butterfly.size}px`,                      // Largura e altura da partícula
                "--duration": `${butterfly.duration}s`,                // Duração do ciclo de subida no keyframe
                "--delay": `${butterfly.delay}s`,                      // Delay negativo para iniciar em pontos variados
                "--horizontal-movement": `${butterfly.horizontalMovement}px`, // Deslocamento lateral de oscilação em px
                "--opacity": butterfly.opacity,                        // Nível de transparência do elemento
                "--rotation": `${butterfly.rotation}deg`,              // Ângulo de inclinação inicial
                "--wing-speed": `${butterfly.wingSpeed}s`,             // Frequência de batimento das asas no SVG
                "--hue": `${butterfly.hue}deg`,                        // Variação de cor via hue-rotate
              }}
            >
              <ButterflyIcon />
            </div>
          ))}
        </div>

        {/* Corpo principal contendo o avatar, redes sociais e lista de cards */}
        <section className={isDonationMenuOpen ? "app-body app-body--cardapio" : "app-body"}>
          <main className={isDonationMenuOpen ? "app-main-container app-main-container--cardapio" : "app-main-container"}>
            
            {/* Renderização condicional: Mostra a visão do Cardápio se aberto; senão mostra a Home */}
            {isDonationMenuOpen ? (
              <section className="app-cardapio-view">
                <button
                  className="app-cardapio-back-button"
                  type="button"
                  onClick={() => {
                    // Fecha o cardápio e reseta o tema visual de volta ao estado inicial
                    setIsDonationMenuOpen(false);
                    setIsMenuThemeActive(false);
                  }}
                >
                  Voltar
                </button>

                <img
                  className="app-cardapio-image"
                  src={cardapioImage}
                  alt="Cardapio de donates"
                  loading="eager"        // Carregamento prioritário instantâneo
                  decoding="sync"        // Decodificação síncrona de imagem na GPU
                  fetchPriority="high"   // Alta prioridade na fila de requisições do navegador
                />
              </section>
            ) : (
              <>
                <h1>Duda Belini</h1>

                {/* Alterna dinamicamente a foto de perfil caso o tema neon/diabes esteja ativo */}
                <img
                  className="app-circle-avatar"
                  src={isMenuVisualActive ? avatarDiabesImage : avatarImage}
                  alt="Avatar Duda Belini"
                />

                {/* Ícones de redes sociais utilizando classes diretas do FontAwesome */}
                <section className="app-redes-container">
                  <a href="https://www.instagram.com/belinix_" target="_blank" className="fa-brands fa-instagram" rel="noreferrer"></a>
                  <a href="https://www.tiktok.com/@belinix" target="_blank" className="fa-brands fa-tiktok" rel="noreferrer"></a>
                  <a href="https://twitch.tv/belinix" target="_blank" className="fa-brands fa-twitch" rel="noreferrer"></a>
                  <a href="https://www.youtube.com/@aBelinix" target="_blank" className="fa-brands fa-youtube" rel="noreferrer"></a>
                  <a href="https://x.com/Belinixx" target="_blank" className="fa-brands fa-x-twitter" rel="noreferrer"></a>
                </section>

                {/* Lista de Cards Principais */}
                <section className="app-conteudo-container">
                  <section className="app-cards-container">
                    <Card
                      title={'Doe no PIX'}
                      iconClassName="fa-solid fa-money-bill-wave"
                      link={'https://livepix.gg/belinix'}
                      desc={'Me ajude com doações e faça interações com a live doando valores específicos!'}
                    />
                    <Card
                      title={'Servidor da Comunidade'}
                      iconClassName="fa-brands fa-discord"
                      link={'https://discord.gg/n6NWMG4z8T'}
                      desc={'Venha fazer parte da nossa comunidade! Aqui você pode interagir e fazer novos amigos!'}
                    />
                    <Card
                      title={'Fila de Survs & Killers'}
                      iconClassName="fa-solid fa-skull-crossbones"
                      link={'https://filadbd.pages.dev/belinix'}
                      desc={'Conheça a nossa fila do Dead by Daylight!'}
                    />

                    {/* Card Interativo com manipuladores de eventos mouse e foco */}
                    <Card
                      title={'Cardápio de Doações'}
                      variant="comp-card-container--menu"
                      link="#"
                      desc={'Já conhece as principais refeições do cardápio?'}
                      onMouseEnter={() => setIsMenuThemeActive(true)}  // Ativa tema roxo ao passar o mouse
                      onMouseLeave={() => setIsMenuThemeActive(false)} // Desativa tema ao tirar o mouse
                      onFocus={() => setIsMenuThemeActive(true)}       // Suporte à navegação por teclado (Tab)
                      onBlur={() => setIsMenuThemeActive(false)}        // Suporte à navegação por teclado (Unfocus)
                      onClick={(event) => {
                        event.preventDefault(); // Cancela a navegação para o link "#"
                        setIsDonationMenuOpen(true); // Abre o modal do cardápio
                      }}
                    />
                  </section>
                </section>

                <h4>Todos os direitos reservados! © 2026</h4>
              </>
            )}
          </main>
        </section>
      </main>
    </>
  );
}
```
