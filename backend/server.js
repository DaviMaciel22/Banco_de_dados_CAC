// server.js — Entry point da aplicação
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    
    console.log('CAC LTDA - Servidor no ar!');
    
});
