require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
//@ts-ignore
const nodemailer = require('nodemailer');



const app = express();
const port = process.env.PORT || 3000;
const db = new sqlite3.Database('./meubanco.db');
const key = process.env.API_KEY;
db.run(`CREATE TABLE IF NOT EXISTS login(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL
)`)
db.run(`CREATE TABLE IF NOT EXISTS historicos (  
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    ativo TEXT NOT NULL,
    data TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES login(id)
)`);
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// 🔁 Aqui usamos express.json() no lugar do body-parser
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


function convertU(u) {
  const dt = new Date(u * 1000);
  const meses = ['Jan','Feb','Mar','Abr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dia = dt.getDate();
  const mes = meses[dt.getMonth()];
  const ano = dt.getFullYear();
  return `${dia < 10 ? '0' + dia : dia} ${mes} ${ano}`;
}

async function pegaI(simbolo,url) {
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    const historico = data.results[0].historicalDataPrice;

    const datas = [];
    const valores = [];

    historico.forEach((h) => {
      datas.push(convertU(h.date));
      valores.push(h.close);
    });

    return { datas, valores };
  } catch (err) {
    console.error("Erro ao buscar dados:", err);
    return { datas: [], valores: [] };
  }
}

app.post('/dados', async (req, res) => {
  const simbolo = req.body.simbolo;

  if (!simbolo) {
    return res.status(400).json({ erro: 'Simbolo não informado' });
  }

  try {
    const { datas, valores } = await pegaI(simbolo,`https://brapi.dev/api/quote/${simbolo}?range=3mo&interval=1d&token=${key}`);
    
    res.json({ datas, valores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar dados' });
  }
});

const codigosPendentes = {};
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM login WHERE email = ?",[email], async (err, row) => {
    if(err) return res.status(500).send('Erro no server');
    if(!row) return res.status(400).send('Usuário não encontrado');

    const match = await bcrypt.compare(password, row.senha);
    if(!match) return res.status(400).send('Senha incorreta');

    res.send("Login realizado com sucesso");
  })
});
app.post('/salvarData', async (req, res) => {
  const nome = req.body.nome;
  const email = req.body.email;
  const password = req.body.password;
  const hashPassword = await bcrypt.hash(password, process.env.SALT_ROUNDS||10);
  db.run(
    "INSERT INTO login (nome, email, senha) VALUES (?, ?, ?)",
    [nome, email, hashPassword],
    function(err){
      if(err){
        console.error(err.message);
        return res.status(500).send("Erro ao salvar usuario");
      }
      res.send("Usuário salvo com sucesso");
    }
  )
});
app.post('/enviarC', (req, res) => {
  const { emailDestino } = req.body;

  const codigo = Math.floor(100000 + Math.random() * 900000);

  codigosPendentes[emailDestino] = codigo;
  setTimeout(() => delete codigosPendentes[emailDestino], 10 * 60 * 1000);

  const mailOptions = {
    from: `"Meu Projeto" <${process.env.EMAIL_USER}>`,
    to: emailDestino,
    subject: "Seu código de validação",
    text: `Seu código de validação é: ${codigo}`
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if(error){
      console.error(error);
      res.status(500).send('Erro ao enviar o e-mail');
    }else {
      console.log('email enviado:', info.response);
      res.send('Código enviado com sucesso');
    }
  })


});


app.post('/validarC', (req,res) => {
  const {emailDestino, codigoEnviado} = req.body;

  if(codigosPendentes[emailDestino] && codigosPendentes[emailDestino].toString() === codigoEnviado.toString()){
    delete codigosPendentes[emailDestino];
    res.send('Código validado com sucesso!');
  }else {
    res.status(400).send('Código inválido');
  }
});
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});