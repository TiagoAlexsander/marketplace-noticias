import sqlite3 from 'sqlite3';
import path from 'path';

// Criar conexão com o banco de dados SQLite
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');

// Criar/abrir banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
  } else {
    console.log('✓ Conectado ao banco de dados SQLite');
  }
});

// Wrapper para fazer queries de forma síncrona/promise-based
export const runQuery = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const getQuery = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const allQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const isDuplicateColumnError = (err: Error) => err.message.includes('duplicate column name');

const addColumnIfMissing = (sql: string) => {
  db.run(sql, (err) => {
    if (err && !isDuplicateColumnError(err)) {
      console.error(`Erro ao executar migração: ${sql}`, err);
    }
  });
};

const ensureDefaultAdmin = async () => {
  try {
    const totalAdmins = await getQuery('SELECT COUNT(*) AS total FROM usuarios WHERE role = ?', ['admin']);
    if ((totalAdmins?.total || 0) > 0) {
      return;
    }

    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
    if (adminEmail) {
      const user = await getQuery('SELECT id FROM usuarios WHERE email = ?', [adminEmail]);
      if (user) {
        await runQuery('UPDATE usuarios SET role = ? WHERE id = ?', ['admin', user.id]);
        console.log(`✓ Usuário ${adminEmail} promovido para admin`);
        return;
      }
    }

    const firstUser = await getQuery('SELECT id, email FROM usuarios ORDER BY id ASC LIMIT 1');
    if (firstUser) {
      await runQuery('UPDATE usuarios SET role = ? WHERE id = ?', ['admin', firstUser.id]);
      console.log(`✓ Primeiro usuário (${firstUser.email}) promovido para admin`);
    }
  } catch (error) {
    console.error('Erro ao configurar admin padrão:', error);
  }
};

// Criar tabelas se não existirem
export function initializeDatabase() {
  try {
    db.serialize(() => {
    // Criar tabela usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'usuario',
        prestador_status TEXT NOT NULL DEFAULT 'nenhum',
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Erro ao criar tabela usuarios:', err);
      else console.log('✓ Tabela usuarios OK');
    });

    // Criar tabela prestadores
    db.run(`
      CREATE TABLE IF NOT EXISTS prestadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL UNIQUE,
        descricao TEXT,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Erro ao criar tabela prestadores:', err);
      else console.log('✓ Tabela prestadores OK');
    });

    // Criar tabela servicos
    db.run(`
      CREATE TABLE IF NOT EXISTS servicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prestador_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Erro ao criar tabela servicos:', err);
      else console.log('✓ Tabela servicos OK');
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS solicitacoes_prestador (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        descricao TEXT,
        status TEXT NOT NULL DEFAULT 'pendente',
        motivo TEXT,
        analisado_por INTEGER,
        analisado_em TEXT,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (analisado_por) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `, (err) => {
      if (err) console.error('Erro ao criar tabela solicitacoes_prestador:', err);
      else console.log('✓ Tabela solicitacoes_prestador OK');
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        servico_id INTEGER NOT NULL,
        contratante_id INTEGER NOT NULL,
        prestador_id INTEGER NOT NULL,
        valor REAL NOT NULL,
        mensagem TEXT,
        status TEXT NOT NULL DEFAULT 'pendente',
        confirmado_contratante INTEGER NOT NULL DEFAULT 0,
        confirmado_prestador INTEGER NOT NULL DEFAULT 0,
        aceito_em TEXT,
        recusado_em TEXT,
        pago_em TEXT,
        concluido_em TEXT,
        expirado_em TEXT,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE,
        FOREIGN KEY (contratante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Erro ao criar tabela pedidos:', err);
      else console.log('✓ Tabela pedidos OK');
    });

    addColumnIfMissing("ALTER TABLE usuarios ADD COLUMN role TEXT NOT NULL DEFAULT 'usuario'");
    addColumnIfMissing("ALTER TABLE usuarios ADD COLUMN prestador_status TEXT NOT NULL DEFAULT 'nenhum'");

    // Colunas de aprovação de serviços (v2)
    addColumnIfMissing("ALTER TABLE servicos ADD COLUMN status TEXT NOT NULL DEFAULT 'aprovado'");
    addColumnIfMissing("ALTER TABLE servicos ADD COLUMN motivo TEXT");
    addColumnIfMissing("ALTER TABLE servicos ADD COLUMN analisado_por INTEGER");
    addColumnIfMissing("ALTER TABLE servicos ADD COLUMN analisado_em TEXT");
    addColumnIfMissing("ALTER TABLE servicos ADD COLUMN descricao TEXT");

    // Colunas de perfil (v3)
    addColumnIfMissing("ALTER TABLE usuarios ADD COLUMN foto_url TEXT");
    addColumnIfMissing("ALTER TABLE usuarios ADD COLUMN bio TEXT");
    addColumnIfMissing("ALTER TABLE usuarios ADD COLUMN ultimo_acesso TEXT");

    // Slots de disponibilidade do prestador (v3)
    db.run(`
      CREATE TABLE IF NOT EXISTS slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prestador_id INTEGER NOT NULL,
        data_hora TEXT NOT NULL,
        duracao_minutos INTEGER NOT NULL DEFAULT 60,
        disponivel INTEGER NOT NULL DEFAULT 1,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Erro ao criar tabela slots:', err);
      else console.log('✓ Tabela slots OK');
    });

    // Carteiras dos usuários (v3)
    db.run(`
      CREATE TABLE IF NOT EXISTS carteiras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL UNIQUE,
        saldo REAL NOT NULL DEFAULT 0,
        atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Erro ao criar tabela carteiras:', err);
      else console.log('✓ Tabela carteiras OK');
    });

    // Histórico de transações da carteira (v3)
    db.run(`
      CREATE TABLE IF NOT EXISTS transacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        carteira_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        valor REAL NOT NULL,
        descricao TEXT,
        pedido_id INTEGER,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (carteira_id) REFERENCES carteiras(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Erro ao criar tabela transacoes:', err);
      else console.log('✓ Tabela transacoes OK');
    });

    // Favoritos do usuário (v3)
    db.run(`
      CREATE TABLE IF NOT EXISTS favoritos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        servico_id INTEGER NOT NULL,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (usuario_id, servico_id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Erro ao criar tabela favoritos:', err);
      else console.log('✓ Tabela favoritos OK');
    });

    // Endereços do usuário (v3)
    db.run(`
      CREATE TABLE IF NOT EXISTS enderecos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        logradouro TEXT NOT NULL,
        numero TEXT,
        complemento TEXT,
        bairro TEXT,
        cidade TEXT NOT NULL,
        estado TEXT NOT NULL,
        cep TEXT,
        is_padrao INTEGER NOT NULL DEFAULT 0,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Erro ao criar tabela enderecos:', err);
      else console.log('✓ Tabela enderecos OK');
    });

    // Colunas extras nos pedidos (v3)
    addColumnIfMissing("ALTER TABLE pedidos ADD COLUMN slot_id INTEGER");
    addColumnIfMissing("ALTER TABLE pedidos ADD COLUMN endereco_id INTEGER");
    addColumnIfMissing("ALTER TABLE pedidos ADD COLUMN tipo_local TEXT DEFAULT 'endereco_usuario'");

    ensureDefaultAdmin();
  });

    console.log('✓ Banco de dados inicializado!');
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
    throw error;
  }
}

export { db };
export default db;
