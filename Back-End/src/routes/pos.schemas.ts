import { z } from 'zod';

/**
 * Frontend POS contract uses `cart` lines:
 * - Real product: `productId` is UUID
 * - Manual/custom item: `productId` starts with "manual-"
 *   - `price` is required (integer)
 *   - `note` will be used as item name (fallback to "Custom Item")
 *   - `description` optional per-item custom notes (e.g., "Pedas sekali", "Tanpa bawang")
 */
export const CartLineSchema = z
  .object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
    note: z.string().trim().min(1).optional(),
    modifiers: z.array(z.string().trim().min(1)).optional(),
    description: z.string().trim().max(200).optional(), // ✅ Per-item description
    variantName: z.string().trim().max(100).optional(),
    variantPrice: z.coerce.number().int().nonnegative().optional(),
    price: z.coerce.number().int().nonnegative().optional()
  })
  .superRefine((line, ctx) => {
    const isManual = line.productId.startsWith('manual-');
    if (isManual && line.price === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Manual item requires price', path: ['price'] });
    }
    if (!isManual) {
      if (line.price !== undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Real product must not include price', path: ['price'] });
      }
      // Validate UUID format for real products
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(line.productId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid productId format (must be UUID)', path: ['productId'] });
      }
    }
  });

export const QuoteRequestSchema = z
  .object({
    cart: z.array(CartLineSchema).min(1),
    customerId: z.string().trim().optional(),
    customerName: z.string().trim().optional(),
    orderType: z.enum(['dine-in', 'take-away']),
    tableNumber: z.string().trim().optional(),
    orderNote: z.string().trim().optional(),
    notes: z.string().trim().optional(), // ✅ General order notes
    applyTax: z.boolean().optional()
  });

export const CreateTransactionRequestSchema = QuoteRequestSchema.extend({
  paymentMethod: z.enum(['cash', 'card', 'qris']),
  cashReceived: z.coerce.number().int().nonnegative().optional()
});

