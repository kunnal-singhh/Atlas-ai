import mongoose from 'mongoose';
import { conversationService } from './src/services/conversationService.js';
import { config } from './src/config/env.js';

async function runTest() {
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB');

  const telegramId = 123456789;
  const prompt = "What happened in the market today?";

  console.log(`Testing prompt: "${prompt}"`);
  const isFinance = conversationService.isFinanceIntent(prompt);
  console.log('isFinanceIntent:', isFinance);

  if (isFinance) {
    const symbol = conversationService.extractSymbol(prompt);
    console.log('Extracted symbol:', symbol);
  }

  const responseChunks = await conversationService.processUserMessage(telegramId, prompt);
  console.log('Response:', responseChunks);
  
  process.exit(0);
}

runTest().catch(console.error);
