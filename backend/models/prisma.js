/**
 * Instancia unica do Prisma Client.
 * Cada new PrismaClient() abre o seu proprio pool de conexoes, e o
 * limite do Supabase e baixo.
 */
const { PrismaClient } = require('@prisma/client');
const { env } = require('../config/env');

const prisma = new PrismaClient({
  // Em desenvolvimento, registra tambem os avisos do Prisma.
  log: env.ehProducao ? ['warn', 'error'] : ['warn', 'error'],
});

module.exports = prisma;
