const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Serviço de Produtos');
});

app.listen(3000, () => {
  console.log('Produtos rodando na porta 3000');
});
