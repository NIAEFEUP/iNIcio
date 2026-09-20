#!/usr/bin/env node
// @ts-nocheck

import jwt from "jsonwebtoken";

import WebSocket from "ws";
import http from "http";
import * as number from "lib0/number";
import { setupWSConnection } from "./utils.js";
import { addClient, broadcast } from "./voting-rooms.js";

const wss = new WebSocket.Server({ noServer: true });
const host = process.env.HOST || "localhost";
const port = number.parseInt(process.env.PORT || "1234");
const jwtSecret = process.env.JWT_SECRET;

// Fail closed: without a strong secret, forged tokens would be accepted.
if (!jwtSecret) {
  console.error(
    "[ws] JWT_SECRET is not set. Refusing to start without a secret.",
  );
  process.exit(1);
}

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

function getTokenFromRequest(request) {
  const params = new URLSearchParams(request.url?.replace(/^.*\?/, ""));
  const queryToken = params.get("token");
  if (queryToken) return queryToken;

  const authHeader = request.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/broadcast") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      const payload = verifyToken(getTokenFromRequest(request));
      if (!payload || payload.role !== "server") {
        writeJson(response, 403, { error: "Forbidden" });
        return;
      }

      let data;
      try {
        data = JSON.parse(body);
      } catch {
        writeJson(response, 400, { error: "Invalid JSON" });
        return;
      }

      if (!data.room || !data.event) {
        writeJson(response, 400, { error: "Missing room or event" });
        return;
      }

      broadcast(data.room, data.event);
      writeJson(response, 200, { ok: true });
    });
    return;
  }

  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("okay");
});

wss.on("connection", setupWSConnection);

server.on("upgrade", (request, socket, head) => {
  const reject = (status, reason) => {
    socket.write(`HTTP/1.1 ${status} ${reason}\r\n\r\n`);
    socket.destroy();
  };

  let url;
  try {
    url = new URL(request.url || "/", "http://localhost");
  } catch {
    reject("400 Bad Request");
    return;
  }

  const token = getTokenFromRequest(request);
  const room = decodeURIComponent(url.pathname.slice(1));

  if (!token || !room) {
    reject("401 Unauthorized");
    return;
  }

  // Authenticate before upgrading: once handleUpgrade runs the 101 response is
  // already on the wire, so writing a 401 afterwards would corrupt the stream.
  const payload = verifyToken(token);
  if (!payload) {
    console.error("[ws] authentication failed");
    reject("401 Unauthorized");
    return;
  }

  if (payload.role !== "recruiter" && payload.role !== "admin") {
    reject("403 Forbidden");
    return;
  }

  // The token is bound to the rooms it was minted for. Reject any other room so
  // a token cannot be replayed against a document the user was never granted.
  if (!Array.isArray(payload.rooms) || !payload.rooms.includes(room)) {
    console.error(`[ws] room access denied room=${room}`);
    reject("403 Forbidden");
    return;
  }

  if (room.startsWith("voting/")) {
    const votingPhaseId = room.replace("voting/", "");

    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log(`[voting] connected room=${room}`);
      addClient(room, ws, {
        userId: payload.id,
        role: payload.role,
        votingPhaseId,
      });
    });
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    console.log(`[ws] connected room=${room}`);
    wss.emit("connection", ws, request);
    ws.once("close", () => console.log(`[ws] disconnected room=${room}`));
  });
});

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`);
});