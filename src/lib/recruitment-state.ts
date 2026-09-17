import type { Recruitment, RecruitmentPhase } from "./db";

/** A phase is `upcoming` before `start`, `closed` after `end`, else `open`. */
export type PhaseState = "upcoming" | "open" | "closed";

/** Effective state of a recruitment. */
export type RecruitmentStatus =
  "no-recruitment" | "upcoming" | "open" | "closed";

/** Everything the UI needs to know about a recruitment and its phases. */
export interface RecruitmentState {
  status: RecruitmentStatus;
  recruitment: Recruitment | null;
  phases: RecruitmentPhase[];
  /** Open phase, otherwise the next upcoming, otherwise the last closed one. */
  currentPhase: RecruitmentPhase | null;
  /** Earliest upcoming phase, if any. */
  nextPhase: RecruitmentPhase | null;
  /** Phase that gates applications (matched by `clientIdentifier`). */
  applicationPhase: RecruitmentPhase | null;
  canApply: boolean;
}

/** `clientIdentifier` of the phase that gates applications. */
export const APPLICATION_PHASE_IDENTIFIER = "candidatura";

function minBy<T>(phases: T[], key: (item: T) => number): T {
  return phases.reduce((best, item) => (key(item) < key(best) ? item : best));
}

function maxBy<T>(phases: T[], key: (item: T) => number): T {
  return phases.reduce((best, item) => (key(item) > key(best) ? item : best));
}

/** Missing start sorts as "started the earliest". */
const byStart = (phase: RecruitmentPhase) =>
  phase.start?.getTime() ?? Number.NEGATIVE_INFINITY;

/** Missing end sorts as "never ends". */
const byEnd = (phase: RecruitmentPhase) =>
  phase.end?.getTime() ?? Number.POSITIVE_INFINITY;

/**
 * A missing `start` or `end` means "no bound on that side", so a phase without
 * dates is always open.
 */
export function getPhaseState(
  phase: Pick<RecruitmentPhase, "start" | "end">,
  now: Date = new Date(),
): PhaseState {
  if (phase.start && now < phase.start) return "upcoming";
  if (phase.end && now > phase.end) return "closed";
  return "open";
}

/**
 * The open phase (latest start when several overlap), otherwise the next
 * upcoming phase, otherwise the most recently closed one. `null` when there are
 * no phases.
 */
export function getCurrentPhase(
  phases: RecruitmentPhase[],
  now: Date = new Date(),
): RecruitmentPhase | null {
  if (phases.length === 0) return null;

  const open = phases.filter((phase) => getPhaseState(phase, now) === "open");
  if (open.length > 0) return maxBy(open, byStart);

  const upcoming = phases.filter(
    (phase) => getPhaseState(phase, now) === "upcoming",
  );
  if (upcoming.length > 0) return minBy(upcoming, byStart);

  return maxBy(phases, byEnd);
}

/**
 * Derives the full state of a recruitment. `status` is date based, except that
 * being inside the recruitment window only yields `open` when
 * `recruitment.active` is `"true"` (the admin kill switch).
 */
export function getRecruitmentState(
  recruitment: Recruitment | null,
  phases: RecruitmentPhase[],
  now: Date = new Date(),
  applicationIdentifier: string = APPLICATION_PHASE_IDENTIFIER,
): RecruitmentState {
  if (!recruitment) {
    return {
      status: "no-recruitment",
      recruitment: null,
      phases: [],
      currentPhase: null,
      nextPhase: null,
      applicationPhase: null,
      canApply: false,
    };
  }

  let status: RecruitmentStatus;
  if (now < recruitment.start) {
    status = "upcoming";
  } else if (now > recruitment.end) {
    status = "closed";
  } else {
    status = recruitment.active === "true" ? "open" : "closed";
  }

  const identifier = applicationIdentifier.trim().toLowerCase();
  const applicationPhase =
    phases.find(
      (phase) => phase.clientIdentifier.trim().toLowerCase() === identifier,
    ) ?? null;

  const upcoming = phases.filter(
    (phase) => getPhaseState(phase, now) === "upcoming",
  );

  return {
    status,
    recruitment,
    phases,
    currentPhase: getCurrentPhase(phases, now),
    nextPhase: upcoming.length > 0 ? minBy(upcoming, byStart) : null,
    applicationPhase,
    canApply:
      status === "open" &&
      applicationPhase !== null &&
      getPhaseState(applicationPhase, now) === "open",
  };
}
