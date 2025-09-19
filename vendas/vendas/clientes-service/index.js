const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Serviço de Clientes');
});

app.listen(3000, () => {
  console.log('Clientes rodando na porta 3000');
});
