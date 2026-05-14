import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env explicitly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { OpenAI } from "openai";

const groq = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

async function test() {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 10
    });
    console.log("SUCCESS:", response.choices[0].message.content);
  } catch (err) {
    console.log("FAILURE:", err.message);
  }
}

test();
