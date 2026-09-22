"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface VotingWebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  currentCandidateId: string | null;
  approvedCount: number;
  rejectedCount: number;
  votedCount: number;
  totalToVote: number;
  finishedCandidates: number;
  presenceCount: number;
}

interface UseVotingWebSocketOptions {
  votingPhaseId: number;
  token: string;
  initialCandidateId: string | null;
  initialApprovedCount: number;
  initialRejectedCount: number;
  initialVotedCount: number;
  initialTotalToVote: number;
  initialFinishedCandidates: number;
  onStatusChanged?: (candidateId: string) => void;
  onCandidateFinished?: (candidateId: string) => void;
}

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const BACKOFF_MULTIPLIER = 2;

export function useVotingWebSocket({
  votingPhaseId,
  token,
  initialCandidateId,
  initialApprovedCount,
  initialRejectedCount,
  initialVotedCount,
  initialTotalToVote,
  initialFinishedCandidates,
  onStatusChanged,
  onCandidateFinished,
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
    presenceCount: 0,
  });

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

  const handleMessage = useCallback(
    (message: unknown) => {
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
              onStatusChanged &&
              nextSnapshotCandidateId &&
              nextSnapshotCandidateId !== prev.currentCandidateId
            ) {
              onStatusChanged(nextSnapshotCandidateId);
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
            };
          }
          case "status_changed": {
            const nextCandidateId =
              (payload.candidateId as string | null) ?? prev.currentCandidateId;
            if (onStatusChanged && nextCandidateId) {
              onStatusChanged(nextCandidateId);
            }
            return {
              ...prev,
              currentCandidateId: nextCandidateId,
            };
          }
          case "vote_updated": {
            const voteCandidateId = payload.candidateId as string | undefined;
            if (
              voteCandidateId &&
              voteCandidateId !== prev.currentCandidateId
            ) {
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
              totalToVote:
                (payload.totalToVote as number | undefined) ?? prev.totalToVote,
            };
          }
          case "votes_reset":
            return {
              ...prev,
              approvedCount: (payload.approvedCount as number | undefined) ?? 0,
              rejectedCount: (payload.rejectedCount as number | undefined) ?? 0,
              votedCount: (payload.votedCount as number | undefined) ?? 0,
              totalToVote:
                (payload.totalToVote as number | undefined) ?? prev.totalToVote,
            };
          case "candidate_finished": {
            const finishedCandidateId = payload.candidateId as
              string | undefined;
            if (
              finishedCandidateId &&
              finishedCandidateId === prev.currentCandidateId &&
              onCandidateFinished
            ) {
              onCandidateFinished(finishedCandidateId);
            }
            return {
              ...prev,
              finishedCandidates:
                (payload.finishedCandidates as number | undefined) ??
                prev.finishedCandidates,
            };
          }
          case "finished_updated":
            return {
              ...prev,
              finishedCandidates:
                (payload.finishedCandidates as number | undefined) ??
                prev.finishedCandidates,
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
    },
    [onStatusChanged, onCandidateFinished],
  );

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
      // Detach handlers before closing so the old socket's onclose
      // cannot schedule a duplicate reconnect after a manual reconnect.
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
