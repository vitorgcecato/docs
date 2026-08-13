# 🎲 Gerador de Partículas: `src/utils/butterflies.js`

> **Estudo Técnico da Geração de Dados Aleatórios & Variáveis CSS**

---

## 📌 Código do Utilitário: `butterflies.js` com Comentários Inline

```javascript
// Constante que define a quantidade total de borboletas na tela simultaneamente
const BUTTERFLY_AMOUNT = 18;

/**
 * Função geradora de objetos com propriedades aleatórias.
 * @param {number} amount Quantidade de borboletas a serem geradas (padrão: 18)
 * @returns {Array<Object>} Lista de objetos contendo os parâmetros de cada partícula
 */
export function createButterflies(amount = BUTTERFLY_AMOUNT) {
  // Array.from: Cria um array de tamanho "amount" e itera preenchendo os objetos
  return Array.from({ length: amount }, (_, index) => {
    // Helper matemático para calcular um número float aleatório dentro de um intervalo [min, max]
    // Exemplo: random(10, 20) -> gera números como 14.3829...
    const random = (min, max) => Math.random() * (max - min) + min;

    return {
      id: index,                              // Identificador único (usado no key={butterfly.id} do React)
      left: random(0, 96),                    // Posição percentual horizontal de início na tela (0% a 96%)
      size: random(34, 62),                    // Dimensão em pixels da largura e altura (34px a 62px)
      duration: random(14, 25),                // Tempo em segundos que leva para subir do chão ao topo (14s a 25s)
      delay: random(-25, 0),                   // ATRASO NEGATIVO (-25s a 0s): faz com que a animação já comece
                                              // no meio do caminho ao carregar a página (evita que todas nasçam do chão juntas)
      horizontalMovement: random(-140, 140),   // Deslocamento lateral em pixels para oscilação sinusoidal (-140px a 140px)
      opacity: random(0.55, 0.95),              // Nível de transparência CSS (55% a 95% de opacidade)
      rotation: random(-25, 25),               // Ângulo inicial de inclinação do corpo em graus (-25deg a 25deg)
      wingSpeed: random(0.3, 0.55),            // Frequência em segundos do ciclo de bater asas (0.3s a 0.55s)
      hue: random(-25, 40),                    // Desvio da matiz de cor original via hue-rotate (-25deg a 40deg)
    };
  });
}
```

---

## 🔬 Como os Dados Aleatórios São Usados no React & CSS

No arquivo `App.jsx`, cada elemento da borboleta recebe esses valores aleatórios como **Custom Properties (Variáveis CSS)** injetadas inline:

```jsx
<div
  key={butterfly.id}
  className="butterfly"
  style={{
    left: `${butterfly.left}%`,                            // CSS nativo: left: 45.2%
    "--size": `${butterfly.size}px`,                      // Variável CSS: --size: 48px
    "--duration": `${butterfly.duration}s`,                // Variável CSS: --duration: 18.4s
    "--delay": `${butterfly.delay}s`,                      // Variável CSS: --delay: -12.1s
    "--horizontal-movement": `${butterfly.horizontalMovement}px`, // Variável CSS: --horizontal-movement: -85px
    "--opacity": butterfly.opacity,                        // Variável CSS: --opacity: 0.82
    "--rotation": `${butterfly.rotation}deg`,              // Variável CSS: --rotation: 14deg
    "--wing-speed": `${butterfly.wingSpeed}s`,             // Variável CSS: --wing-speed: 0.42s
    "--hue": `${butterfly.hue}deg`,                        // Variável CSS: --hue: 15deg
  }}
>
  <ButterflyIcon />
</div>
```

---

## 🎨 Estilização CSS e Transformações 3D (`App.css`)

No arquivo `App.css`, as propriedades inline são consumidas pelo CSS para criar a animação de subida fluida impulsionada por GPU:

```css
/* Container estático ocupando todo o fundo da tela sem interceptar cliques do usuário */
.butterfly-background {
  position: absolute;   /* Posicionamento absoluto relativo ao container pai .app */
  inset: 0;             /* Atalho moderno para top: 0, right: 0, bottom: 0, left: 0 */
  overflow: hidden;     /* Esconde borboletas quando ultrapassam as bordas da tela */
  pointer-events: none; /* Garante que passar o mouse sobre as borboletas não bloqueie cliques em botões abaixo */
  z-index: 1;           /* Camada z-index intermediária para ficar atrás dos cards de conteúdo */
}

/* Classe de cada partícula individual de borboleta */
.butterfly {
  position: absolute;             /* Permite movimentação livre nas coordenadas da tela */
  bottom: -100px;                 /* Ponto de partida inicial: 100px abaixo da borda inferior visível */
  width: var(--size);             /* Consome a variável --size definida no React para a largura */
  height: var(--size);            /* Consome a mesma variável --size para manter a proporção 1:1 */
  opacity: var(--opacity);        /* Consome a transparência individual de cada borboleta */

  /* Inicia a animação keyframe float-up */
  animation: float-up var(--duration) linear infinite; /* Roda em loop contínuo e velocidade constante */
  animation-delay: var(--delay);                       /* Aplica o atraso negativo inicial */

  /* Altera levemente a cor da borboleta rotacionando a roda de cores HSL */
  filter: hue-rotate(var(--hue));
}

/* ==========================================================================
   KEYFRAME: Animação de Subida e Oscilação Lateral Dinâmica
   ========================================================================== */
@keyframes float-up {
  /* 0% (Início da animação - no chão) */
  0% {
    /* 
       transform: Agrupa múltiplas transformações geométricas em uma só linha:
       - translateY(0): Começa na posição vertical inicial (bottom: -100px)
       - translateX(0): Começa na posição horizontal original (left: X%)
       - rotate(var(--rotation)): Aplica a inclinação inicial do corpo (ex: 14deg)
    */
    transform: translateY(0) translateX(0) rotate(var(--rotation));
  }

  /* 50% (Meio do caminho - altura de metade da tela) */
  50% {
    /*
       - translateY(-60vh): Sobe 60% da altura da viewport gráfica da janela
       - translateX(var(--horizontal-movement)): Desloca horizontalmente para a esquerda ou direita
       - rotate(calc(var(--rotation) * -1)): Inverte o ângulo de inclinação usando a função calc() 
         do CSS (ex: se era +14deg, passa a ser -14deg), simulando a borboleta mudando de direção
    */
    transform: translateY(-60vh) translateX(var(--horizontal-movement)) rotate(calc(var(--rotation) * -1));
  }

  /* 100% (Fim da animação - acima da tela) */
  100% {
    /*
       - translateY(-120vh): Sobe 120% da altura total da janela (garante que sumiu do topo)
       - translateX(0): Retorna suavemente para o alinhamento horizontal central
       - rotate(var(--rotation)): Retorna ao ângulo de inclinação original antes de reiniciar o loop
    */
    transform: translateY(-120vh) translateX(0) rotate(var(--rotation));
  }
}
```

---

## 💡 Por que este Padrão de Engenharia de Software é Eficiente?

1. **Aceleração por Hardware (GPU)**: As propriedades `transform` (`translateY`, `translateX`, `rotate`) e `opacity` não provocam *Layout Reflow* nem *Repaint* na CPU do navegador. O navegador envia a textura para a placa de vídeo (GPU), garantindo **60 FPS ou 144 FPS cravados** mesmo em dispositivos móveis.
2. **Uso Avançado do `calc()`**: A instrução `rotate(calc(var(--rotation) * -1))` permite inverter numericamente um valor dinâmico sem precisar de JavaScript adicional.
