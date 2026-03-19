import { z } from "zod";

export const WHALE_ADDRESSES_TABLE = "whale_addresses";

export const selectWhaleAddressSchema = z.object({
  id: z.string().uuid(),
  address: z.string(),
  insider_confidence: z.string().nullable(),
  first_detected_at: z.string().nullable(),
  last_updated_at: z.string().nullable(),
  total_volume: z.string().nullable(),
  trade_count: z.number().nullable(),
  avg_trade_size: z.string().nullable(),
  win_rate: z.string().nullable(),
  last_trade_amount: z.string().nullable(),
  last_trade_timestamp: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  bot_confidence: z.string().nullable(),
  flagged: z.boolean().nullable(),
  detected_from: z.string().nullable(),
  first_trade_timestamp: z.string().nullable(),
  first_trade_hash: z.string().nullable(),
  profile_image: z.string().nullable(),
  previous_trade_timestamp: z.string().nullable(),
  detected_from_image: z.string().nullable(),
  initial_trade_timestamp: z.string().nullable(),
  detected_from_slug: z.string().nullable(),
});

export type WhaleAddress = z.infer<typeof selectWhaleAddressSchema>;
