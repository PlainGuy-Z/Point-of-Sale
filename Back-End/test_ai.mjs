import dotenv from 'dotenv';
dotenv.config();
import { generateBusinessInsights } from './dist/services/gemini.js';

const mockData = {
  summary: { revenue: 100000, transaction_count: 50 },
  trendData: [],
  topProducts: [],
  categoryPerformance: [],
  wasteInsights: [],
  stockAlerts: { critical: 0, warning: 0 },
};

async function test() {
  try {
    const aiRes = await generateBusinessInsights(mockData, '2026-05-01', '2026-05-31');
    console.log(aiRes);
  } catch (err) {
    console.error("AI Error:", err);
  }
}
test();
