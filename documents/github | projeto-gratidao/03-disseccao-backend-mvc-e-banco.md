# 🔬 Dissecção Detalhe por Detalhe: Backend MVC & Banco de Dados

> **Engenharia Reversa da Camada de Servidor, Controladores e Acesso a Dados**

---

## 1. 🚀 `Backend/index.js` & `Backend/db.js` — Servidor & Conexão TDS

### [`Backend/index.js`](file:///home/desenvolvedores/programa/projeto-gratidao/Backend/index.js)
```javascript
const express = require("express");
const app = express();
const cors = require("cors");
const gratidaoRoutes = require("./routes/gratidaoRoutes");

const PORT = 3000;

// [L10-L17] Middlewares Essenciais
app.use(cors());              // Permite que o frontend (aberto via Live Server ou arquivo) acesse o backend
app.use(express.json());       // Faz o parse automático do corpo das requisições POST para objetos JavaScript (req.body)
app.use(gratidaoRoutes);      // Registra os endpoints REST da aplicação

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

### [`Backend/db.js`](file:///home/desenvolvedores/programa/projeto-gratidao/Backend/db.js)
```javascript
const { Connection } = require('tedious');

const config = { 
    server: 'localhost',
    authentication: { 
        type: 'default', 
        options: { 
            userName: 'grupo3Logon', // Credenciais dedicadas do SQL Server
            password: '12345', 
        }, 
    }, 
    options: { 
        database: 'acao_de_gracas', 
        encrypt: false,               // Desativa criptografia TLS estrita em ambiente de desenvolvimento local
        port: 1433,                   // Porta padrão do protocolo TDS do SQL Server
        trustServerCertificate: true  // Evita erros de validação de certificados autoassinados locais
    }, 
}; 

function createConnection() {
    return new Connection(config);    // Fábrica de conexões (Connection Factory)
}

module.exports = createConnection;
```

---

## 2. 🏛️ `Backend/models/gratidaoModels.js` — Camada de Acesso a Dados (DAO)

* **Localização**: [`Backend/models/gratidaoModels.js`](file:///home/desenvolvedores/programa/projeto-gratidao/Backend/models/gratidaoModels.js)
* **Responsabilidade**: Estabelecer conexão com o SQL Server, parametrizar dados de entrada para evitar SQL Injection e processar streams de linhas retornadas.

### 📝 Código Integralmente Comentado:

```javascript
const createConnection = require("../db");
const { Request, TYPES } = require("tedious");

// ==========================================
// MÓDULO DE MENSAGENS CURTAS
// ==========================================

// 1. Obter todas as mensagens
exports.getAllMensagens = (callback) => {
  const connection = createConnection();
  connection.on("connect", (err) => {
    if (err) return callback(err, null);

    const query = `SELECT * FROM MensagensCurtas`;
    const request = new Request(query, (err) => {
      if (err) return callback(err, null);
    });

    const result = [];
    // O evento 'row' é disparado individualmente para cada linha retornada pelo SQL Server
    request.on("row", (columns) => {
      result.push({
        id: columns[0].value,
        tema: columns[2].value,
        mensagem: columns[1].value
      });
    });

    // O evento 'requestCompleted' sinaliza o fim da transmissão de dados
    request.on("requestCompleted", (rowCount) => {
      callback(null, rowCount === 0 ? [] : result);
    });

    connection.execSql(request);
  });
  connection.connect();
};

// 2. Obter mensagem aleatória via ORDER BY NEWID()
exports.getRandomMensagem = (callback) => {
  const connection = createConnection();
  connection.on("connect", (err) => {
    if (err) return callback(err, null);

    const query = `select top 1 * from MensagensCurtas order by NEWID()`;
    const request = new Request(query, (err) => {
      if (err) return callback(err, null);
    });

    let result = null;
    request.on("row", (columns) => {
      result = {
        id: columns[0].value,
        tema: columns[2].value,
        mensagem: columns[1].value,
      };
    });

    request.on("requestCompleted", (rowCount) => {
      callback(null, rowCount === 0 ? [] : result);
    });

    connection.execSql(request);
  });
  connection.connect();
};

// 3. Inserir nova mensagem com parâmetros tipados (Segurança contra SQL Injection)
exports.createMensagens = (data, callback) => {
  const connection = createConnection();
  connection.on("connect", (err) => {
    if (err) return callback(err, null);

    const query = `INSERT INTO MensagensCurtas (tema, mensagem) VALUES (@tema, @mensagem)`;
    const request = new Request(query, (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null, { message: "Mensagem adicionada" });
      }
    });

    // Parametrização estrita com TYPES do Tedious
    request.addParameter("tema", TYPES.VarChar, data.tema);
    request.addParameter("mensagem", TYPES.NVarChar, data.mensagem);
    connection.execSql(request);
  });
  connection.connect();
};

// ==========================================
// MÓDULO DE HISTÓRIAS INSPIRADORAS
// ==========================================

// 4. Buscar histórias por palavra-chave com operador LIKE
exports.getHistoriaByPalavra = (palavra, callback) => {
  const connection = createConnection();
  connection.on("connect", (err) => {
    if (err) return callback(err, null);

    const query = `select * from HistoriasInspiradoras where historia like '%${palavra}%'`;
    const request = new Request(query, (err) => {
      if (err) return callback(err, null);
    });

    const result = [];
    request.on("row", (columns) => {
      result.push({
        id: columns[0].value,
        titulo: columns[1].value,
        historia: columns[2].value,
        imagemURL: columns[3].value
      });
    });

    request.on("requestCompleted", () => {
      callback(null, result);
    });

    connection.execSql(request);
  });
  connection.connect();
};

// 5. Cadastrar nova história inspiradora
exports.createHistoria = (data, callback) => {
  const connection = createConnection();
  connection.on("connect", (err) => {
    if (err) return callback(err, null);

    const query = `INSERT INTO HistoriasInspiradoras (titulo, historia, imagemURL) VALUES (@titulo, @historia, @imagemURL)`;
    const request = new Request(query, (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null, { message: "História inserida com sucesso!" });
      }
    });

    request.addParameter("titulo", TYPES.NVarChar, data.titulo);
    request.addParameter("historia", TYPES.NVarChar, data.historia);
    request.addParameter("imagemURL", TYPES.NVarChar, data.imagemURL);
    connection.execSql(request);
  });
  connection.connect();
};
```

---

## 3. 🎛️ `Backend/controllers/gratidaoController.js` — Controladores HTTP

* **Localização**: [`Backend/controllers/gratidaoController.js`](file:///home/desenvolvedores/programa/projeto-gratidao/Backend/controllers/gratidaoController.js)
* **Responsabilidade**: Processar requisições recebidas das rotas, invocar os modelos e responder com os códigos de status HTTP apropriados (`200 OK`, `201 Created`, `404 Not Found`, `500 Internal Server Error`).

```javascript
const gratidaoModel = require("../models/gratidaoModels");

// Retorna lista com todas as mensagens
exports.getAllMensagens = (req, res) => {
    gratidaoModel.getAllMensagens((err, users) => {
        if (err) {
            res.status(500).send("Erro ao buscar Mensagens");
        } else {
            res.json(users);
        }
    });
};

// Retorna uma mensagem aleatória
exports.getRandomMensagem = (req, res) => {
    gratidaoModel.getRandomMensagem((err, mensagem) => {
        if (err) {
            res.status(500).send("Erro ao buscar mensagem");
        } else {
            res.json(mensagem);
        }
    });
};

// Cria uma nova mensagem (POST /mensagens)
exports.createMensagens = (req, res) => {
    const data = req.body;
    gratidaoModel.createMensagens(data, (err) => {
        if (err) {
            res.status(500).send('Erro ao criar a mensagem');
        } else {
            res.status(201).send('Mensagem criada com sucesso');
        }
    });
};

// Busca história por palavra extraída de req.params
exports.getHistoriaByPalavra = (req, res) => {
    const { palavra } = req.params;
    gratidaoModel.getHistoriaByPalavra(palavra, (err, historia) => {
        if (err) {
            res.status(500).send("Erro ao buscar a história!");
        } else if (!historia || historia.length === 0) {
            res.status(404).send("História não encontrada!");
        } else {
            res.json(historia);
        }
    });
};

// Cria uma história (POST /historia)
exports.createHistoria = (req, res) => {
    const data = req.body;
    gratidaoModel.createHistoria(data, (err) => {
        if (err) {
            res.status(500).send("Erro ao criar a História.");
        } else {
            res.status(201).send("História criada com sucesso!");
        }
    });
};
```
