"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface VotingLiveState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  currentCandidateId: string | null;
  /** Approve/reject counts for the current candidate. Zero for recruiters. */
  approvedCount: number;
  rejectedCount: number;
  votedCount: number;
  recruitersConnected: number;
  presenceCount: number;
  finishedCandidateIds: string[];
  acceptedCandidates: number;
  rejectedCandidates: number;
  terminated: boolean;
}

export interface VotingLiveInitial {
  currentCandidateId: string | null;
  finishedCandidateIds: string[];
  acceptedCandidates: number;
  rejectedCandidates: number;
  terminated: boolean;
  /** Server-rendered counts for the current candidate (admins only). */
  approvedCount?: number;
  rejectedCount?: number;
  votedCount?: number;
}

interface UseVotingWebSocketOptions {
  votingPhaseId: number;
  token: string;
  initial: VotingLiveInitial;
}

interface ServerMessage {
  type: string;
  payload: Record<string, unknown>;
}

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const BACKOFF_MULTIPLIER = 2;

function numberOr(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function idList(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? (value as string[]) : fallback;
}

export function createInitialLiveState(
  initial: VotingLiveInitial,
): VotingLiveState {
  return {
    connected: false,
    connecting: true,
    error: null,
    currentCandidateId: initial.currentCandidateId,
    approvedCount: initial.approvedCount ?? 0,
    rejectedCount: initial.rejectedCount ?? 0,
    votedCount: initial.votedCount ?? 0,
    recruitersConnected: 0,
    presenceCount: 0,
    finishedCandidateIds: initial.finishedCandidateIds,
    acceptedCandidates: initial.acceptedCandidates,
    rejectedCandidates: initial.rejectedCandidates,
    terminated: initial.terminated,
  };
}

/**
 * Pure transition for one server message. Returns `prev` itself when nothing
 * changes so React can skip the re-render. Has no side effects.
 */
export function reduceVotingMessage(
  prev: VotingLiveState,
  message: ServerMessage,
): VotingLiveState {
  const p = message.payload;

  switch (message.type) {
    case "state_snapshot": {
      // A newly-created room sends its first snapshot before its asynchronous
      // database sync completes. That snapshot intentionally has no vote
      // totals or phase state yet. Keep the server-rendered state until the
      // subsequent status/vote events deliver the authoritative values.
      if (typeof p.votedCount !== "number") {
        return {
          ...prev,
          recruitersConnected: numberOr(
            p.totalToVote,
            prev.recruitersConnected,
          ),
        };
      }

      return {
        ...prev,
        currentCandidateId: (p.currentCandidateId as string | null) ?? null,
        recruitersConnected: numberOr(p.totalToVote, prev.recruitersConnected),
        approvedCount: numberOr(p.approvedCount, 0),
        rejectedCount: numberOr(p.rejectedCount, 0),
        votedCount: p.votedCount,
        finishedCandidateIds: idList(p.finishedCandidateIds, []),
        acceptedCandidates: numberOr(p.acceptedCandidates, 0),
        rejectedCandidates: numberOr(p.rejectedCandidates, 0),
        terminated: p.terminated === true,
      };
    }

    case "status_changed":
      return {
        ...prev,
        currentCandidateId: (p.candidateId as string | undefined) ?? null,
        approvedCount: 0,
        rejectedCount: 0,
        votedCount: 0,
      };

    case "vote_updated":
      if (p.candidateId !== prev.currentCandidateId) return prev;
      return {
        ...prev,
        approvedCount: numberOr(p.approvedCount, prev.approvedCount),
        rejectedCount: numberOr(p.rejectedCount, prev.rejectedCount),
        votedCount: numberOr(p.votedCount, prev.votedCount),
      };

    case "votes_reset":
      if (p.candidateId !== prev.currentCandidateId) return prev;
      return { ...prev, approvedCount: 0, rejectedCount: 0, votedCount: 0 };

    case "progress_updated":
      return {
        ...prev,
        finishedCandidateIds: idList(
          p.finishedCandidateIds,
          prev.finishedCandidateIds,
        ),
        acceptedCandidates: numberOr(
          p.acceptedCandidates,
          prev.acceptedCandidates,
        ),
        rejectedCandidates: numberOr(
          p.rejectedCandidates,
          prev.rejectedCandidates,
        ),
        terminated: p.terminated === true,
      };

    case "presence_updated":
      return {
        ...prev,
        presenceCount: numberOr(p.count, prev.presenceCount),
        recruitersConnected: numberOr(
          p.recruiterCount,
          prev.recruitersConnected,
        ),
      };

    default:
      return prev;
  }
}

export function useVotingWebSocket({
  votingPhaseId,
  token,
  initial,
}: UseVotingWebSocketOptions) {
  const [state, setState] = useState<VotingLiveState>(() =>
    createInitialLiveState(initial),
  );

  // Mirror of the latest state so message handlers can compute the next
  // state without relying on React's updater functions.
  const stateRef = useRef(state);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY);
  const intentionallyClosedRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  const commit = useCallback((next: VotingLiveState) => {
    if (next === stateRef.current) return;
    stateRef.current = next;
    setState(next);
  }, []);

  const patch = useCallback(
    (partial: Partial<VotingLiveState>) => {
      commit({ ...stateRef.current, ...partial });
    },
    [commit],
  );

  const clearReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!votingPhaseId || !token) {
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!baseUrl) {
      patch({
        connecting: false,
        error: "Servidor de votação não configurado.",
      });
      return;
    }

    clearReconnect();
    intentionallyClosedRef.current = false;
    patch({ connecting: true, error: null });

    const ws = new WebSocket(
      `${baseUrl}/voting/${votingPhaseId}?token=${encodeURIComponent(token)}`,
    );
    wsRef.current = ws;

    ws.onopen = () => {
      retryDelayRef.current = INITIAL_RETRY_DELAY;
      patch({ connected: true, connecting: false, error: null });
    };

    ws.onmessage = (event) => {
      if (wsRef.current !== ws) return;

      let message: unknown;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (typeof message !== "object" || message === null) return;

      const { type, payload } = message as Partial<ServerMessage>;
      if (typeof type !== "string") return;

      // The server pings every heartbeat interval; answer so it keeps us.
      if (type === "ping") {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "pong" }));
        }
        return;
      }

      commit(
        reduceVotingMessage(stateRef.current, {
          type,
          payload: (payload ?? {}) as Record<string, unknown>,
        }),
      );
    };

    ws.onerror = () => {
      patch({ error: "Erro de ligação ao servidor de votação." });
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      patch({ connected: false, connecting: false });

      if (!intentionallyClosedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          retryDelayRef.current = Math.min(
            retryDelayRef.current * BACKOFF_MULTIPLIER,
            MAX_RETRY_DELAY,
          );
          connectRef.current();
        }, retryDelayRef.current);
      }
    };
  }, [votingPhaseId, token, clearReconnect, commit, patch]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    intentionallyClosedRef.current = true;
    clearReconnect();
    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      // Detach handlers before closing so the old socket's onclose cannot
      // schedule a duplicate reconnect after a manual reconnect.
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    }
  }, [clearReconnect]);

  const reconnect = useCallback(() => {
    disconnect();
    retryDelayRef.current = INITIAL_RETRY_DELAY;
    connectRef.current();
  }, [disconnect]);

  useEffect(() => {
    connectRef.current();
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    reconnect,
  };
}
