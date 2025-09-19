const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Simulação de banco de dados em memória
let clientes = [
  {
    id: 1,
    nome: 'João',
    telefone: '(11) 91234-5678',
    email: 'joao@example.com',
    dataCadastro: new Date().toISOString()
  },
  {
    id: 2,
    nome: 'Maria',
    telefone: '(21) 99876-5432',
    email: 'maria@example.com',
    dataCadastro: new Date().toISOString()
  }
];

let proximoId = 3;

// Função para validar formato de telefone
const validarTelefone = (telefone) => {
  const regex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return regex.test(telefone);
};

// Função para validar email
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Rota para listar todos os clientes
app.get('/clientes', (req, res) => {
  res.json({
    success: true,
    data: clientes,
    total: clientes.length
  });
});

// Rota para buscar cliente por ID
app.get('/clientes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const cliente = clientes.find(c => c.id === id);

  if (!cliente) {
    return res.status(404).json({
      success: false,
      message: 'Cliente não encontrado'
    });
  }

  res.json({
    success: true,
    data: cliente
  });
});

// Rota para cadastrar novo cliente
app.post('/clientes', (req, res) => {
  const { nome, telefone, email } = req
