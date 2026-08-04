import mongoose from 'mongoose';
import { Article } from './src/models/Article.js';
import { Memory } from './src/models/Memory.js';
import { financeService } from './src/services/financeService.js';
import { config } from './src/config/env.js';

async function runMemoryTest() {
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB');

  const telegramId = 123456789;

  // 1. Inject a personalized memory
  await Memory.findOneAndUpdate(
    { telegramId, fact: "User exclusively focuses on semiconductor and AI hardware stocks like NVDA and AMD." },
    { telegramId, fact: "User exclusively focuses on semiconductor and AI hardware stocks like NVDA and AMD.", category: "FINANCE", importanceScore: 9, isActive: true },
    { upsert: true }
  );
  console.log('Injected test memory.');

  // 2. Inject dummy articles (need at least 3 for a cache hit)
  await Article.deleteMany({ provider: 'test' });
  await Article.create([
    {
      articleId: 'dummy_1', provider: 'test', title: 'Nvidia releases new AI Blackwell chips', summary: 'NVDA is revolutionizing AI infrastructure.', source: 'TechNews', publishedAt: new Date(), company: 'NVDA', symbols: ['NVDA'], category: 'TECH', url: 'http', fingerprint: 'fp1', retrievedAt: new Date()
    },
    {
      articleId: 'dummy_2', provider: 'test', title: 'Real Estate market faces downturn', summary: 'Housing market is crashing.', source: 'RealNews', publishedAt: new Date(), company: null, symbols: [], category: 'MARKETS', url: 'http', fingerprint: 'fp2', retrievedAt: new Date()
    },
    {
      articleId: 'dummy_3', provider: 'test', title: 'AMD announces new processor to rival Intel', summary: 'AMD is stepping up its game.', source: 'TechNews', publishedAt: new Date(), company: 'AMD', symbols: ['AMD'], category: 'TECH', url: 'http', fingerprint: 'fp3', retrievedAt: new Date()
    }
  ]);
  console.log('Injected 3 dummy articles for cache hit.');

  // 3. Test finance briefing (no symbol specified, should use memory)
  const briefing = await financeService.getFinancialBriefing(telegramId, {});
  console.log('Generated Briefing:\n', briefing);
  
  process.exit(0);
}

runMemoryTest().catch(console.error);
