import type { Application } from "@/lib/db";

export const applicationAnswers = [
  {
    title: "Interesse nas escolhas",
    attribute: "interestJustification",
  },
  {
    title: "Porquê o NI?",
    attribute: "motivation",
  },
  {
    title: "O que poderíamos ganhar contigo?",
    attribute: "selfPromotion",
  },
  {
    title: "Tens alguma sugestão?",
    attribute: "suggestions",
  },
  {
    title: "Com que tecnologias/ferramentas já trabalhaste?",
    attribute: "experience",
  },
];

export const applicationAnswerCount = (
  application: Application | null,
): number =>
  applicationAnswers.filter((a) =>
    application ? Boolean(application[a.attribute]) : false,
  ).length;
