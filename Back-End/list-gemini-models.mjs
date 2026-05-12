import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

const env = dotenv.config();
if (env.error) {
  console.error('dotenv load failed', env.error);
  process.exit(1);
}

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error('GEMINI_API_KEY missing');
  process.exit(1);
}

const client = new GoogleGenerativeAI(key);

try {
  const models = await client.listModels();
  console.log('models count', models.length);
  for (const model of models.slice(0, 50)) {
    console.log(JSON.stringify({ name: model.name, supportedMethods: model.supportedMethods }, null, 2));
  }
} catch (err) {
  console.error('ERR', err);
}
