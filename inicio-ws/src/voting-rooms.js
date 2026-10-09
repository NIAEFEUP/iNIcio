// @ts-nocheck
/**
 * Voting room manager for inicio-ws.
 *
 * Each room is identified by "voting:{votingPhaseId}". The server keeps the
 * latest known state in memory and broadcasts role-filtered events to all
 * connected clients.
 */

import { generateServerJWT } from "./jwt.js";

const rooms = new Map();
const nextjsUrl = process.env.NEXTJS_URL || "http://localhost:3000";

const readyStateOpen = 1;
// Clients must answer each ping. A socket that misses a whole interval is
// dropped so dead connections do not keep presence counts inflated.
const HEARTBEAT_MS = Number(process.env.WS_HEARTBEAT_MS) || 30000;

// Backoff between sync attempts. After the last retry the room stays
// unsynced until the next client joins, which starts a new round.
const SYNC_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000, 32000];
const SYNC_TIMEOUT_MS = 5000;

function scheduleRoomSync(room, attempt) {
  const votingPhaseId = room.name.replace("voting/", "");
  const url = `${nextjsUrl}/api/votingphase/${votingPhaseId}/sync`;

  let token;
  try {
    token = generateServerJWT();
  } catch (error) {
    console.error("[voting] failed to sign sync token", error);
    room.syncing = false;
    return;
  }

  room.syncing = true;
  fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(SYNC_TIMEOUT_MS),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`status ${response.status}`);
      }
      room.synced = true;
      room.syncing = false;
    })
    .catch((error) => {
      console.error(
        `[voting] room sync attempt ${attempt + 1} failed`,
        error.message,
      );
      room.syncing = false;
      if (attempt >= SYNC_RETRY_DELAYS_MS.length) return;
      if (rooms.get(room.name) !== room) return;

      room.syncing = true;
      room.syncTimer = setTimeout(() => {
        room.syncTimer = null;
        if (rooms.get(room.name) === room && !room.synced) {
          scheduleRoomSync(room, attempt + 1);
        } else {
          room.syncing = false;
        }
      }, SYNC_RETRY_DELAYS_MS[attempt]);
    });
}

function requestRoomSync(room) {
  if (room.synced || room.syncing) return;
  scheduleRoomSync(room, 0);
}

function getRoom(roomName) {
  let room = rooms.get(roomName);
  if (!room) {
    room = {
      name: roomName,
      clients: new Set(),
      synced: false,
      syncing: false,
      syncTimer: null,
      hasVoteState: false,
      connectedRecruiters: 0,
      state: {
        currentCandidateId: null,
        approvedCount: 0,
        rejectedCount: 0,
        votedCount: 0,
        totalToVote: 0,
        finishedCandidates: 0,
      },
    };
    rooms.set(roomName, room);
  }
  return room;
}

function deleteRoomIfEmpty(room) {
  if (room.clients.size === 0) {
    if (room.syncTimer) clearTimeout(room.syncTimer);
    rooms.delete(room.name);
  }
}

function send(ws, message) {
  if (ws.readyState === readyStateOpen) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("[voting] failed to send message", error);
    }
  }
}

function buildSnapshot(room, role) {
  const snapshot = {
    type: "state_snapshot",
    payload: {
      currentCandidateId: room.state.currentCandidateId,
      totalToVote: room.connectedRecruiters,
    },
  };

  if (room.hasVoteState) {
    snapshot.payload.votedCount = room.state.votedCount;
    snapshot.payload.finishedCandidates = room.state.finishedCandidates;

    if (role === "admin") {
      snapshot.payload.approvedCount = room.state.approvedCount;
      snapshot.payload.rejectedCount = room.state.rejectedCount;
    }
  }

  return snapshot;
}

function buildEventForRole(event, role) {
  if (role !== "admin") {
    const { approvedCount, rejectedCount, ...rest } = event.payload || {};
    return { ...event, payload: rest };
  }
  return event;
}

function applyEvent(room, event) {
  const { type, payload } = event;
  if (!payload) return;

  switch (type) {
    case "status_changed":
      room.state.currentCandidateId = payload.candidateId ?? null;
      // Avoid showing the previous candidate's vote counts on the new
      // candidate. The actual counts for the new candidate are broadcast
      // separately via vote_updated.
      room.state.approvedCount = 0;
      room.state.rejectedCount = 0;
      room.state.votedCount = 0;
      break;
    case "vote_updated":
      if (payload.candidateId !== room.state.currentCandidateId) break;
      room.hasVoteState = true;
      room.state.approvedCount = payload.approvedCount ?? 0;
      room.state.rejectedCount = payload.rejectedCount ?? 0;
      room.state.votedCount = payload.votedCount ?? 0;
      break;
    case "votes_reset":
      room.hasVoteState = true;
      room.state.approvedCount = 0;
      room.state.rejectedCount = 0;
      room.state.votedCount = 0;
      break;
    case "candidate_finished":
      room.state.finishedCandidates = payload.finishedCandidates ?? 0;
      break;
    case "finished_updated":
      room.hasVoteState = true;
      room.state.finishedCandidates = payload.finishedCandidates ?? 0;
      break;
    default:
      break;
  }
}

export function addClient(roomName, ws, metadata) {
  const room = getRoom(roomName);
  requestRoomSync(room);
  const client = { ws, metadata };
  room.clients.add(client);

  if (metadata.role === "recruiter") {
    room.connectedRecruiters += 1;
  }

  send(ws, buildSnapshot(room, metadata.role));
  broadcast(room, {
    type: "presence_updated",
    payload: {
      count: room.clients.size,
      recruiterCount: room.connectedRecruiters,
    },
  });

  ws.on("close", () => removeClient(roomName, client));
  ws.on("message", (data) => handleClientMessage(room, client, data));
  ws.on("error", (error) => {
    console.error("[voting] client error", error);
    removeClient(roomName, client);
  });

  client.alive = true;
  const heartbeat = setInterval(() => {
    if (ws.readyState !== readyStateOpen) {
      clearInterval(heartbeat);
      return;
    }
    if (!client.alive) {
      console.warn("[voting] client missed heartbeat, dropping");
      ws.terminate();
      return;
    }
    client.alive = false;
    send(ws, { type: "ping" });
  }, HEARTBEAT_MS);

  ws.on("close", () => clearInterval(heartbeat));
}

function removeClient(roomName, client) {
  const room = rooms.get(roomName);
  if (!room) return;

  room.clients.delete(client);
  if (client.metadata.role === "recruiter") {
    room.connectedRecruiters = Math.max(0, room.connectedRecruiters - 1);
  }
  deleteRoomIfEmpty(room);

  const activeRoom = rooms.get(roomName);
  if (activeRoom) {
    broadcast(activeRoom, {
      type: "presence_updated",
      payload: {
        count: activeRoom.clients.size,
        recruiterCount: activeRoom.connectedRecruiters,
      },
    });
  }

  try {
    client.ws.terminate();
  } catch {
    // ignore
  }
}

function handleClientMessage(room, client, data) {
  let message;
  try {
    message = JSON.parse(data.toString());
  } catch {
    send(client.ws, { type: "error", payload: { message: "Invalid JSON" } });
    return;
  }

  if (message.type === "pong") {
    client.alive = true;
    return;
  }

  // Clients only send keepalive messages. All state changes come from
  // server-to-server broadcasts triggered by Next.js Server Actions.
  send(client.ws, {
    type: "error",
    payload: { message: "Unknown message type" },
  });
}

export function broadcast(roomName, event) {
  const room = typeof roomName === "string" ? rooms.get(roomName) : roomName;
  if (!room) return;

  // Drop late updates for the previous candidate entirely: they must
  // neither touch room state nor reach the clients still connected.
  const { type, payload } = event;
  if (
    type === "vote_updated" &&
    payload?.candidateId !== room.state.currentCandidateId
  ) {
    return;
  }

  applyEvent(room, event);

  room.clients.forEach((client) => {
    send(client.ws, buildEventForRole(event, client.metadata.role));
  });
}

export function getRoomNames() {
  return Array.from(rooms.keys());
}
