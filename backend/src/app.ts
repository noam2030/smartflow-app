import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import { initializeDatabase } from './db/database.js';
import { errorHandler } from './errors/error-handler.js';
import { AiAnalysisService, type IAiAnalysisService } from './services/ai-analysis.service.js';
import { IssuesService, type IIssuesService } from './services/issues.service.js';
import { IssuesController } from './controllers/issues.controller.js';
import { issuesRoutes } from './routes/issues.routes.js';
import type { DatabaseSync } from 'node:sqlite';

export interface AppOptions {
  logger?: FastifyServerOptions['logger'];
  dbPath?: string;
  aiAnalysisService?: IAiAnalysisService;
  issuesService?: IIssuesService;
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance & { db?: DatabaseSync }> {
  const app = Fastify({
    logger: options.logger ?? false,
  });

  // Enable CORS
  await app.register(cors, {
    origin: true,
  });

  // Centralized Error Handler
  app.setErrorHandler(errorHandler);

  // Initialize DB and Services
  const db = initializeDatabase(options.dbPath);
  const aiService = options.aiAnalysisService || new AiAnalysisService();
  const issuesService = options.issuesService || new IssuesService(db, aiService);
  const controller = new IssuesController(issuesService);

  // Register Routes
  await app.register(issuesRoutes, { controller });

  // Attach db reference for testing/cleanup
  (app as any).db = db;

  return app;
}
