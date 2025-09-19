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
  const { nome, telefone, email } = req.body;

  // Validações básicas
  if (!nome || !telefone || !email) {
    return res.status(400).json({
      success: false,
      message: 'Nome, telefone e email são obrigatórios'
    });
  }

  if (!validarTelefone(telefone)) {
    return res.status(400).json({
      success: false,
      message: 'Telefone inválido. Formato esperado: (XX) XXXXX-XXXX'
    });
  }

  if (!validarEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email inválido'
    });
  }

  // Cria novo cliente
  const novoCliente = {
    id: proximoId++,
    nome,
    telefone,
    email,
    dataCadastro: new Date().toISOString()
  };

  clientes.push(novoCliente);

  res.status(201).json({
    success: true,
    data: novoCliente
  });
});

// Rota para atualizar cliente por ID
app.put('/clientes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const clienteIndex = clientes.findIndex(c => c.id === id);

  if (clienteIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Cliente não encontrado'
    });
  }

  const { nome, telefone, email } = req.body;

  if (telefone && !validarTelefone(telefone)) {
    return res.status(400).json({
      success: false,
      message: 'Telefone inválido. Formato esperado: (XX) XXXXX-XXXX'
    });
  }

  if (email && !validarEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email inválido'
    });
  }

  // Atualiza dados do cliente
  clientes[clienteIndex] = {
    ...clientes[clienteIndex],
    nome: nome || clientes[clienteIndex].nome,
    telefone: telefone || clientes[clienteIndex].telefone,
    email: email || clientes[clienteIndex].email
  };

  res.json({
    success: true,
    data: clientes[clienteIndex]
  });
});

// Rota para deletar cliente por ID
app.delete('/clientes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const clienteIndex = clientes.findIndex(c => c.id === id);

  if (clienteIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Cliente não encontrado'
    });
  }

  clientes.splice(clienteIndex, 1);

  res.json({
    success: true,
    message: 'Cliente deletado com sucesso'
  });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🧑‍🤝‍🧑 Microserviço de Clientes rodando na porta ${PORT}`);
});
