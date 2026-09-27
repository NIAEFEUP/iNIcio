#!/usr/bin/env node

import jwt from "jsonwebtoken";

import WebSocket from "ws";
import http from "http";
import * as number from "lib0/number";
import { setupWSConnection } from "./utils.js";

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

const server = http.createServer((_request, response) => {
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
