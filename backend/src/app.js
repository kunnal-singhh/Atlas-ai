import express from 'express';
import healthRoutes from './routes/healthRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('src/public'));

// Routes
app.use('/health', healthRoutes);

// Catch-all route for undefined endpoints
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`,
    error: 'Not Found'
  });
});

// Central Error Handler
app.use(errorMiddleware);

export default app;