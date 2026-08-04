import dotenv from 'dotenv';
dotenv.config();
process.env.AI_PROVIDER = 'mock';

import { aiService } from './src/services/aiService.js';

// Simulate systemInstruction with memories (like ContextBuilder produces)
const sysWithMemories = `You are Atlas AI, an executive assistant.

RELEVANT LONG-TERM MEMORIES ABOUT USER:
- [FINANCE] User is interested in NVIDIA (NVDA)
- [INTEREST] User likes hiking
- [WORK] User works at Google
(Use these naturally to tailor responses. Do not reference these memory tags directly.)`;

const sysNoMemories = `You are Atlas AI, an executive assistant.`;

const MEMORY_EXTRACTION_PROMPT = `You are an AI Memory Extraction engine. Analyze the provided user message and extract STABLE, LONG-TERM facts about the user.
STRICT RULES:
1. ONLY extract facts that are durable.
2. If NO long-term fact is found, return exactly: {"facts": []}`;

async function run() {
  console.log('=====================================================');
  console.log('  Atlas AI — Context-Aware Mock AI Provider Tests');
  console.log('=====================================================\n');

  // ── Test 1: Identity ──
  console.log('━━━ Test 1: "Who are you?" ━━━');
  const r1 = await aiService.generateResponse({
    systemInstruction: sysNoMemories,
    contents: [{ role: 'user', parts: [{ text: 'Who are you?' }] }],
  });
  console.log(r1, '\n');

  // ── Test 2: Explanation ──
  console.log('━━━ Test 2: "Explain AI" ━━━');
  const r2 = await aiService.generateResponse({
    systemInstruction: sysNoMemories,
    contents: [{ role: 'user', parts: [{ text: 'Explain AI' }] }],
  });
  console.log(r2, '\n');

  // ── Test 3: Memory save (extraction pipeline) ──
  console.log('━━━ Test 3: Memory Extraction — "I like NVIDIA" ━━━');
  const r3 = await aiService.generateResponse({
    systemInstruction: MEMORY_EXTRACTION_PROMPT,
    contents: [{ role: 'user', parts: [{ text: 'User message: "Remember that I like NVIDIA"' }] }],
  });
  console.log(JSON.parse(r3), '\n');

  // ── Test 4: Memory save — work ──
  console.log('━━━ Test 4: Memory Extraction — "I work at Google" ━━━');
  const r4 = await aiService.generateResponse({
    systemInstruction: MEMORY_EXTRACTION_PROMPT,
    contents: [{ role: 'user', parts: [{ text: 'User message: "I work at Google and I am into machine learning"' }] }],
  });
  console.log(JSON.parse(r4), '\n');

  // ── Test 5: Greeting with memories ──
  console.log('━━━ Test 5: Greeting with existing memories ━━━');
  const r5 = await aiService.generateResponse({
    systemInstruction: sysWithMemories,
    contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
  });
  console.log(r5, '\n');

  // ── Test 6: "What do you remember about me?" ──
  console.log('━━━ Test 6: Memory recall ━━━');
  const r6 = await aiService.generateResponse({
    systemInstruction: sysWithMemories,
    contents: [{ role: 'user', parts: [{ text: 'What do you remember about me?' }] }],
  });
  console.log(r6, '\n');

  // ── Test 7: "What companies do I follow?" ──
  console.log('━━━ Test 7: Companies recall ━━━');
  const r7 = await aiService.generateResponse({
    systemInstruction: sysWithMemories,
    contents: [{ role: 'user', parts: [{ text: 'What companies do I follow?' }] }],
  });
  console.log(r7, '\n');

  // ── Test 8: "Remember that I like Tesla" (explicit save ack) ──
  console.log('━━━ Test 8: Explicit remember acknowledgment ━━━');
  const r8 = await aiService.generateResponse({
    systemInstruction: sysNoMemories,
    contents: [{ role: 'user', parts: [{ text: 'Remember that I like Tesla' }] }],
  });
  console.log(r8, '\n');

  // ── Test 9: Finance intelligence with articles ──
  console.log('━━━ Test 9: Finance intelligence from articles ━━━');
  const finSys = `You are Atlas AI's Financial Intelligence Engine.
User Focus Topic: TSLA

Articles to Analyze:
[
  {"index":1,"title":"Tesla Delivers Record Q3 Vehicles","source":"Reuters","summary":"Tesla delivered 435,000 vehicles in Q3, beating estimates.","symbols":["TSLA"],"company":"Tesla","publishedAt":"2026-08-04"},
  {"index":2,"title":"Tesla FSD v13 Rollout Expands","source":"Bloomberg","summary":"Tesla is expanding its Full Self-Driving software to more markets.","symbols":["TSLA"],"company":"Tesla","publishedAt":"2026-08-03"}
]

Provide your analysis strictly in JSON format matching this schema:
...
`;
  const r9 = await aiService.generateResponse({
    systemInstruction: finSys,
    contents: [{ role: 'user', parts: [{ text: 'Generate the financial intelligence report.' }] }],
    config: { responseMimeType: 'application/json', temperature: 0.2 },
  });
  const parsed9 = JSON.parse(r9);
  console.log('Market Overview:', parsed9.marketOverview);
  console.log('Stories:', parsed9.stories.length);
  console.log('First headline:', parsed9.stories[0]?.headline, '\n');

  // ── Test 10: Conversation summary ──
  console.log('━━━ Test 10: Conversation summary ━━━');
  const r10 = await aiService.generateResponse({
    systemInstruction: 'Summarize the key points of this conversation concisely in 3-4 bullet points for background context:',
    contents: [{ role: 'user', parts: [{ text: 'user: I work at NVIDIA\nmodel: Great, I will remember that.\nuser: What is the stock market doing today?\nmodel: Markets are up.' }] }],
  });
  console.log(r10, '\n');

  // ── Test 11: Empty memory extraction (greeting) ──
  console.log('━━━ Test 11: No facts from greeting ━━━');
  const r11 = await aiService.generateResponse({
    systemInstruction: MEMORY_EXTRACTION_PROMPT,
    contents: [{ role: 'user', parts: [{ text: 'User message: "Hello!"' }] }],
  });
  console.log(JSON.parse(r11), '\n');

  console.log('=====================================================');
  console.log('  ✅ All 11 tests completed');
  console.log('=====================================================');
}

run().catch(console.error);
