"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface VotingWebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  currentCandidateId: string | null;
  approvedCount: number;
  rejectedCount: number;
  votedCount: number;
  totalToVote: number;
  finishedCandidates: number;
  acceptedCandidates: number;
  rejectedCandidates: number;
  isTerminated: boolean;
  presenceCount: number;
}

export interface UseVotingWebSocketOptions {
  votingPhaseId: number;
  token: string;
  initialCandidateId?: string | null;
  initialApprovedCount?: number;
  initialRejectedCount?: number;
  initialVotedCount?: number;
  initialTotalToVote?: number;
  initialFinishedCandidates?: number;
  initialAcceptedCandidates?: number;
  initialRejectedCandidates?: number;
  initialTerminated?: boolean;
  onStatusChanged?: (candidateId: string) => void;
  onCandidateFinished?: (
    candidateId: string,
    decision: "accept" | "reject",
  ) => void;
  onVotesReset?: (candidateId: string) => void;
  onSessionTerminated?: () => void;
}

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const BACKOFF_MULTIPLIER = 2;

export function useVotingWebSocket({
  votingPhaseId,
  token,
  initialCandidateId = null,
  initialApprovedCount = 0,
  initialRejectedCount = 0,
  initialVotedCount = 0,
  initialTotalToVote = 0,
  initialFinishedCandidates = 0,
  initialAcceptedCandidates = 0,
  initialRejectedCandidates = 0,
  initialTerminated = false,
  onStatusChanged,
  onCandidateFinished,
  onVotesReset,
  onSessionTerminated,
}: UseVotingWebSocketOptions) {
  const [state, setState] = useState<VotingWebSocketState>({
    connected: false,
    connecting: true,
    error: null,
    currentCandidateId: initialCandidateId,
    approvedCount: initialApprovedCount,
    rejectedCount: initialRejectedCount,
    votedCount: initialVotedCount,
    totalToVote: initialTotalToVote,
    finishedCandidates: initialFinishedCandidates,
    acceptedCandidates: initialAcceptedCandidates,
    rejectedCandidates: initialRejectedCandidates,
    isTerminated: initialTerminated,
    presenceCount: 0,
  });

  const callbacksRef = useRef({
    onStatusChanged,
    onCandidateFinished,
    onVotesReset,
    onSessionTerminated,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStatusChanged,
      onCandidateFinished,
      onVotesReset,
      onSessionTerminated,
    };
  }, [onStatusChanged, onCandidateFinished, onVotesReset, onSessionTerminated]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY);
  const intentionallyClosedRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  const clearReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const clearPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const handleMessage = useCallback((message: unknown) => {
    if (
      typeof message !== "object" ||
      message === null ||
      !("type" in message) ||
      !("payload" in message)
    ) {
      return;
    }

    const { type, payload } = message as {
      type: string;
      payload: Record<string, unknown>;
    };

    setState((prev) => {
      switch (type) {
        case "state_snapshot": {
          const nextSnapshotCandidateId =
            (payload.currentCandidateId as string | null) ??
            prev.currentCandidateId;
          if (
            nextSnapshotCandidateId &&
            nextSnapshotCandidateId !== prev.currentCandidateId
          ) {
            callbacksRef.current.onStatusChanged?.(nextSnapshotCandidateId);
          }
          if (payload.terminated && !prev.isTerminated) {
            callbacksRef.current.onSessionTerminated?.();
          }
          return {
            ...prev,
            currentCandidateId: nextSnapshotCandidateId,
            approvedCount:
              (payload.approvedCount as number | undefined) ??
              prev.approvedCount,
            rejectedCount:
              (payload.rejectedCount as number | undefined) ??
              prev.rejectedCount,
            votedCount:
              (payload.votedCount as number | undefined) ?? prev.votedCount,
            totalToVote:
              (payload.totalToVote as number | undefined) ?? prev.totalToVote,
            finishedCandidates:
              (payload.finishedCandidates as number | undefined) ??
              prev.finishedCandidates,
            acceptedCandidates:
              (payload.acceptedCount as number | undefined) ??
              prev.acceptedCandidates,
            rejectedCandidates:
              (payload.rejectedCount as number | undefined) ??
              prev.rejectedCandidates,
            isTerminated:
              (payload.terminated as boolean | undefined) ?? prev.isTerminated,
          };
        }
        case "status_changed": {
          const nextCandidateId =
            (payload.candidateId as string | null) ?? prev.currentCandidateId;
          if (nextCandidateId && nextCandidateId !== prev.currentCandidateId) {
            callbacksRef.current.onStatusChanged?.(nextCandidateId);
          }
          return {
            ...prev,
            currentCandidateId: nextCandidateId,
            approvedCount: 0,
            rejectedCount: 0,
            votedCount: 0,
          };
        }
        case "vote_updated": {
          const voteCandidateId = payload.candidateId as string | undefined;
          if (voteCandidateId && voteCandidateId !== prev.currentCandidateId) {
            return prev;
          }
          return {
            ...prev,
            approvedCount:
              (payload.approvedCount as number | undefined) ??
              prev.approvedCount,
            rejectedCount:
              (payload.rejectedCount as number | undefined) ??
              prev.rejectedCount,
            votedCount:
              (payload.votedCount as number | undefined) ?? prev.votedCount,
          };
        }
        case "votes_reset": {
          const resetCandidateId = payload.candidateId as string | undefined;
          if (resetCandidateId) {
            callbacksRef.current.onVotesReset?.(resetCandidateId);
          }
          const isSameCandidate =
            !resetCandidateId || resetCandidateId === prev.currentCandidateId;
          return {
            ...prev,
            approvedCount: isSameCandidate ? 0 : prev.approvedCount,
            rejectedCount: isSameCandidate ? 0 : prev.rejectedCount,
            votedCount: isSameCandidate ? 0 : prev.votedCount,
            finishedCandidates:
              (payload.finishedCandidates as number | undefined) ??
              prev.finishedCandidates,
            acceptedCandidates:
              (payload.acceptedCount as number | undefined) ??
              prev.acceptedCandidates,
            rejectedCandidates:
              (payload.rejectedCount as number | undefined) ??
              prev.rejectedCandidates,
          };
        }
        case "candidate_finished": {
          const finishedCandidateId = payload.candidateId as string | undefined;
          const decision = payload.decision as "accept" | "reject" | undefined;
          if (finishedCandidateId && decision) {
            callbacksRef.current.onCandidateFinished?.(
              finishedCandidateId,
              decision,
            );
          }
          return {
            ...prev,
            finishedCandidates:
              (payload.finishedCandidates as number | undefined) ??
              prev.finishedCandidates,
            acceptedCandidates:
              (payload.acceptedCount as number | undefined) ??
              prev.acceptedCandidates,
            rejectedCandidates:
              (payload.rejectedCount as number | undefined) ??
              prev.rejectedCandidates,
          };
        }
        case "finished_updated":
          return {
            ...prev,
            finishedCandidates:
              (payload.finishedCandidates as number | undefined) ??
              prev.finishedCandidates,
            acceptedCandidates:
              (payload.acceptedCount as number | undefined) ??
              prev.acceptedCandidates,
            rejectedCandidates:
              (payload.rejectedCount as number | undefined) ??
              prev.rejectedCandidates,
          };
        case "session_terminated":
          callbacksRef.current.onSessionTerminated?.();
          return {
            ...prev,
            isTerminated: true,
          };
        case "presence_updated":
          return {
            ...prev,
            presenceCount:
              (payload.count as number | undefined) ?? prev.presenceCount,
            totalToVote:
              (payload.recruiterCount as number | undefined) ??
              prev.totalToVote,
          };
        default:
          return prev;
      }
    });
  }, []);

  const connect = useCallback(() => {
    if (!votingPhaseId || !token) {
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    clearReconnect();
    intentionallyClosedRef.current = false;

    setState((prev) => ({
      ...prev,
      connecting: true,
      error: null,
    }));

    const wsUrl = `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/voting/${votingPhaseId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      retryDelayRef.current = INITIAL_RETRY_DELAY;
      setState((prev) => ({
        ...prev,
        connected: true,
        connecting: false,
        error: null,
      }));

      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      setState((prev) => ({
        ...prev,
        error: "Erro de ligação ao servidor de votação.",
      }));
    };

    ws.onclose = () => {
      clearPing();
      setState((prev) => ({
        ...prev,
        connected: false,
        connecting: false,
      }));

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
  }, [votingPhaseId, token, clearPing, clearReconnect, handleMessage]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    intentionallyClosedRef.current = true;
    clearReconnect();
    clearPing();
    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    }
  }, [clearPing, clearReconnect]);

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
