const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Servi�o de Clientes');
});

app.listen(3000, () => {
  console.log('Clientes rodando na porta 3000');
});
