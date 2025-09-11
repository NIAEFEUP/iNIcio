import { relations } from "drizzle-orm/relations";
import {
  application,
  appreciation,
  recruiter,
  user,
  session,
  applicationComment,
  dynamic,
  dynamicComment,
  candidate,
  recruiterToDynamic,
  interview,
  interviewComment,
  candidateToDynamic,
  applicationToTag,
  tag,
  recruiterToInterview,
  recruitment,
  recruitmentPhase,
  account,
  recruiterToCandidate,
  usersToRecruitments,
  recruitmentPhaseStatus,
} from "./schema";

export const appreciationRelations = relations(appreciation, ({ one }) => ({
  application: one(application, {
    fields: [appreciation.applicationId],
    references: [application.id],
  }),
  recruiter: one(recruiter, {
    fields: [appreciation.recruiterId],
    references: [recruiter.userId],
  }),
}));

export const applicationRelations = relations(application, ({ one, many }) => ({
  appreciations: many(appreciation),
  applicationComments: many(applicationComment),
  candidate: one(candidate, {
    fields: [application.candidateId],
    references: [candidate.userId],
  }),
  applicationToTags: many(applicationToTag),
}));

export const recruiterRelations = relations(recruiter, ({ one, many }) => ({
  appreciations: many(appreciation),
  applicationComments: many(applicationComment),
  dynamicComments: many(dynamicComment),
  recruiterToDynamics: many(recruiterToDynamic),
  interviewComments: many(interviewComment),
  user: one(user, {
    fields: [recruiter.userId],
    references: [user.id],
  }),
  recruiterToInterviews: many(recruiterToInterview),
  recruiterToCandidates: many(recruiterToCandidate),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  recruiters: many(recruiter),
  candidates: many(candidate),
  accounts: many(account),
  usersToRecruitments: many(usersToRecruitments),
  recruitmentPhaseStatuses: many(recruitmentPhaseStatus),
}));

export const applicationCommentRelations = relations(
  applicationComment,
  ({ one }) => ({
    application: one(application, {
      fields: [applicationComment.applicationId],
      references: [application.id],
    }),
    recruiter: one(recruiter, {
      fields: [applicationComment.authorId],
      references: [recruiter.userId],
    }),
  }),
);

export const dynamicCommentRelations = relations(dynamicComment, ({ one }) => ({
  dynamic: one(dynamic, {
    fields: [dynamicComment.dynamicId],
    references: [dynamic.id],
  }),
  recruiter: one(recruiter, {
    fields: [dynamicComment.authorId],
    references: [recruiter.userId],
  }),
}));

export const dynamicRelations = relations(dynamic, ({ many }) => ({
  dynamicComments: many(dynamicComment),
  recruiterToDynamics: many(recruiterToDynamic),
  candidateToDynamics: many(candidateToDynamic),
}));

export const candidateRelations = relations(candidate, ({ one, many }) => ({
  applications: many(application),
  candidateToDynamics: many(candidateToDynamic),
  interviews: many(interview),
  user: one(user, {
    fields: [candidate.userId],
    references: [user.id],
  }),
  recruiterToCandidates: many(recruiterToCandidate),
}));

export const recruiterToDynamicRelations = relations(
  recruiterToDynamic,
  ({ one }) => ({
    recruiter: one(recruiter, {
      fields: [recruiterToDynamic.recruiterId],
      references: [recruiter.userId],
    }),
    dynamic: one(dynamic, {
      fields: [recruiterToDynamic.dynamicId],
      references: [dynamic.id],
    }),
  }),
);

export const interviewCommentRelations = relations(
  interviewComment,
  ({ one }) => ({
    interview: one(interview, {
      fields: [interviewComment.interviewId],
      references: [interview.id],
    }),
    recruiter: one(recruiter, {
      fields: [interviewComment.authorId],
      references: [recruiter.userId],
    }),
  }),
);

export const interviewRelations = relations(interview, ({ one, many }) => ({
  interviewComments: many(interviewComment),
  candidate: one(candidate, {
    fields: [interview.candidateId],
    references: [candidate.userId],
  }),
  recruiterToInterviews: many(recruiterToInterview),
}));

export const candidateToDynamicRelations = relations(
  candidateToDynamic,
  ({ one }) => ({
    candidate: one(candidate, {
      fields: [candidateToDynamic.candidateId],
      references: [candidate.userId],
    }),
    dynamic: one(dynamic, {
      fields: [candidateToDynamic.dynamicId],
      references: [dynamic.id],
    }),
  }),
);

export const applicationToTagRelations = relations(
  applicationToTag,
  ({ one }) => ({
    application: one(application, {
      fields: [applicationToTag.applicationId],
      references: [application.id],
    }),
    tag: one(tag, {
      fields: [applicationToTag.tagId],
      references: [tag.id],
    }),
  }),
);

export const tagRelations = relations(tag, ({ many }) => ({
  applicationToTags: many(applicationToTag),
}));

export const recruiterToInterviewRelations = relations(
  recruiterToInterview,
  ({ one }) => ({
    recruiter: one(recruiter, {
      fields: [recruiterToInterview.recruiterId],
      references: [recruiter.userId],
    }),
    interview: one(interview, {
      fields: [recruiterToInterview.interviewId],
      references: [interview.id],
    }),
  }),
);

export const recruitmentPhaseRelations = relations(
  recruitmentPhase,
  ({ one, many }) => ({
    recruitment: one(recruitment, {
      fields: [recruitmentPhase.recruitmentYear],
      references: [recruitment.year],
    }),
    recruitmentPhaseStatuses: many(recruitmentPhaseStatus),
  }),
);

export const recruitmentRelations = relations(recruitment, ({ many }) => ({
  recruitmentPhases: many(recruitmentPhase),
  usersToRecruitments: many(usersToRecruitments),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const recruiterToCandidateRelations = relations(
  recruiterToCandidate,
  ({ one }) => ({
    recruiter: one(recruiter, {
      fields: [recruiterToCandidate.recruiterId],
      references: [recruiter.userId],
    }),
    candidate: one(candidate, {
      fields: [recruiterToCandidate.candidateId],
      references: [candidate.userId],
    }),
  }),
);

export const usersToRecruitmentsRelations = relations(
  usersToRecruitments,
  ({ one }) => ({
    user: one(user, {
      fields: [usersToRecruitments.userId],
      references: [user.id],
    }),
    recruitment: one(recruitment, {
      fields: [usersToRecruitments.recruitmentYear],
      references: [recruitment.year],
    }),
  }),
);

export const recruitmentPhaseStatusRelations = relations(
  recruitmentPhaseStatus,
  ({ one }) => ({
    user: one(user, {
      fields: [recruitmentPhaseStatus.userId],
      references: [user.id],
    }),
    recruitmentPhase: one(recruitmentPhase, {
      fields: [recruitmentPhaseStatus.phaseId],
      references: [recruitmentPhase.id],
    }),
  }),
);
