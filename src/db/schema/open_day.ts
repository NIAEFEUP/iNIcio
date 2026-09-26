import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { recruitment } from "./recruitment";

export const openDayAnnouncement = pgTable(
  "open_day_announcement",
  {
    id: serial("id").primaryKey(),
    recruitmentId: integer("recruitment_id")
      .notNull()
      .references(() => recruitment.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    date: timestamp("date"),
    startTime: text("start_time").notNull().default("10:00"),
    endTime: text("end_time").notNull().default("18:00"),
    room: text("room").notNull().default("B315"),
    image: text("image").notNull().default("/images/B315.jpeg"),
  },
  (table) => [
    unique("open_day_announcement_recruitment_unique").on(table.recruitmentId),
  ],
);

export const openDayAnnouncementRelations = relations(
  openDayAnnouncement,
  ({ one }) => ({
    recruitment: one(recruitment, {
      fields: [openDayAnnouncement.recruitmentId],
      references: [recruitment.id],
    }),
  }),
);
