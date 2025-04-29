import { config } from 'dotenv';
config();
import app from './app';
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na Porta ${PORT} em todas as interfaces`);
});
