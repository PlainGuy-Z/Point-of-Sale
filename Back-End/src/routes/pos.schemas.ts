import { z } from 'zod';

/**
 * Frontend POS contract uses `cart` lines:
 * - Real product: `productId` is UUID
 * - Manual/custom item: `productId` starts with "manual-"
 *   - `price` is required (integer)
 *   - `note` will be used as item name (fallback to "Custom Item")
 */
export const CartLineSchema = z
  .object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
    note: z.string().trim().min(1).optional(),
    modifiers: z.array(z.string().trim().min(1)).optional(),
    price: z.coerce.number().int().nonnegative().optional()
  })
  .superRefine((line, ctx) => {
    const isManual = line.productId.startsWith('manual-');
    if (isManual && line.price === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Manual item requires price', path: ['price'] });
    }
    if (!isManual && line.price !== undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Real product must not include price', path: ['price'] });
    }
  });

export const QuoteRequestSchema = z
  .object({
    cart: z.array(CartLineSchema).min(1),
    customerId: z.string().trim().min(1).optional(),
    customerName: z.string().trim().min(1).optional(),
    orderType: z.enum(['dine-in', 'take-away']),
    tableNumber: z.string().trim().min(1).optional(),
    orderNote: z.string().trim().min(1).optional()
  })
  .superRefine((body, ctx) => {
    if (body.orderType === 'dine-in' && !body.tableNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'tableNumber is required for dine-in',
        path: ['tableNumber']
      });
    }
  });

export const CreateTransactionRequestSchema = QuoteRequestSchema.extend({
  paymentMethod: z.enum(['cash', 'card', 'qris']),
  cashReceived: z.coerce.number().int().nonnegative().optional()
});

