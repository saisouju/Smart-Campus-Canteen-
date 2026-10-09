import { z } from 'zod';
import { MENU_CATEGORIES, ORDER_STATUSES } from '@canteen/shared';

/** Request-body validators. Inferred types line up with the shared DTOs. */

export const newMenuItemSchema = z.object({
  name: z.string().trim().min(2).max(60),
  category: z.enum(MENU_CATEGORIES),
  price: z.number().positive().max(10_000),
  isAvailable: z.boolean().default(true),
});

export const updateMenuItemSchema = newMenuItemSchema.partial();

export const placeOrderSchema = z.object({
  timeSlotId: z.string().min(1),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, 'Cart is empty')
    .max(30),
});

export const adminEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const topCustomersQuerySchema = z.object({
  limit: z.coerce.number().int().min(5).max(10).default(10),
});

export const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
});

export const verifyOrderQrSchema = z.object({
  qrCode: z.string().trim().min(10),
});

export const hardwareTemperatureSchema = z.object({
  celsius: z.number().finite().min(-40).max(80),
  humidity: z.number().finite().min(0).max(100).optional(),
});
