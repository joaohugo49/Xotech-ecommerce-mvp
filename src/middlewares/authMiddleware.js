const db = require('../config/database');

async function verificarAdmin(id_usuario) {
  if (!id_usuario) return { erro: 'Identificação do usuário obrigatória.', status: 401 };
  const [rows] = await db.execute('SELECT role FROM usuarios WHERE id = ?', [id_usuario]);
  if (rows.length === 0) return { erro: 'Usuário não encontrado.', status: 401 };
  if (rows[0].role !== 'admin') return { erro: 'Acesso negado. Permissão de administrador necessária.', status: 403 };
  return null;
}

module.exports = { verificarAdmin };
