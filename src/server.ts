import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

const start = async (): Promise<void> => {
  await connectDatabase();
  app.listen(env.PORT, () => {
    logger.info(`HAMS API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
