import { config } from './src/config/env.js';
import { GoogleGenAI } from '@google/genai';

async function investigate() {
  console.log('--- DEBUG START ---');

  // Task 1 & 2
  const key = config.geminiApiKey;
  if (!key) {
    console.log('1. GEMINI_API_KEY is missing or undefined.');
  } else {
    console.log('1. GEMINI_API_KEY is loaded correctly.');
    console.log(`2. First 8 characters: ${key.substring(0, 8)}`);
  }

  // Task 3
  console.log('3. dotenv.config() is executed inside src/config/env.js before GeminiService initializes (Verified via grep).');

  // Task 4
  console.log(`4. Gemini model name: ${config.geminiModel}`);

  // Initialize client (Task 10)
  let ai;
  try {
    ai = new GoogleGenAI({ apiKey: key });
    console.log('10. Gemini client initialized successfully (No exception during `new GoogleGenAI`).');
  } catch (err) {
    console.log('10. Failed to initialize Gemini client: ', err.message);
    return;
  }

  console.log('\n--- ATTEMPTING API CALL ---');
  try {
    const response = await ai.models.generateContent({
      model: config.geminiModel || 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    });
    console.log('API Call Succeeded! Response:', response.text);
  } catch (error) {
    console.log('\n--- API ERROR CAUGHT ---');
    
    // Task 5, 6, 7, 8
    console.log('5. Full Gemini SDK Error Message:', error.message);
    
    console.log('6. HTTP Status Code:', error.status || error.statusCode || (error.response && error.response.status) || 'N/A');
    
    let responseBody = 'N/A';
    if (error.response && error.response.data) {
        responseBody = JSON.stringify(error.response.data);
    } else if (error.errorDetails) {
        responseBody = JSON.stringify(error.errorDetails);
    } else if (error.details) {
        responseBody = JSON.stringify(error.details);
    } else if (error.body) {
        responseBody = JSON.stringify(error.body);
    }
    
    console.log('7. Response Body:', responseBody);
    console.log('8. Stack Trace:\n', error.stack);
    
    console.log('\nFULL ERROR OBJECT DUMP:');
    console.dir(error, { depth: null });
  }
}

investigate().catch(console.error);
