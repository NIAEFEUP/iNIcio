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
const jwtSecret = process.env.JWT_SECRET || "inicio";

if (!process.env.JWT_SECRET) {
  console.warn(
    "[ws] JWT_SECRET is not set, falling back to the default value. Tokens signed with a different secret will be rejected.",
  );
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
  const queryToken = params.get("token")?.split("/")[0];
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
  const token = getTokenFromRequest(request);

  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    console.error("[ws] authentication failed");
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  const path = (request.url || "").split("?")[0];

  if (path.startsWith("/voting/")) {
    if (payload.role !== "recruiter" && payload.role !== "admin") {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    const room = path.slice(1);
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

  if (payload.role !== "recruiter" && payload.role !== "admin") {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    const room = path.slice(1);
    console.log(`[ws] connected room=${room}`);
    wss.emit("connection", ws, request);
    ws.once("close", () => console.log(`[ws] disconnected room=${room}`));
  });
});

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`);
});
