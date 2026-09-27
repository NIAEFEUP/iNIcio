#!/usr/bin/env node

import jwt from "jsonwebtoken";

import WebSocket from "ws";
import http from "http";
import * as number from "lib0/number";
import { setupWSConnection, docs } from "./utils.js";

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

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/reset-rooms") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        const auth = request.headers.authorization;
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token) {
          response.writeHead(401, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ error: "Unauthorized" }));
          return;
        }
        const payload = jwt.verify(token, jwtSecret);
        if (payload.role !== "admin") {
          response.writeHead(403, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ error: "Forbidden" }));
          return;
        }

        const data = JSON.parse(body || "{}");
        const roomsToReset = Array.isArray(data.rooms) ? data.rooms : [];
        for (const roomName of roomsToReset) {
          const doc = docs.get(roomName);
          if (doc) {
            doc.conns.forEach((_, conn) => {
              try {
                conn.close(4000, "room_reset");
              } catch {}
            });
            doc.destroy();
            docs.delete(roomName);
          }
        }
        console.log(`[ws] Reset ${roomsToReset.length} rooms`);
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({ success: true, count: roomsToReset.length }),
        );
      } catch (err) {
        console.error("[ws] Error resetting rooms:", err.message);
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: err.message }));
      }
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

  const token = url.searchParams.get("token");
  const room = decodeURIComponent(url.pathname.slice(1));

  if (!token || !room) {
    reject("401 Unauthorized");
    return;
  }

  let payload;

  // Authenticate before upgrading: once handleUpgrade runs the 101 response is
  // already on the wire, so writing a 401 afterwards would corrupt the stream.
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch (error) {
    console.error("[ws] authentication failed", error.message);
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

  wss.handleUpgrade(request, socket, head, (ws) => {
    console.log(`[ws] connected room=${room}`);
    wss.emit("connection", ws, request);
    ws.once("close", () => console.log(`[ws] disconnected room=${room}`));
  });
});

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`);
});
