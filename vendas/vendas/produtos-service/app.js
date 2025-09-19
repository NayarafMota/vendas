const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Simulação de banco de dados em memória
let produtos = [
  { id: 1, nome: 'Notebook Dell', descricao: 'Notebook Dell Inspiron 15', valor: 2500.00 },
  { id: 2, nome: 'Mouse Logitech', descricao: 'Mouse sem fio Logitech MX', valor: 150.00 },
  { id: 3, nome: 'Teclado Mecânico', descricao: 'Teclado mecânico RGB', valor: 300.00 },
  { id: 4, nome: 'Camiseta', descricao: 'Camiseta básica de algodão', valor: 50.00 },
  { id: 5, nome: 'Boné', descricao: 'Boné estiloso com aba curva', valor: 30.00 }
];
let proximoId = 6;

// Rota para listar todos os produtos
app.get('/produtos', (req, res) => {
  res.json({
    success: true,
    data: produtos
  });
});

// Rota para buscar produto por ID
app.get('/produtos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const produto = produtos.find(p => p.id === id);
  
  if (!produto) {
    return res.status(404).json({
      success: false,
      message: 'Produto não encontrado'
    });
  }
  
  res.json({
    success: true,
    data: produto
  });
});

// Rota para cadastrar novo produto
app.post('/produtos', (req, res) => {
  const { nome, descricao, valor } = req.body;
  
  if (!nome || !descricao || !valor) {
    return res.status(400).json({
      success: false,
      message: 'Nome, descrição e valor são obrigatórios'
    });
  }
  
  if (valor <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valor deve ser maior que zero'
    });
  }
  
  const novoProduto = {
    id: proximoId++,
    nome,
    descricao,
    valor: parseFloat(valor)
  };
  
  produtos.push(novoProduto);
  
  res.status(201).json({
    success: true,
    message: 'Produto cadastrado com sucesso',
    data: novoProduto
  });
});

// Rota para atualizar produto
app.put('/produtos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, descricao, valor } = req.body;
  
  const produtoIndex = produtos.findIndex(p => p.id === id);
  
  if (produtoIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Produto não encontrado'
    });
  }
  
  if (valor && valor <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valor deve ser maior que zero'
    });
  }
  
  if (nome) produtos[produtoIndex].nome = nome;
  if (descricao) produtos[produtoIndex].descricao = descricao;
  if (valor) produtos[produtoIndex].valor = parseFloat(valor);
  
  res.json({
    success: true,
    message: 'Produto atualizado com sucesso',
    data: produtos[produtoIndex]
  });
});

// Rota para deletar produto
app.delete('/produtos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const produtoIndex = produtos.findIndex(p => p.id === id);
  
  if (produtoIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Produto não encontrado'
    });
  }
  
  produtos.splice(produtoIndex, 1);
  
  res.json({
    success: true,
    message: 'Produto deletado com sucesso'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Produtos',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🛍️  Microserviço de Produtos (Node.js) rodando na porta ${PORT}`);
});

module.exports = app;
