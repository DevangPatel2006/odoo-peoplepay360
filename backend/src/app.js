import express from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { fail } from './common/utils/apiResponse.js';
import env from './config/env.js';

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Mount API routes at /api and /api/v1
app.use('/api', routes);
app.use('/api/v1', routes);

// 404 handler for unknown routes
app.use((req, res) => {
  return fail(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
});

// Centralized error handling middleware (always last)
app.use(errorHandler);

export default app;
