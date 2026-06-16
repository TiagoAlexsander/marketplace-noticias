import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { runQuery, getQuery, allQuery } from '../db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * POST /usuarios
 * Criar um novo usuário (cadastro)
 */
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, confirmarSenha } = req.body;

    // Validação
    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: 'Nome, email e senha são obrigatórios',
      });
    }

    if (senha !== confirmarSenha) {
      return res.status(400).json({
        erro: 'As senhas não coincidem',
      });
    }

    // Verificar se email já existe
    const usuarioExistente = await getQuery(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (usuarioExistente) {
      return res.status(409).json({
        erro: 'Este email já está cadastrado',
      });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir novo usuário
    const adminCount = await getQuery('SELECT COUNT(*) AS total FROM usuarios WHERE role = ?', ['admin']);
    const role = (adminCount?.total || 0) === 0 ? 'admin' : 'usuario';

    const result = await runQuery(
      'INSERT INTO usuarios (nome, email, senha, role, prestador_status) VALUES (?, ?, ?, ?, ?)',
      [nome, email, senhaHash, role, 'nenhum']
    );

    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário cadastrado com sucesso',
      dados: {
        id: result.lastID,
        nome,
        email,
        role,
        prestador_status: 'nenhum',
      },
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      erro: 'Erro ao cadastrar usuário',
    });
  }
});

/**
 * GET /usuarios
 * Listar todos os usuários (sem dados sensíveis)
 */
router.get('/', async (req, res) => {
  try {
    const usuarios = await allQuery(
      'SELECT id, nome, email, role, prestador_status FROM usuarios'
    );

    res.json({
      sucesso: true,
      total: usuarios.length,
      dados: usuarios,
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      erro: 'Erro ao listar usuários',
    });
  }
});

/**
 * GET /usuarios/:id
 * Obter um usuário específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await getQuery(
      'SELECT id, nome, email, role, prestador_status FROM usuarios WHERE id = ?',
      [parseInt(id)]
    );

    if (!usuario) {
      return res.status(404).json({
        erro: 'Usuário não encontrado',
      });
    }

    res.json({
      sucesso: true,
      dados: usuario,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      erro: 'Erro ao buscar usuário',
    });
  }
});

/**
 * PUT /usuarios/:id
 * Atualizar um usuário
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;

    if (!nome && !email) {
      return res.status(400).json({
        erro: 'Informe pelo menos um campo para atualizar',
      });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (nome) {
      updates.push('nome = ?');
      values.push(nome);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    values.push(parseInt(id));

    await runQuery(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const usuarioAtualizado = await getQuery(
      'SELECT id, nome, email, role, prestador_status FROM usuarios WHERE id = ?',
      [parseInt(id)]
    );

    res.json({
      sucesso: true,
      mensagem: 'Usuário atualizado com sucesso',
      dados: usuarioAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      erro: 'Erro ao atualizar usuário',
    });
  }
});

/**
 * DELETE /usuarios/:id
 * Deletar um usuário
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await runQuery(
      'DELETE FROM usuarios WHERE id = ?',
      [parseInt(id)]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        erro: 'Usuário não encontrado',
      });
    }

    res.json({
      sucesso: true,
      mensagem: 'Usuário deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      erro: 'Erro ao deletar usuário',
    });
  }
});

router.get('/me/perfil', requireAuth, async (req: AuthenticatedRequest, res) => {
  return res.json({
    sucesso: true,
    dados: req.user,
  });
});

router.put('/:id/role', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: 'admin' | 'prestador' | 'usuario' };

    if (!role || !['admin', 'prestador', 'usuario'].includes(role)) {
      return res.status(400).json({ erro: 'Role inválida. Use admin, prestador ou usuario' });
    }

    const result = await runQuery('UPDATE usuarios SET role = ? WHERE id = ?', [role, parseInt(id)]);
    if (result.changes === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const usuarioAtualizado = await getQuery(
      'SELECT id, nome, email, role, prestador_status FROM usuarios WHERE id = ?',
      [parseInt(id)]
    );

    return res.json({
      sucesso: true,
      mensagem: 'Role atualizada com sucesso',
      dados: usuarioAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar role' });
  }
});

export default router;
