import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db';

// Importar rotas
import authRoutes from './routes/auth';
import usuariosRoutes from './routes/usuarios';
import prestadoresRoutes from './routes/prestadores';
import servicosRoutes from './routes/servicos';
import pedidosRoutes from './routes/pedidos';
import carteiraRoutes from './routes/carteira';
import slotsRoutes from './routes/slots';
import enderecosRoutes from './routes/enderecos';
import favoritosRoutes from './routes/favoritos';
import perfilRoutes from './routes/perfil';

// Carregar variáveis de ambiente
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Inicializar banco de dados
try {
  initializeDatabase();
} catch (error) {
  console.error('Erro ao inicializar banco de dados:', error);
  process.exit(1);
}

// Rotas
app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/prestadores', prestadoresRoutes);
app.use('/servicos', servicosRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/carteira', carteiraRoutes);
app.use('/slots', slotsRoutes);
app.use('/enderecos', enderecosRoutes);
app.use('/favoritos', favoritosRoutes);
app.use('/perfil', perfilRoutes);

// Rota de health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    sucesso: true,
    mensagem: 'API funcionando corretamente',
    timestamp: new Date().toISOString(),
  });
});

// Rota raiz
app.get('/', (req: Request, res: Response) => {
  res.json({
    sucesso: true,
    mensagem: 'Bem-vindo à API Upserv',
    versao: '1.0.0',
    endpoints: {
      autenticacao: {
        login: 'POST /auth/login',
        recuperarSenha: 'POST /auth/recuperar-senha',
      },
      usuarios: {
        criar: 'POST /usuarios',
        listar: 'GET /usuarios',
        obter: 'GET /usuarios/:id',
        atualizar: 'PUT /usuarios/:id',
        deletar: 'DELETE /usuarios/:id',
      },
      prestadores: {
        criar: 'POST /prestadores',
        listar: 'GET /prestadores',
        obter: 'GET /prestadores/:id',
        atualizar: 'PUT /prestadores/:id',
        deletar: 'DELETE /prestadores/:id',
      },
      servicos: {
        listar: 'GET /servicos',
        listarPendentes: 'GET /servicos/pendentes',
        criar: 'POST /servicos',
        obter: 'GET /servicos/:id',
        atualizar: 'PUT /servicos/:id',
        deletar: 'DELETE /servicos/:id',
        aprovar: 'POST /servicos/:id/aprovar',
        rejeitar: 'POST /servicos/:id/rejeitar',
      },
      pedidos: {
        criar: 'POST /pedidos',
        listarMinhas: 'GET /pedidos/minhas',
        responder: 'POST /pedidos/:id/resposta',
        pagar: 'POST /pedidos/:id/pagar',
        confirmarFinalizacao: 'POST /pedidos/:id/confirmar-finalizacao',
      },
      health: 'GET /health',
    },
  });
});

// Tratamento de erros 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    caminho: req.path,
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║  🚀 API Upserv iniciada!           ║
║  📍 http://localhost:${PORT}       ║
║  🗄️  Banco de dados: SQLite        ║
╚════════════════════════════════════╝
  `);
});

export default app;
