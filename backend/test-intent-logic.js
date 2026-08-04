import { conversationService } from './src/services/conversationService.js';

const tests = [
  "What happened in the market today?",
  "Tesla updates",
  "Apple news",
  "Microsoft earnings",
  "Latest stock market news",
  "Finance news",
  "Business news",
  "Market summary",
  "NVIDIA earnings",
  "Hello how are you?", // Should be false
  "What is the weather today?", // Should be false
  "I want to learn about general history", // Should be false
];

console.log('Testing Finance Intent Routing:');
let passed = true;

for (const text of tests) {
  const isFinance = conversationService.isFinanceIntent(text);
  const symbol = conversationService.extractSymbol(text);
  console.log(`"${text}" -> isFinance: ${isFinance}, symbol: ${symbol}`);
}
