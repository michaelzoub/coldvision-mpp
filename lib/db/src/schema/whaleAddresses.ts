import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const whaleAddressesTable = pgTable("whale_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  address: text("address").notNull(),
  insiderConfidence: numeric("insider_confidence", { precision: 5, scale: 4 }),
  firstDetectedAt: timestamptz("first_detected_at"),
  lastUpdatedAt: timestamptz("last_updated_at"),
  totalVolume: numeric("total_volume", { precision: 20, scale: 2 }),
  tradeCount: integer("trade_count"),
  avgTradeSize: numeric("avg_trade_size", { precision: 20, scale: 2 }),
  winRate: numeric("win_rate", { precision: 5, scale: 4 }),
  lastTradeAmount: numeric("last_trade_amount", { precision: 20, scale: 2 }),
  lastTradeTimestamp: timestamptz("last_trade_timestamp"),
  notes: text("notes"),
  createdAt: timestamptz("created_at").defaultNow().notNull(),
  botConfidence: numeric("bot_confidence", { precision: 5, scale: 4 }),
  flagged: boolean("flagged").default(false),
  detectedFrom: text("detected_from"),
  firstTradeTimestamp: text("first_trade_timestamp"),
  firstTradeHash: text("first_trade_hash"),
  profileImage: text("profile_image"),
  previousTradeTimestamp: text("previous_trade_timestamp"),
  detectedFromImage: text("detected_from_image"),
  initialTradeTimestamp: text("initial_trade_timestamp"),
  detectedFromSlug: text("detected_from_slug"),
});

export const selectWhaleAddressSchema = createSelectSchema(whaleAddressesTable);
export type WhaleAddress = typeof whaleAddressesTable.$inferSelect;
