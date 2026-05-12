import { z } from 'zod';
const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    CORS_ORIGINS: z.string().default(''),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
    JWT_EXPIRES_IN: z.string().default('24h'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).default(12),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email().default('noreply@app'),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    // ✅ Optional — tidak crash jika belum ada
    GEMINI_API_KEY: z.string().min(1).optional(),
    GEMINI_MODEL_NAME: z.string().min(1).default('gemini-2.5-flash'),
});
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
export const env = {
    ...parsed.data,
    corsOrigins: parsed.data.CORS_ORIGINS.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
};
