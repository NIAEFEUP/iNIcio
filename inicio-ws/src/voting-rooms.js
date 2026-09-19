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

function requestRoomSync(roomName) {
  const votingPhaseId = roomName.replace("voting/", "");
  const url = `${nextjsUrl}/api/votingphase/${votingPhaseId}/sync`;

  try {
    const token = generateServerJWT();
    fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          console.error("[voting] room sync failed", response.status);
        }
      })
      .catch((error) => {
        console.error("[voting] room sync error", error);
      });
  } catch (error) {
    console.error("[voting] failed to sign sync token", error);
  }
}

function getRoom(roomName) {
  let room = rooms.get(roomName);
  if (!room) {
    room = {
      name: roomName,
      clients: new Set(),
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
    requestRoomSync(roomName);
  }
  return room;
}

function deleteRoomIfEmpty(room) {
  if (room.clients.size === 0) {
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
      if (payload.candidateId === room.state.currentCandidateId) {
        room.state.votedCount = 0;
      }
      break;
    default:
      break;
  }
}

export function addClient(roomName, ws, metadata) {
  const room = getRoom(roomName);
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

  const pingInterval = setInterval(() => {
    if (ws.readyState === readyStateOpen) {
      send(ws, { type: "ping" });
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);

  ws.on("close", () => clearInterval(pingInterval));
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

  applyEvent(room, event);

  room.clients.forEach((client) => {
    send(client.ws, buildEventForRole(event, client.metadata.role));
  });
}

export function getRoomNames() {
  return Array.from(rooms.keys());
}
