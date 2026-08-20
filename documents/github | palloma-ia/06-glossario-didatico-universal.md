# 📚 Glossário Didático Universal

> **Documentação de Engenharia Reversa do Projeto Teacher Up & Assistent**  
> *Dicionário de Conceitos de Engenharia de Software, IA e Desenvolvimento Web Traduzidos para Linguagem Simples*

---

| Termo Técnico | O que é no Código? | Explicação no Mundo Real (Analogia Simples) |
| :--- | :--- | :--- |
| **SPA (Single Page Application)** | Arquitetura onde o React Router intercepta cliques e troca as páginas na tela sem recarregar o navegador do zero. | Em vez de trocar de caderno a cada matéria nova, é como virar a página de um mesmo fichário de forma instantânea. |
| **Prompt Engineering** | As regras e moldes de texto enviados ao modelo (`buildPrompt`) ordenando seções como Objetivos, Metodologias e Exercícios. | É como preencher uma ordem de serviço detalhada para um marceneiro, especificando o tipo de madeira, medidas e acabamento, em vez de apenas pedir "faça uma mesa". |
| **LLM (Large Language Model)** | O modelo neural Gemini (`gemini-2.5-flash`) que processa a linguagem e gera as respostas em texto. | Um especialista erudito que leu milhares de livros e diretrizes pedagógicas e sintetiza respostas baseadas na solicitação. |
| **AST (Abstract Syntax Tree) / Parser** | O mecanismo que percorre a resposta do modelo (`renderResponse`) identificando títulos, marcadores e negritos. | Um revisor que lê um rascunho corrido e destaca canetas coloridas para títulos, tópicos e notas de rodapé antes de publicar o livro. |
| **Glassmorphism (`backdrop-filter`)** | Propriedade CSS que aplica um desfoque suave (`blur(12px)`) e transparência no fundo do cartão de login. | Um vidro fosco de janela através do qual você vê as cores e luzes do lado de fora de forma embaçada e elegante. |
| **Pointer Events (`pointer-events: none`)** | Regra CSS aplicada às formas decorativas para que elas não capturem cliques nem toques na tela. | Como um holograma ou raio de luz: você consegue enxergar a forma, mas sua mão atravessa direto para tocar no botão que está atrás. |
| **Timeboxing** | Técnica pedagógica que fatia a aula em blocos percentuais rígidos (15% introdução, 60% desenvolvimento, 25% fechamento). | Dividir o tempo de uma partida de futebol em tempos regulamentares para garantir que haja aquecimento, jogo e prorrogação sem atrasos. |
| **Clipboard API (`navigator.clipboard`)** | API nativa do navegador que insere o texto do planejamento diretamente na Área de Transferência do sistema operacional. | Um atalho universal de "Ctrl + C" acionado por um único clique de botão. |
| **Native Print Pipeline (`window.print`)** | Chamada ao diálogo de impressão do sistema operacional usando uma janela isolada com CSS tipográfico limpo. | Uma copiadora que pega apenas o texto final aprovado e descarta rascunhos e enfeites da mesa de trabalho ao imprimir. |
| **Regex Multilinha (`[\s\S]*`)** | Expressão regular que casa qualquer caractere, incluindo quebras de linha, para isolar blocos de arrays `[...]`. | Uma peneira fina que captura exatamente a caixa de peças no meio de uma enxurrada de folhas e areia. |
| **Virtual DOM & Imunidade a XSS** | Geração de elementos `<h4 />` e `<ul />` pelo React sem usar `dangerouslySetInnerHTML`. | Uma esteira de inspeção onde nenhum pacote entra na fábrica sem ser verificado contra substâncias perigosas. |
| **Cleanup Function no `useEffect`** | O retorno `() => clearTimeout(timer)` que cancela o agendador de tempo se o usuário fechar ou mudar de tela. | Desligar o forno antes de sair de casa para não queimar nada se os planos mudarem de última hora. |
| **Variáveis de Ambiente (`import.meta.env`)** | Variáveis prefixadas com `VITE_` que armazenam chaves e configurações sensíveis de build. | Um cofre de chaves de serviço onde os códigos de acesso são mantidos separados do manual público. |
