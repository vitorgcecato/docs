# 🔬 Dissecção Técnica: Assistente de IA & Integração Gemini

> **Documentação de Engenharia Reversa do Projeto Teacher Up & Assistent**  
> *Análise Detalhada Linha por Linha de `Frontend/src/pages/AssistenteIA.jsx` e `AssistenteIA.css`*

---

## 📌 Responsabilidade do Arquivo

O arquivo `AssistenteIA.jsx` é o coração funcional da aplicação. Suas principais atribuições no ecossistema são:
1. **Captura e Validação de Parâmetros Pedagógicos**: Coleta tema, série/ano, tempo de aula e observações de inclusão.
2. **Engenharia de Prompt Especialista**: Constrói dinamicamente instruções rigorosas para guiar o Gemini a gerar um plano com estrutura da BNCC, timeboxing, dinâmicas ativas e exercícios com gabarito.
3. **Comunicação Assíncrona com a Google Gemini API**: Executa a chamada RESTful via `fetch` para o endpoint `gemini-2.5-flash:generateContent`.
4. **Parsing e Renderização em Árvore DOM Segura**: Transforma o retorno de texto Markdown em elementos React formatados (`<h4>`, `<ul>`, `<li>`, `<p>`, `<strong>`) sem injeção vulnerável de HTML.
5. **Automações de Produtividade**: Rola a tela suavemente para o resultado via `useRef`, permite cópia com 1 clique para a Área de Transferência e impressão/exportação para PDF.

---

## 💻 Código-Fonte Integralmente Comentado

Abaixo está o código de `AssistenteIA.jsx` com comentários pedagógicos detalhados em cada bloco crítico:

```javascript
import { useState, useRef } from "react"; 
// useState: gerencia estados locais reativos
// useRef: cria referências mutáveis que persistem entre renders sem disparar re-render (DOM access)

import { Link } from "react-router-dom"; // Link do React Router para transições SPA sem reload
import "./styles/AssistenteIA.css"; // Folha de estilos específica da página

import Navbar from "../components/Navbar.jsx"; // Barra de navegação global
import Footer from '../components/Footer.jsx'; // Rodapé institucional global

// --- Componentes SVG Inlined para Ícones Rápidos (Sem dependências extras) ---

// Ícone de brilho mágico para o botão de geração
const SparkleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962l6.135-1.582A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0l1.582 6.135a2 2 0 0 0 1.437 1.437l6.135 1.582a.5.5 0 0 1 0 .962l-6.135 1.582a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
  </svg>
);

// Ícone para copiar para a área de transferência
const CopyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-copy">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

// Ícone para baixar/imprimir PDF
const DownloadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-download">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

export default function AssistenteIA() {
  // 1. Estados controlados para os campos de entrada do formulário
  const [tema, setTema] = useState(""); 
  const [serie, setSerie] = useState(""); 
  const [duracao, setDuracao] = useState(""); 
  const [obs, setObs] = useState(""); 
  
  // 2. Estados de ciclo de vida da IA (resposta gerada e flag de carregamento)
  const [generatedContent, setGeneratedContent] = useState(null); 
  const [loading, setLoading] = useState(false); 
  
  // 3. Referências diretas aos nós do DOM
  const resultRef = useRef(null); // Permite rolar suavemente a página até a área de resultado
  const contentToPrintRef = useRef(null); // Captura o HTML interno formatado para o PDF

  // 4. Configurações de API lidas do ambiente Vite
  const API_KEY = import.meta.env.VITE_GEMINI_KEY; 
  const MODEL = "gemini-2.5-flash"; 

  // 5. Coleções de dados estáticos para preenchimento rápido
  const sugestoes = [ 
    "Vocabulário",
    "Figuras de Linguagem",
    "Redação ENEM",
    "Gêneros textuais",
    "Sinais de pontuação",
  ];

  const seriesFundamentalMedio = [ 
    "6º ano", "7º ano", "8º ano", "9º ano",
    "1º ano Ensino Médio", "2º ano Ensino Médio", "3º ano Ensino Médio",
  ];

  const duracoes = [
    "30 minutos",
    "50 minutos (1 aula)", 
    "1 hora e 40 minutos (2 aulas)", 
    "2 horas"
  ];

  // --- Função de Engenharia de Prompt (System & User Context) ---
  const buildPrompt = (tema, serie, duracao, obs) => `
    Atue como um Especialista Pedagógico em Língua Portuguesa com foco na BNCC (Base Nacional Comum Curricular).
    Sua tarefa é criar um **Plano de Aula de Excelência**, detalhado e pronto para aplicação imediata.

    DADOS DA AULA:
    - Tema: ${tema}
    - Público-Alvo: ${serie}
    - Tempo Disponível: ${duracao}
    - Contexto/Observações: ${obs || "Padrao"}

    ESTRUTURA OBRIGATÓRIA DA RESPOSTA (Siga estritamente esta ordem e formatação):

    ## 1. OBJETIVOS E BNCC
    * Liste de 2 a 4 Habilidades da BNCC (Código alfanumérico + descrição breve) pertinentes a este tema e série.
    * Defina 1 Objetivo Geral e 2 Objetivos Específicos claros.

    ## 2. ESTRATÉGIA E RECURSOS
    * Metodologia: Cite qual metodologia ativa será usada (Ex: Sala de Aula Invertida, Gamificação, Rotação por Estações, Aula Expositiva Dialogada).
    * Recursos Necessários: O que o professor precisa (datashow, folhas impressas, quadro, caixa de som, etc).

    ## 3. CRONOGRAMA DA AULA (Timeboxing)
    Divida o tempo total (${duracao}) em três momentos, descrevendo a ação do professor e do aluno:
    * **Introdução/Acolhida (aprox. 15% do tempo):** Como despertar o interesse inicial?
    * **Desenvolvimento (aprox. 60% do tempo):** A explicação do conteúdo e a atividade principal.
    * **Conclusão/Fechamento (aprox. 25% do tempo):** Sistematização do conhecimento e verificação de aprendizagem.

    ## 4. SUGESTÕES CRIATIVAS
    * Forneça 3 ideias de dinâmicas ou abordagens diferenciadas para este tema (algo que fuja do tradicional "quadro e giz").

    ## 5. ATIVIDADE PRÁTICA (Exercícios)
    * Crie 3 a 5 questões ou propostas de exercícios práticos para fixação.
    * **Inclua o Gabarito/Respostas Esperadas** logo abaixo de cada questão.

    ## 6. AVALIAÇÃO E ADAPTAÇÃO
    * Como avaliar se os alunos aprenderam?
    * **Dica de Inclusão:** Uma sugestão rápida para adaptar esta aula para alunos com dificuldades de aprendizagem ou NEE (Necessidades Educativas Especiais).

    REGRAS DE FORMATAÇÃO (IMPORTANTE):
    - Use "## " para Títulos das seções.
    - Use "* " para listas.
    - Use "**" para destacar termos chave.
    - Não use tabelas Markdown (o sistema não renderiza). Use listas.
    - Linguagem: Profissional, acolhedora e direta.
  `;

  // --- Função Assíncrona de Comunicação com a API ---
  const gerarPlano = async () => {
    // Validação defensiva de campos obrigatórios
    if (!tema || !serie || !duracao) {
      alert("Por favor, preencha os campos obrigatórios (*)");
      return;
    }

    setLoading(true);
    setGeneratedContent(null);

    const prompt = buildPrompt(tema, serie, duracao, obs);

    try {
      // Disparo da requisição POST para o Google Generative Language API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json", 
            "x-goog-api-key": API_KEY, // Autenticação por Header Google
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }], 
          }),
        }
      );

      const data = await response.json();
      // Acesso seguro opcional aos campos aninhados do payload retornado
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar conteúdo.";
      setGeneratedContent(reply);
      
      // Efeito de scroll suave para levar o usuário até o resultado
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);

    } catch (e) {
      console.error(e);
      setGeneratedContent("Erro de conexão com a IA.");
    } finally {
      // Garante que o loading seja desativado independentemente de sucesso ou falha
      setLoading(false);
    }
  };

  // --- Função de Cópia para o Clipboard ---
  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent)
        .then(() => {
          alert('Plano de aula copiado para a área de transferência!');
        })
        .catch(err => {
          console.error('Erro ao copiar o texto: ', err);
          alert('Erro ao copiar o plano de aula.');
        });
    }
  };

  // --- Função de Geração/Impressão de PDF ---
  const handleDownloadPDF = () => {
    if (contentToPrintRef.current) {
      // Cria uma janela pop-up isolada para impressão
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>Plano de Aula</title>');
      printWindow.document.write('<style>body{font-family: Arial, sans-serif; padding: 20px;} h4{color: #2c3e50; border-bottom: 2px solid #74c686;} strong{font-weight: bold;} ul{padding-left: 20px;}</style>');
      printWindow.document.write('</head><body>');
      
      // Injeta apenas o HTML interno do container de resultado
      printWindow.document.write(contentToPrintRef.current.innerHTML); 
      
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      // Dispara o diálogo nativo do sistema operacional/navegador
      printWindow.print(); 
    }
  };

  // --- Motor de Parsing & Renderização de Markdown Seguro ---
  
  const parseBold = (text) => {
    // Divide o texto delimitando os blocos de negrito **termo**
    const parts = text.split(/(\*\*.*?\*\*)/g); 
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: '#2c3e50' }}>{part.slice(2, -2)}</strong>;
      }
      return part; 
    });
  };

  const renderResponse = (text) => {
    if (!text) return null; 
    const lines = text.split('\n'); 
    const elements = []; 
    let listBuffer = []; 

    // Esvazia o buffer de itens <li> agrupando-os em uma única tag <ul>
    const flushList = () => {
      if (listBuffer.length > 0) {
        elements.push(<ul key={`list-${elements.length}`} className="ia-list">{[...listBuffer]}</ul>);
        listBuffer = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim(); 
      if (!trimmed) return; 

      // 1. Títulos de seção (## ou TEXTO EM MAIÚSCULAS COM DOIS PONTOS)
      if (trimmed.startsWith('##') || (trimmed === trimmed.toUpperCase() && trimmed.endsWith(':'))) {
        flushList(); 
        const titleText = trimmed.replace(/^#+\s*/, '').replace(/\*/g, ''); 
        elements.push(<h4 key={index} className="ia-subtitle">{titleText}</h4>); 
      }
      // 2. Itens de lista com marcadores (*, - ou numeração 1.)
      else if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\./.test(trimmed)) {
        const itemText = trimmed.replace(/^[\*\-\d\.]+\s*/, ''); 
        listBuffer.push(<li key={`li-${index}`}>{parseBold(itemText)}</li>); 
      }
      // 3. Parágrafos comuns de texto
      else {
        flushList(); 
        elements.push(<p key={index} className="ia-paragraph">{parseBold(trimmed)}</p>); 
      }
    });

    flushList(); // Garante o esvaziamento final da lista se o texto terminar em lista
    return elements; 
  };

  return (
    <section className="containerTotalPagina"> 
      {/* Elementos geométricos de background com pointer-events: none */}
      <section className="shape circle-blue-top-left"></section>
      <section className="shape circle-yellow-bottom-left"></section>
      <section className="shape circle-green-bottom-right"></section>
      <section className="shape rect-green-top"></section>
      <section className="shape circle-red-top"></section>
      <section className="shape circle-red-middle"></section>
      <section className="shape rect-blue-bottom-left"></section>

      <section className="content-wrapper"> 
        <Navbar />
        
        {/* Top Section: Hero + Formulário */}
        <section className="top-section">
          <section className="hero-column">
            <h1 className="hero-title">
              Crie seu <br /> plano <br /> de aula <br /> agora 
            </h1>
            <section className="expectations-btn-wrapper">
              <Link to="/expectativas" className="expectations-btn"> 
                Ver expectativas de<br/>cada Série/Ano
                <span className="icon-pointer">👆</span>
              </Link>
            </section>
          </section>

          <section className="form-section">
            <section className="form-card">
              <h2 className="form-title">Informações da Aula</h2> 

              <section className="input-group">
                <label>Tema da Aula *</label> 
                <input 
                  type="text" 
                  placeholder="Ex: Interpretação de Texto" 
                  value={tema} 
                  onChange={(e) => setTema(e.target.value)} 
                />
              </section>

              {/* Sugestões rápidas (Chips) */}
              <section className="suggestions-chips">
                <span className="suggestion-label">Sugestão</span>
                <section className="chips-container">
                  {sugestoes.map((s, i) => ( 
                    <button key={i} className="chip" onClick={() => setTema(s)}>{s}</button> 
                  ))}
                </section>
              </section>

              <section className="row-inputs">
                <section className="input-group half">
                  <label>Série / Ano *</label>
                  <select value={serie} onChange={(e) => setSerie(e.target.value)}> 
                    <option value="">Selecione</option> 
                    {seriesFundamentalMedio.map((s, i) => <option key={i} value={s}>{s}</option>)} 
                  </select>
                </section>
                <section className="input-group half">
                  <label>Duração *</label>
                  <select value={duracao} onChange={(e) => setDuracao(e.target.value)}> 
                    <option value="">Selecione</option>
                    {duracoes.map((d, i) => <option key={i} value={d}>{d}</option>)} 
                  </select>
                </section>
              </section>

              <section className="input-group">
                <label>Observações</label>
                <textarea 
                  placeholder="Ex: Turma de 30 alunos, foco em atividades práticas, uso de recursos audiovisuais, alunos com dificuldades de leitura, alunos com deficiências..." 
                  value={obs}
                  onChange={(e) => setObs(e.target.value)} 
                />
              </section>

              <button className="generate-btn" onClick={gerarPlano} disabled={loading}>
                {loading ? "Gerando..." : ( 
                  <>
                    <SparkleIcon /> Gerar Plano de Aula  
                  </>
                )}
              </button>
            </section>
          </section>
        </section>

        {/* Seção de Exibição do Resultado */}
        <section className="result-section" ref={resultRef}> 
          <h3 className="result-title">Plano Gerado</h3> 
          
          <section className="result-paper"> 
            {!generatedContent && !loading && ( 
              <section className="empty-state"> 
                <section className="empty-icon">✨</section> 
                <p className="empty-text-bold">Seu plano aparecerá aqui</p> 
                <p className="empty-text-small">Preencha as informações e clique em "Gerar"</p> 
              </section>
            )}

            {loading && ( 
              <section className="loading-state"> 
                <section className="spinner"></section> 
                <p>Criando seu plano mágico...</p> 
              </section>
            )}

            {generatedContent && ( 
              <section className="ia-content-wrapper">
                <section className="action-buttons-container">
                  <button className="action-btn copy-btn" onClick={handleCopy}>
                    <CopyIcon /> Copiar Plano
                  </button>
                  <button className="action-btn pdf-btn" onClick={handleDownloadPDF}>
                    <DownloadIcon /> Baixar PDF
                  </button>
                </section>

                <section className="ia-content" ref={contentToPrintRef}>
                  {renderResponse(generatedContent)} 
                </section>
              </section>
            )}
          </section>
        </section>

        <Footer />
      </section> 
    </section> 
  );
}
```

---

## 🔍 Explicação Passo a Passo da Execução

| Momento | O que acontece |
| :--- | :--- |
| **1. Antes da Chamada (Pré-Execução)** | O usuário digita ou clica em um chip de tema. O React atualiza os estados reativos correspondentes (`tema`, `serie`, `duracao`, `obs`). Ao clicar em "Gerar", a função `gerarPlano` confere se todos os campos mandatórios estão preenchidos. Caso positivo, seta `loading = true` (desabilitando o botão e exibindo o spinner) e zera `generatedContent`. |
| **2. Durante a Chamada (Execução Assíncrona)** | A função `buildPrompt` interpola os valores no template pedagógico. O método `fetch` envia uma requisição `POST` com payload JSON para o endpoint do Google Gemini (`v1beta`). O navegador aguarda a resposta enquanto a UI renderiza a animação `@keyframes spin`. |
| **3. Após o Retorno (Processamento & Render)** | O JSON de resposta é recebido e o texto em Markdown bruto é extraído através de encadeamento opcional seguro (`data?.candidates?.[0]?.content?.parts?.[0]?.text`). O estado `generatedContent` é preenchido e `loading` torna-se `false`. O `renderResponse` segmenta as linhas e converte os marcadores em nós virtuais do React. Um timer de `200ms` aciona `resultRef.current?.scrollIntoView({ behavior: 'smooth' })`, deslizando suavemente o viewport para o documento pronto. |
| **4. Pós-Processamento (Exportações)** | Ao acionar "Copiar", a **Clipboard API** transfere o Markdown puro formatado. Ao acionar "Baixar PDF", o nó DOM referenciado por `contentToPrintRef` é clonado para uma janela isolada com folha de estilo tipográfica de impressão e o diálogo nativo do sistema (`window.print()`) é aberto. |
