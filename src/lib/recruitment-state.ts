import type { Recruitment, RecruitmentPhase } from "./db";

/** A phase is `upcoming` before `start`, `closed` after `end`, else `open`. */
export type PhaseState = "upcoming" | "open" | "closed";

/** State of the application phase, or `none` when it is not defined. */
export type ApplicationStatus = PhaseState | "none";

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
  /** Whether that phase is open, upcoming, closed or not defined. */
  applicationStatus: ApplicationStatus;
  canApply: boolean;
}

/** Canonical `clientIdentifier` of each known phase kind. */
export const RECRUITMENT_PHASE_IDENTIFIERS = {
  application: "candidatura",
  interview: "entrevista",
  dynamic: "dinâmica",
  review: "avaliacao",
  voting: "votacao",
  result: "resultado",
} as const;

export type RecruitmentPhaseKind = keyof typeof RECRUITMENT_PHASE_IDENTIFIERS;

/** `clientIdentifier` of the phase that gates applications. */
export const APPLICATION_PHASE_IDENTIFIER =
  RECRUITMENT_PHASE_IDENTIFIERS.application;

/** Phases have free-text identifiers; matching normalizes trim and case. */
export function normalizePhaseIdentifier(
  value: string | null | undefined,
): string {
  return (value ?? "").trim().toLowerCase();
}

/** Maps a phase to its known kind, or `null` when the identifier is unknown. */
export function getRecruitmentPhaseKind(
  phase: Pick<RecruitmentPhase, "clientIdentifier">,
): RecruitmentPhaseKind | null {
  const normalized = normalizePhaseIdentifier(phase.clientIdentifier);

  return (
    (Object.entries(RECRUITMENT_PHASE_IDENTIFIERS).find(
      ([, identifier]) => identifier === normalized,
    )?.[0] as RecruitmentPhaseKind) ?? null
  );
}

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
 * `recruitment.active` is `true` (the admin kill switch), so the effective-open
 * rule is `active && start <= now <= end`.
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
      applicationStatus: "none",
      canApply: false,
    };
  }

  let status: RecruitmentStatus;
  if (now < recruitment.start) {
    status = "upcoming";
  } else if (now > recruitment.end) {
    status = "closed";
  } else {
    status = recruitment.active ? "open" : "closed";
  }

  const normalizedApplicationIdentifier = normalizePhaseIdentifier(
    applicationIdentifier,
  );
  const applicationPhase =
    phases.find(
      (phase) =>
        normalizePhaseIdentifier(phase.clientIdentifier) ===
        normalizedApplicationIdentifier,
    ) ?? null;

  const upcoming = phases.filter(
    (phase) => getPhaseState(phase, now) === "upcoming",
  );

  const applicationStatus: ApplicationStatus = applicationPhase
    ? getPhaseState(applicationPhase, now)
    : "none";

  return {
    status,
    recruitment,
    phases,
    currentPhase: getCurrentPhase(phases, now),
    nextPhase: upcoming.length > 0 ? minBy(upcoming, byStart) : null,
    applicationPhase,
    applicationStatus,
    canApply: status === "open" && applicationStatus === "open",
  };
}
