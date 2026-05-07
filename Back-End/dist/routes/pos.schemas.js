import { z } from 'zod';
export const QuoteItemSchema = z.object({
    productId: z.string().uuid().optional(),
    quantity: z.coerce.number().int().positive(),
    // For manual/custom item quoting (optional for quote, required for checkout when custom)
    name: z.string().min(1).optional(),
    price: z.coerce.number().int().nonnegative().optional(),
    isCustom: z.boolean().optional()
});
export const QuoteRequestSchema = z.object({
    items: z.array(QuoteItemSchema).min(1)
});
export const CreateTransactionRequestSchema = z.object({
    customerName: z.string().trim().min(1).optional(),
    tableNumber: z.string().trim().min(1).optional(),
    paymentMethod: z.enum(['cash', 'card', 'qris', 'transfer', 'other']),
    items: z
        .array(z
        .object({
        productId: z.string().uuid().optional(),
        name: z.string().min(1),
        price: z.coerce.number().int().nonnegative(),
        quantity: z.coerce.number().int().positive(),
        isCustom: z.boolean().default(false)
    })
        .superRefine((item, ctx) => {
        if (item.isCustom) {
            if (item.productId !== undefined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Custom item must not include productId',
                    path: ['productId']
                });
            }
        }
        else {
            if (!item.productId) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Non-custom item must include productId',
                    path: ['productId']
                });
            }
        }
    }))
        .min(1)
});
