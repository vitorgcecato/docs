# 🔬 Dissecção Técnica: Login, Home, Sobre Nós e Componentes Globais

> **Documentação de Engenharia Reversa do Projeto Teacher Up & Assistent**  
> *Análise Detalhada dos Módulos de Apresentação, Autenticação e Navegação*

---

## 📌 1. Módulo de Autenticação (`Login.jsx` & `Login.css`)

### Responsabilidade
Gerencia o controle de acesso à ferramenta de planejamento. Implementa validação reativa de credenciais, feedback contextual de erro/sucesso e redirecionamento temporizado suave via `useNavigate` e `useEffect`.

```javascript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Hook para navegação programática
import "./styles/Login.css";

const Login = () => {
    const navigate = useNavigate();

    // 1. Estados dos campos do formulário
    const [user, setUser] = useState("");
    const [senha, setSenha] = useState("");

    // 2. Estados de feedback e validação
    const [status, setStatus] = useState("");
    const [validacao, setValidacao] = useState(false);

    // 3. Flag de controle para disparo de redirecionamento temporizado
    const [shouldRedirect, setShouldRedirect] = useState(false);

    // 4. Hook useEffect para lidar com o delay de 2 segundos antes de navegar
    useEffect(() => {
        if (shouldRedirect) {
            // Agenda a transição de rota para dar tempo ao usuário de ler a mensagem de sucesso
            const timer = setTimeout(() => {
                navigate("/assistente");
            }, 2000);

            // Função de limpeza (cleanup): cancela o timer se o componente desmontar
            return () => clearTimeout(timer);
        }
    }, [shouldRedirect, navigate]);

    // 5. Função de validação de credenciais
    const validarLogin = (e) => {
        e.preventDefault(); // Evita o reload padrão do formulário HTML
       
        setValidacao(false);
        setShouldRedirect(false);

        // Verificação defensiva de preenchimento
        if (user === "" || senha === "") {
            if (user === "" && senha === "") {
                setStatus("Por favor, preencha os campos de usuário e senha.");
            } else if (user === "") {
                setStatus("Por favor, preencha o campo de usuário.");
            } else {
                setStatus("Por favor, preencha o campo de senha.");
            }
            return;
        }

        // Validação de credenciais mockadas para a professora Palloma
        if (user === "palloma" && senha === "1234") {
            setValidacao(true);
            setStatus("Login bem-sucedido! Redirecionando...");
            setShouldRedirect(true); // Aciona o useEffect
        } else {
            setStatus("Usuário ou senha incorretos.");
            setValidacao(false);
        }
    };

    return (
        <section className="login-container">
            {/* Formas decorativas no fundo com absolute positioning */}
            <span className="forma circulo-amarelo"></span>
            <span className="forma circulo-amarelo-g"></span>
            <span className="forma circulo-laranja"></span>
            <span className="forma circulo-azul"></span>
            <span className="forma circulo-vermelho"></span>
            <span className="forma circulo-vermelho-g"></span>
            <span className="forma circulo-verde"></span>
            <span className="forma circulo-amarelo"></span>
            <span className="forma retangulo-verde"></span>
            <span className="forma retangulo-azul"></span>
            <span className="forma retangulo-verde-h"></span>

            {/* Cartão de Login com Glassmorphism (backdrop-filter: blur) */}
            <section className="login-box">
                <h1 className="login-titulo">
                    Comece agora <br />
                    mesmo, faça o <br />
                    login
                </h1>

                <form onSubmit={validarLogin}>
                    <section className="login-inputs">
                        <label htmlFor="user">Usuário</label>
                        <input
                            type="text"
                            id="user"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            disabled={shouldRedirect} // Bloqueia edição durante a transição
                        />
                    </section>

                    <section className="login-inputs">
                        <label htmlFor="password">Senha</label>
                        <input
                            type="password"
                            id="senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            disabled={shouldRedirect}
                        />
                    </section>
                   
                    {/* Mensagem dinâmica de feedback com classe condicional */}
                    {status && (<p className={validacao ? "status-sucesso" : "status-erro"}>{status}</p>)}
                   
                    <button
                        type="submit"
                        className="login-botao"
                        disabled={shouldRedirect}
                    >
                        {shouldRedirect ? "Acessando..." : "Entrar"}
                    </button>
                </form>
            </section>
        </section>
    );
};

export default Login;
```

---

## 📌 2. Página Inicial (`Home.jsx` & `Home.css`)

### Responsabilidade
Landing page limpa com tipografia display massiva de 200px, apresentação da proposta de valor e ponto de entrada para autenticação.

```javascript
import { Link } from "react-router-dom";
import "./styles/Home.css";
import quadradoHome from "../assets/quadradoHome.png";

export default function Home() {
  return (
    <section className="siteTodo">
      {/* Botão de acesso ao Login posicionado no canto superior direito */}
      <section className="blocosNavbarHome"> 
        <Link className="blocoLoginNavbarHome" to="/login"> Login </Link>
      </section>

      {/* Seção Principal com Título Monumental e Mensagem */}
      <section className="blocoPrincipalHome">
        <section>
          <h1 className="tituloHome">
            TEACHER <br /> UP & <br /> ASSISTENT
          </h1>
        </section>

        <section className="blocoTexto">
          <img className="quadradoHome" src={quadradoHome} alt="Enfeite" />
          <p className="textoHome">
            Nós somos uma página para <br /> ajudar você em seus <br />
            planejamentos de aulas.
          </p>
        </section>
      </section>

      {/* Sequência decorativa de blocos geométricos azuis */}
      <section className="blocosHome">
        <span className="home-shape blocoAzulHome"></span>
        <span className="home-shape blocoAzulHome"></span>
        <span className="home-shape blocoAzulHome"></span>
        <span className="home-shape blocoAzulHome"></span>
        <span className="home-shape blocoAzulHome"></span>
        <span className="home-shape blocoAzulHome"></span>
        <span className="home-shape blocoAzulHome"></span>
        <span className="home-shape blocoAzulHome"></span>
        <span className="home-shape blocoAzulHome"></span>
      </section>
    </section>
  );
}
```

---

## 📌 3. Página Institucional (`SobreNos.jsx` & `SobreNos.css`)

### Responsabilidade
Apresenta o time de desenvolvimento (Grupo 3 - SENAI/SESI Vinhedo), princípios orientadores do projeto e mapa dinâmico de cards dos integrantes.

```javascript
import React from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from '../components/Footer.jsx';
import "./styles/SobreNos.css";

// Mapeamento declarativo dos integrantes da equipe
const integrantes = [
    { nome: "Laura Betti", fotoUrl: "../src/assets/FtLaura.png" },
    { nome: "Lucas Casagrande", fotoUrl: "../src/assets/FtLucas.png" },
    { nome: "Milena", fotoUrl: "../src/assets/FtMilena.png" },
    { nome: "Pietro Melle", fotoUrl: "../src/assets/FtPietro.png" },
    { nome: "Pyetro Joaquim", fotoUrl: "../src/assets/FtPyetro.png" },
    { nome: "Vitor Geraldo", fotoUrl: "../src/assets/FtVitor.png" },
];

// Subcomponente de Card Individual do Integrante
const IntegranteCard = ({ nome, fotoUrl }) => (
    <section className="integrante-card">
        <section className="integrante-placeholder-image">
            <img src={fotoUrl} alt={`Foto de ${nome}`} className="integrante-photo" />
        </section>
        <p className="integrante-name">{nome}</p>
    </section>
);

export default function SobreNos() {
    return (
        <section className="page-container sobre-nos-page">
            <section className="sobre-navbar">
                <Navbar />
            </section>

            {/* Formas decorativas de fundo */}
            <section className="shape sobre-nos-retangulo-verde"></section>
            <section className="shape sobre-nos-circle-red-small-top"></section>
            <section className="shape sobre-nos-circle-red-left"></section>
            <section className="shape sobre-nos-circle-yellow-top"></section>
            <section className="shape sobre-nos-circle-lightblue-right"></section>

            <section className="content-wrapper">
                <section className="sobre-nos-content">
                    <header className="sobre-nos-header">
                        <h1 className="sobre-nos-title">Sobre nós</h1>
                    </header>

                    <section className="about-us-hero-section">
                        <section className="about-text-column">
                            <p className="sobre-nos-paragraph">
                                O grupo 3 é formado por Laura Betti, Lucas Casagrande, Milena, Pietro Melle, Pyetro Joaquim e Vitor Geraldo. Nosso grupo se destaca por valorizar 
                                três princípios fundamentais: honestidade, comprometimento e união.
                            </p>
                        </section>

                        <section className="about-image-column">
                            <img
                                src="../src/assets/imgGrupo.png"
                                alt="Foto do grupo 3"
                                className="group-photo"
                            />
                        </section>
                    </section>

                    <br /><br />

                    <section className="about-text-column2">
                        <p className="sobre-nos-paragraph">
                            Neste projeto desenvolvemos uma aplicação web completa (Full Stack). Utilizamos a API Gemini para auxiliar a professora Palloma Favarão em seus planejamentos pedagógicos.
                        </p>
                    </section>

                    {/* Grid com auto-distribuição dos integrantes */}
                    <section className="integrantes-section">
                        <h2 className="integrantes-title">Integrantes do grupo:</h2>
                        <section className="integrantes-grid">
                            {integrantes.map((integrante, index) => (
                                <IntegranteCard key={index} {...integrante} />
                            ))}
                        </section>
                    </section>
                </section>

                <Footer />
            </section>
        </section>
    );
}
```

---

## 📌 4. Componentes Globais de Navegação (`Navbar.jsx` e `Footer.jsx`)

### `Navbar.jsx`
Fornece links de navegação estilizados como blocos coloridos flutuantes:
```javascript
import { Link } from "react-router-dom";
import "../components/styles/Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link className="blocoLoginNavbar" to="/assistente"> Home </Link>
      <Link className="blocoSobreNavbar" to="/sobrenos"> Sobre </Link>
    </nav>
  );
}
```

### `Footer.jsx`
Rodapé com formas geométricas exclusivas e créditos institucionais do Grupo 3 (2025):
```javascript
import "./styles/Footer.css";

export default function Footer() {
  return (
    <footer className="simple-footer">
      <section className="shape-footer circle-blue-top-left-footer"></section>
      <section className="shape-footer circle-yellow-bottom-left-footer"></section>

      <section className="logo-placeholder">
        <img src="/logoGrupo3.png" alt="Logo Grupo 3" />
      </section>
      <section className="rights">
        <strong>Grupo 3</strong>
        <br />
        Todos os Direitos Reservados
      </section>
      <section className="year">2025</section>
    </footer>
  );
}
```
