# 🃏 Componente de Card & Estilização: `Card.jsx`

> **Estudo dos Arquivos**: `src/components/Card.jsx` e `src/components/styles/Card.css`

---

## 📌 Código do Componente Modular (`Card.jsx`) com Comentários

O `Card.jsx` é um componente flexível que pode renderizar tanto uma imagem, um ícone do FontAwesome ou um caractere decorativo padrão (`✦`), além de encaminhar eventos de foco e mouse.

```jsx
import './styles/Card.css'

export default function Card({
  img,            // URL da imagem de exibição do card (opcional)
  imgAlt,         // Texto alternativo para acessibilidade da imagem
  iconClassName,  // Classe de ícone FontAwesome (ex: "fa-brands fa-discord")
  title,          // Título principal do card (ex: "Doe no PIX")
  desc,           // Descrição curta informativa
  link,           // URL de destino ao clicar no card
  variant = "",   // Classe CSS adicional de variação (opcional)
  onClick,        // Handler de evento de clique personalizado
  onMouseEnter,   // Handler de evento de entrada do cursor sobre o card
  onMouseLeave,   // Handler de evento de saída do cursor do card
  onFocus,        // Handler de foco por navegação de teclado (Tab)
  onBlur,         // Handler de perda de foco por navegação de teclado
}) {
  // Padrão limpo JS: Combina a classe base "comp-card-container" com a classe variante (se existir).
  // .filter(Boolean) remove valores vazios, falsos ou undefined.
  // .join(" ") une as classes com um espaço simples (ex: "comp-card-container comp-card-container--menu").
  const cardClassName = ["comp-card-container", variant].filter(Boolean).join(" ");

  return (
    <a
      className={cardClassName}
      href={link}
      target="_blank"            // Abre o link em uma nova aba do navegador
      rel="noreferrer"           // Segurança: Impede que a nova aba acesse o window.opener do site
      onClick={onClick}          // Passa o evento onClick recebido por prop
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {/* 
         RENDERIZAÇÃO CONDICIONAL TRINÁRIA:
         1. Se houver prop "img", renderiza a tag <img>.
         2. Senão, se houver "iconClassName", renderiza a tag <i> com a classe do FontAwesome.
         3. Senão, renderiza o símbolo padrão "✦".
      */}
      {img ? (
        <img src={img} alt={imgAlt} />
      ) : iconClassName ? (
        <div className="comp-card-media-placeholder" aria-hidden="true">
          <i className={iconClassName} />
        </div>
      ) : (
        <div className="comp-card-media-placeholder" aria-hidden="true">
          ✦
        </div>
      )}

      {/* Seção com as informações de texto do Card */}
      <section className="comp-card-info">
        <h1>{title}</h1>
        <p>{desc}</p>
      </section>
    </a>
  );
}
```

---

## 🎨 Estilização Glassmorphism & Transições no CSS (`Card.css`)

O CSS do Card utiliza técnicas modernas de efeito de vidro fosco (*Glassmorphism*) e física de mola para o efeito de hover.

```css
/* Container base do Card clicável */
.comp-card-container {
  display: flex;             /* Layout flexbox horizontal */
  align-items: center;        /* Alinha a mídia e os textos perfeitamente no centro vertical */
  gap: 16px;                 /* Espaçamento de 16px entre o ícone e a caixa de texto */
  width: 100%;               /* Ocupa 100% da largura do container pai */
  padding: 16px 20px;        /* Espaçamento interno: 16px acima/abaixo e 20px nas laterais */
  border-radius: 20px;       /* Cantos bem arredondados */

  /* 
     EFEITO GLASSMORPHISM (VIDRO FOSCO):
     - background: Fundo branco semi-transparente (45% de opacidade)
     - backdrop-filter: Desfoca os elementos e borboletas que passarem por TRÁS do card
     - border: Borda translúcida suave que dá a sensação de relevo de vidro
  */
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px); /* Suporte para navegadores baseados em Webkit/Safari */
  border: 1px solid rgba(255, 255, 255, 0.6);

  text-decoration: none;      /* Remove o sublinhado padrão da tag <a> */
  color: #2e3a2f;             /* Cor verde-escuro elegante para o texto */

  /* 
     CONFIGURAÇÃO DE TRANSIÇÕES DE ANIMAÇÃO:
     Define transições individuais para transform, background e box-shadow.
     - cubic-bezier(0.34, 1.56, 0.64, 1): Curva de animação com EFEITO DE MOLA (Bounce).
       O valor de 1.56 faz o elemento ultrapassar levemente o tamanho final no hover e voltar,
       dando uma sensação tátil de elasticidade física!
  */
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.3s ease,
    box-shadow 0.3s ease;
}

/* ==========================================================================
   ESTADO HOVER E FOCUS (PASSO DO CURSOR OU NAVEGAÇÃO TAB)
   ========================================================================== */
.comp-card-container:hover,
.comp-card-container:focus-visible {
  /*
     transform: Elevação e Escala combinadas:
     - translateY(-4px): Sobe o card 4 pixels para cima no eixo Y.
     - scale(1.02): Aumenta o tamanho do card em 2% de forma proporcional.
  */
  transform: translateY(-4px) scale(1.02);

  /* Aumenta a opacidade do fundo branco para 65% ao passar o mouse */
  background: rgba(255, 255, 255, 0.65);

  /* Projeta uma sombra suave para enfatizar a flutuação 3D acima da página */
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}
```

---

## 💡 Resumo dos Conceitos de Engenharia de Software

1. **Efeito Mola com `cubic-bezier`**: Ajustar a curva Beziér para valores superiores a 1 (como `1.56`) cria animações elásticas profissionais sem depender de bibliotecas externas como Framer Motion.
2. **Backdrop-Filter**: Aplica um filtro de desfoque nos elementos situados atrás do container (as borboletas são desfocadas suavemente ao passarem por trás dos cards).
3. **Segurança Web (`rel="noreferrer"`)**: Sempre que usar `target="_blank"` em links externos, incluir `rel="noreferrer"` evita ataques de *Tabnabbing*, onde a página de destino poderia redirecionar a sua página original usando `window.opener.location`.
