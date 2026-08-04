import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';

async function test() {
  console.log('GEMINI_API_KEY (first 8 chars):', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) : 'UNDEFINED');
  console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: 'Say hello.',
    });
    console.log('Success! Response:', response.text);
  } catch (error) {
    console.error('Error:', error);
    if (error.status) console.error('Status:', error.status);
    if (error.response && error.response.headers) {
      console.error('Headers:', error.response.headers);
    }
  }
}

test();
