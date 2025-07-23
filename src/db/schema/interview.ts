import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { candidate } from "./user_roles";
import { relations } from "drizzle-orm";
import { interviewComment } from "./comment";

export const interview = pgTable("interview", {
	id: serial("id").primaryKey(),
	datetime: timestamp("datetime").notNull().defaultNow(),
	content: text("content").notNull(),
	candidateId: text("candidate_id")
		.notNull()
		.references(() => candidate.userId, { onDelete: "cascade" }),
});

export const recruiterToInterview = pgTable("recruiter_to_interview", {
	recruiterId: text("recruiter_id")
		.notNull()
		.references(() => candidate.userId, { onDelete: "cascade" }),
	interviewId: serial("interview_id")
		.notNull()
		.references(() => interview.id, { onDelete: "cascade" }),
});

export const interviewRelations = relations(interview, ({ one, many }) => ({
	candidate: one(candidate, {
		fields: [interview.candidateId],
		references: [candidate.userId],
	}),
	recruiters: many(recruiterToInterview),
	comments: many(interviewComment),
}));

export const recruiterToInterviewRelations = relations(
	recruiterToInterview,
	({ one }) => ({
		recruiter: one(candidate, {
			fields: [recruiterToInterview.recruiterId],
			references: [candidate.userId],
		}),
		interview: one(interview, {
			fields: [recruiterToInterview.interviewId],
			references: [interview.id],
		}),
	}),
);
