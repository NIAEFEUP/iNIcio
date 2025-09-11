import {
  pgTable,
  foreignKey,
  check,
  serial,
  integer,
  text,
  unique,
  boolean,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const appreciation = pgTable(
  "appreciation",
  {
    id: serial().primaryKey().notNull(),
    grade: integer().notNull(),
    applicationId: integer("application_id").notNull(),
    recruiterId: text("recruiter_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [application.id],
      name: "appreciation_application_id_application_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.recruiterId],
      foreignColumns: [recruiter.userId],
      name: "appreciation_recruiter_id_recruiter_user_id_fk",
    }).onDelete("cascade"),
    check("grade_range", sql`(grade >= 0) AND (grade <= 3)`),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    role: text().notNull(),
  },
  (table) => [unique("user_email_unique").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("session_token_unique").on(table.token),
  ],
);

export const applicationComment = pgTable(
  "application_comment",
  {
    id: serial().primaryKey().notNull(),
    content: text().notNull(),
    applicationId: integer("application_id").notNull(),
    authorId: text("author_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [application.id],
      name: "application_comment_application_id_application_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [recruiter.userId],
      name: "application_comment_author_id_recruiter_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const dynamicComment = pgTable(
  "dynamic_comment",
  {
    id: serial().primaryKey().notNull(),
    content: text().notNull(),
    dynamicId: integer("dynamic_id").notNull(),
    authorId: text("author_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.dynamicId],
      foreignColumns: [dynamic.id],
      name: "dynamic_comment_dynamic_id_dynamic_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [recruiter.userId],
      name: "dynamic_comment_author_id_recruiter_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const application = pgTable(
  "application",
  {
    id: serial().primaryKey().notNull(),
    submittedAt: timestamp("submitted_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    studentNumber: integer("student_number").notNull(),
    linkedin: text(),
    github: text(),
    personalWebsite: text("personal_website"),
    accepted: boolean().default(false).notNull(),
    candidateId: text("candidate_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.candidateId],
      foreignColumns: [candidate.userId],
      name: "application_candidate_id_candidate_user_id_fk",
    }).onDelete("cascade"),
    unique("application_candidate_id_unique").on(table.candidateId),
  ],
);

export const recruiterToDynamic = pgTable(
  "recruiter_to_dynamic",
  {
    recruiterId: text("recruiter_id").notNull(),
    dynamicId: integer("dynamic_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.recruiterId],
      foreignColumns: [recruiter.userId],
      name: "recruiter_to_dynamic_recruiter_id_recruiter_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dynamicId],
      foreignColumns: [dynamic.id],
      name: "recruiter_to_dynamic_dynamic_id_dynamic_id_fk",
    }).onDelete("cascade"),
  ],
);

export const interviewComment = pgTable(
  "interview_comment",
  {
    id: serial().primaryKey().notNull(),
    content: text().notNull(),
    interviewId: integer("interview_id").notNull(),
    authorId: text("author_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.interviewId],
      foreignColumns: [interview.id],
      name: "interview_comment_interview_id_interview_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [recruiter.userId],
      name: "interview_comment_author_id_recruiter_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const dynamic = pgTable("dynamic", {
  id: serial().primaryKey().notNull(),
  datetime: timestamp({ mode: "string" }).defaultNow().notNull(),
  content: text().notNull(),
});

export const candidateToDynamic = pgTable(
  "candidate_to_dynamic",
  {
    candidateId: text("candidate_id").notNull(),
    dynamicId: integer("dynamic_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.candidateId],
      foreignColumns: [candidate.userId],
      name: "candidate_to_dynamic_candidate_id_candidate_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dynamicId],
      foreignColumns: [dynamic.id],
      name: "candidate_to_dynamic_dynamic_id_dynamic_id_fk",
    }).onDelete("cascade"),
  ],
);

export const interview = pgTable(
  "interview",
  {
    id: serial().primaryKey().notNull(),
    datetime: timestamp({ mode: "string" }).defaultNow().notNull(),
    content: text().notNull(),
    candidateId: text("candidate_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.candidateId],
      foreignColumns: [candidate.userId],
      name: "interview_candidate_id_candidate_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const recruitment = pgTable("recruitment", {
  year: integer().primaryKey().notNull(),
});

export const applicationToTag = pgTable(
  "application_to_tag",
  {
    applicationId: integer("application_id").notNull(),
    tagId: integer("tag_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [application.id],
      name: "application_to_tag_application_id_application_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [tag.id],
      name: "application_to_tag_tag_id_tag_id_fk",
    }).onDelete("cascade"),
  ],
);

export const recruiter = pgTable(
  "recruiter",
  {
    userId: text("user_id").primaryKey().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "recruiter_user_id_user_id_fk",
    }),
  ],
);

export const recruiterToInterview = pgTable(
  "recruiter_to_interview",
  {
    recruiterId: text("recruiter_id").notNull(),
    interviewId: integer("interview_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.recruiterId],
      foreignColumns: [recruiter.userId],
      name: "recruiter_to_interview_recruiter_id_recruiter_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.interviewId],
      foreignColumns: [interview.id],
      name: "recruiter_to_interview_interview_id_interview_id_fk",
    }).onDelete("cascade"),
  ],
);

export const candidate = pgTable(
  "candidate",
  {
    userId: text("user_id").primaryKey().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "candidate_user_id_user_id_fk",
    }),
  ],
);

export const recruitmentPhase = pgTable(
  "recruitment_phase",
  {
    id: serial().primaryKey().notNull(),
    recruitmentYear: integer("recruitment_year").notNull(),
    role: text().notNull(),
    start: timestamp({ mode: "string" }).notNull(),
    end: timestamp({ mode: "string" }).notNull(),
    title: text().notNull(),
    description: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.recruitmentYear],
      foreignColumns: [recruitment.year],
      name: "recruitment_phase_recruitment_year_recruitment_year_fk",
    }),
    check("start_before_end", sql`start < "end"`),
  ],
);

export const tag = pgTable(
  "tag",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
  },
  (table) => [unique("tag_name_unique").on(table.name)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "string",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "string",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const recruiterToCandidate = pgTable(
  "recruiter_to_candidate",
  {
    recruiterId: text("recruiter_id").notNull(),
    candidateId: text("candidate_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.recruiterId],
      foreignColumns: [recruiter.userId],
      name: "recruiter_to_candidate_recruiter_id_recruiter_user_id_fk",
    }),
    foreignKey({
      columns: [table.candidateId],
      foreignColumns: [candidate.userId],
      name: "recruiter_to_candidate_candidate_id_candidate_user_id_fk",
    }),
  ],
);

export const usersToRecruitments = pgTable(
  "users_to_recruitments",
  {
    userId: text("user_id").notNull(),
    recruitmentYear: integer("recruitment_year").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "users_to_recruitments_user_id_user_id_fk",
    }),
    foreignKey({
      columns: [table.recruitmentYear],
      foreignColumns: [recruitment.year],
      name: "users_to_recruitments_recruitment_year_recruitment_year_fk",
    }),
    primaryKey({
      columns: [table.userId, table.recruitmentYear],
      name: "users_to_recruitments_user_id_recruitment_year_pk",
    }),
  ],
);

export const recruitmentPhaseStatus = pgTable(
  "recruitment_phase_status",
  {
    userId: text("user_id").notNull(),
    phaseId: integer("phase_id").notNull(),
    status: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "recruitment_phase_status_user_id_user_id_fk",
    }),
    foreignKey({
      columns: [table.phaseId],
      foreignColumns: [recruitmentPhase.id],
      name: "recruitment_phase_status_phase_id_recruitment_phase_id_fk",
    }),
    primaryKey({
      columns: [table.userId, table.phaseId],
      name: "recruitment_phase_status_user_id_phase_id_pk",
    }),
  ],
);
