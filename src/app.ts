import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes'; 
import { initializeDatabase } from './config/database';
import { setupSwagger } from './config/swagger';
const app = express();
setupSwagger(app);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/', routes);  
initializeDatabase();

export default app;