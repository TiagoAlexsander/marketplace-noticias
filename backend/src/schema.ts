import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Tabela de Usuários
export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  email: text('email').unique().notNull(),
  senha: text('senha').notNull(),
  criado_em: text('criado_em').default(new Date().toISOString()),
});

// Tabela de Prestadores de Serviço
export const prestadores = sqliteTable('prestadores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuario_id: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  descricao: text('descricao'),
  criado_em: text('criado_em').default(new Date().toISOString()),
});

// Tabela de Serviços
export const servicos = sqliteTable('servicos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  prestador_id: integer('prestador_id')
    .notNull()
    .references(() => prestadores.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  preco: real('preco').notNull(),
  criado_em: text('criado_em').default(new Date().toISOString()),
});

// Relacionamentos
export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  prestador: one(prestadores, {
    fields: [usuarios.id],
    references: [prestadores.usuario_id],
  }),
  servicos: many(servicos),
}));

export const prestadoresRelations = relations(prestadores, ({ one, many }) => ({
  usuario: one(usuarios, {
    fields: [prestadores.usuario_id],
    references: [usuarios.id],
  }),
  servicos: many(servicos),
}));

export const servicosRelations = relations(servicos, ({ one }) => ({
  prestador: one(prestadores, {
    fields: [servicos.prestador_id],
    references: [prestadores.id],
  }),
}));

export type Usuario = typeof usuarios.$inferSelect;
export type Prestador = typeof prestadores.$inferSelect;
export type Servico = typeof servicos.$inferSelect;

export type UsuarioInsert = typeof usuarios.$inferInsert;
export type PrestadorInsert = typeof prestadores.$inferInsert;
export type ServicoInsert = typeof servicos.$inferInsert;
