import 'dotenv/config'; // Loads environment variables without require()
import express from 'express';
import { connectDatabase } from './config/database.js'; // Points to your existing database.js
import { AtlasBot } from './bot/index.js';

const app = express();
app.use(express.json());

async function bootstrap() {
  try {
    // 1. Connect MongoDB via Mongoose
    await connectDatabase();
    console.log('Database connected successfully.');

    // 2. Initialize Module 4 Telegram Bot
    const atlasBot = new AtlasBot();
    await atlasBot.start(app);

    // 3. Start Express Server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

  } catch (error) {
    console.error('Fatal error during application startup:', error);
    process.exit(1);
  }
}

bootstrap();