import 'dotenv/config';
console.log('GEMINI_MODEL_NAME=', process.env.GEMINI_MODEL_NAME);
console.log('GEMINI_API_KEY=', process.env.GEMINI_API_KEY ? 'set' : 'unset');
