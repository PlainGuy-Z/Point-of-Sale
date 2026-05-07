import { z } from 'zod';
const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    CORS_ORIGINS: z.string().default('')
});
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
    // Keep error short but actionable
    // eslint-disable-next-line no-console
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
export const env = {
    ...parsed.data,
    corsOrigins: parsed.data.CORS_ORIGINS.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
};
