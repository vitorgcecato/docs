# 🎨 Componente Vetorial & Animação: `ButterflyIcon`

> **Estudo dos Arquivos**: `src/components/ButterflyIcon.jsx` e `src/components/styles/ButterflyIcon.css`

---

## 📌 Anatomia do SVG Vetorial (`ButterflyIcon.jsx`) com Comentários

O componente `ButterflyIcon` desenha uma borboleta completa utilizando elementos nativos de vetores SVG (`<path>`, `<circle>`, `<ellipse>` e grupos `<g>`):

```jsx
import './styles/ButterflyIcon.css'

export default function ButterflyIcon() {
  return (
    <svg
      className="butterfly-icon"
      viewBox="0 0 100 80" // Define a caixa de coordenadas internas do vetor (100 unidades de largura por 80 de altura)
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"   // Oculta de leitores de tela para acessibilidade (elemento puramente decorativo)
    >
      {/* Grupo da Asas Esquerdas (superior e inferior) */}
      <g className="left-wings">
        {/* Asa Superior Esquerda: Path usando curvas de Bézier Cúbicas (C) */}
        <path
          className="upper-wing"
          d="
            M47 37               /* M = Move para a coordenada inicial X:47, Y:37 (corpo da borboleta) */
            C35 5, 4 2, 8 27     /* C = Curva de Bézier cúbica: pontos de controle até a extremidade */
            C10 46, 31 48, 47 43 /* Curva de retorno suave para a base da asa */
            Z                    /* Z = Fecha o caminho conectando de volta ao ponto inicial */
          "
        />

        {/* Asa Inferior Esquerda */}
        <path
          className="lower-wing"
          d="
            M47 42
            C29 43, 12 51, 20 67
            C28 80, 43 58, 49 48
            Z
          "
        />

        {/* Círculo decorativo maior no interior da asa superior (cx/cy = centro, r = raio) */}
        <circle className="wing-detail" cx="23" cy="25" r="6" />

        {/* Círculo decorativo menor no interior da asa inferior */}
        <circle className="wing-detail-small" cx="28" cy="57" r="4" />
      </g>

      {/* Grupo das Asas Direitas (espelhamento simétrico do lado esquerdo) */}
      <g className="right-wings">
        {/* Asa Superior Direita */}
        <path
          className="upper-wing"
          d="
            M53 37
            C65 5, 96 2, 92 27
            C90 46, 69 48, 53 43
            Z
          "
        />

        {/* Asa Inferior Direita */}
        <path
          className="lower-wing"
          d="
            M53 42
            C71 43, 88 51, 80 67
            C72 80, 57 58, 51 48
            Z
          "
        />

        {/* Detalhes circulares das asas direitas */}
        <circle className="wing-detail" cx="77" cy="25" r="6" />
        <circle className="wing-detail-small" cx="72" cy="57" r="4" />
      </g>

      {/* Corpo Central da Borboleta (Elipse vertical: rx = raio horizontal, ry = raio vertical) */}
      <ellipse className="butterfly-body" cx="50" cy="43" rx="4.5" ry="21" />

      {/* Cabeça da Borboleta (Círculo no topo do corpo) */}
      <circle className="butterfly-head" cx="50" cy="21" r="5" />

      {/* Antena Esquerda (Curva de Bézier de linha fina) */}
      <path className="antenna" d="M48 19 C42 12, 38 9, 35 10" />

      {/* Antena Direita */}
      <path className="antenna" d="M52 19 C58 12, 62 9, 65 10" />
    </svg>
  );
}
```

---

## 🦋 Animação 3D do Bater de Asas (`ButterflyIcon.css`) com Comentários

O movimento das asas é uma animação em CSS usando a transformação `scaleX()`.

```css
/* Estilo base da tag SVG raiz da borboleta */
.butterfly-icon {
  width: 100%;
  height: 100%;
  overflow: visible; /* Garante que sombras projetadas fora da viewBox não sejam cortadas */

  /* Três camadas de sombras e iluminação neon projetadas (glow effect) */
  filter:
    drop-shadow(0 5px 10px rgba(252, 252, 255, 0.36))
    drop-shadow(0 0 18px rgba(244, 160, 223, 0.22))
    drop-shadow(0 0 24px rgba(204, 255, 188, 0.16));
  
  /* Transição suave ao trocar as sombras entre o tema padrão e o tema roxo */
  transition: filter 0.45s ease;
}

/* ==========================================================================
   CONFIGURAÇÃO DA ORIGEM DE ROTAÇÃO E ESCALA DOS GRUPOS DE ASAS
   ========================================================================== */
.left-wings,
.right-wings {
  /*
    transform-box: fill-box (PROPRIEDADE AVANÇADA SVG CSS)
    Por padrão no SVG, o ponto de origem das transformações (0,0) é o canto superior 
    esquerdo de todo o SVG (viewBox). 
    Com "fill-box", a caixa delimitadora (bounding-box) é calculada EXCLUSIVAMENTE 
    em cima do próprio grupo de elementos da asa!
  */
  transform-box: fill-box;

  /* Define o ponto pivô de rotação e encolhimento bem no centro do grupo das asas (junto ao corpo) */
  transform-origin: center;
}

/* Aplica o bater de asas no lado esquerdo */
.left-wings {
  /*
    animation: nome | duração | curva de velocidade | iteração | direção
    - var(--wing-speed): tempo vindo da propriedade inline do React (ex: 0.4s)
    - infinite: repete para sempre
    - alternate: vai de 0% a 100% e depois volta de 100% a 0% suavemente
  */
  animation: flap-left var(--wing-speed) ease-in-out infinite alternate;
}

/* Aplica o bater de asas no lado direito */
.right-wings {
  animation: flap-right var(--wing-speed) ease-in-out infinite alternate;
}

/* ==========================================================================
   KEYFRAMES: Ilusão de Batimento Tridimensional (3D Flapping)
   ========================================================================== */

/* Animação da Asa Esquerda */
@keyframes flap-left {
  /* 0%: Asa totalmente aberta e plana */
  0% {
    transform: scaleX(1) rotate(0deg);
  }

  /* 100%: Asa batendo no ponto máximo */
  100% {
    /*
      scaleX(0.2): ACHATAMENTO HORIZONTAL
      Reduz a largura da asa para apenas 20% da sua dimensão original no eixo X.
      Como o vetor 2D não tem profundidade Z, achatar a asa horizontalmente 
      cria a ILUSÃO 3D PERFEITA de que a asa está se levantando em direção à câmera!
      
      rotate(12deg): Levanta levemente a ponta da asa para cima durante a subida.
    */
    transform: scaleX(0.2) rotate(12deg);
  }
}

/* Animação da Asa Direita (Espelhada) */
@keyframes flap-right {
  0% {
    transform: scaleX(1) rotate(0deg);
  }
  100% {
    /* Achata no eixo X e gira -12deg (direção oposta ao lado esquerdo) */
    transform: scaleX(0.2) rotate(-12deg);
  }
}

/* Estilização de Preenchimento (Fill) e Contornos (Stroke) das Asas Padrão */
.upper-wing {
  fill: #ffe2f4;                            /* Cor rosa claro suave */
  stroke: rgba(255, 255, 255, 0.72);       /* Linha de contorno branca translúcida */
  stroke-width: 1.5;                       /* Espessura do contorno em pixels */
  transition: fill 0.4s ease, stroke 0.4s ease;
}

.lower-wing {
  fill: #d7f5b8;                            /* Cor verde claro pastel */
  stroke: rgba(255, 246, 255, 0.7);
  stroke-width: 1.5;
  transition: fill 0.4s ease, stroke 0.4s ease;
}

.butterfly-body,
.butterfly-head {
  fill: #35513a;                            /* Cor escura do corpo (tom verde-escuro orgânico) */
  transition: fill 0.4s ease;
}

.antenna {
  fill: none;                               /* Antenas não possuem preenchimento interior */
  stroke: #35513a;                         /* Cor da linha das antenas */
  stroke-width: 2;
  stroke-linecap: round;                    /* Arredonda as pontas das antenas */
  transition: stroke 0.4s ease;
}

/* ==========================================================================
   TROCA DINÂMICA DE CORES NO TEMA ROXO / NEON (.app--menu-theme)
   ========================================================================== */
.app--menu-theme .butterfly-icon {
  /* Substitui o brilho para tons de violeta/magenta profundos */
  filter:
    drop-shadow(0 5px 12px rgba(0, 0, 0, 0.4))
    drop-shadow(0 0 18px rgba(191, 78, 255, 0.32))
    drop-shadow(0 0 26px rgba(158, 38, 214, 0.26));
}

.app--menu-theme .upper-wing {
  fill: #f2d3ff;                             /* Rosa lilás neon */
  stroke: rgba(242, 182, 255, 0.72);
}

.app--menu-theme .lower-wing {
  fill: #bb78f4;                             /* Roxo vibrante */
  stroke: rgba(240, 207, 255, 0.58);
}
```
