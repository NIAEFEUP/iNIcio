#!/usr/bin/env node

import jwt from "jsonwebtoken";

import WebSocket from "ws";
import http from "http";
import * as number from "lib0/number";
import { setupWSConnection } from "./utils.js";

const wss = new WebSocket.Server({ noServer: true });
const host = process.env.HOST || "localhost";
const port = number.parseInt(process.env.PORT || "1234");
const jwtSecret = process.env.JWT_SECRET || "inicio";

if (!process.env.JWT_SECRET) {
  console.warn(
    "[ws] JWT_SECRET is not set, falling back to the default value. Tokens signed with a different secret will be rejected.",
  );
}

const server = http.createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("okay");
});

wss.on("connection", setupWSConnection);

server.on("upgrade", (request, socket, head) => {
  const params = new URLSearchParams(request.url?.replace(/^.*\?/, ""));

  const token = params.get("token") ? params.get("token")?.split("/")[0] : "";

  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  let payload;

  // Authenticate before upgrading: once handleUpgrade runs the 101 response is
  // already on the wire, so writing a 401 afterwards would corrupt the stream.
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch (error) {
    console.error("[ws] authentication failed", error.message);
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  if (payload.role !== "recruiter" && payload.role !== "admin") {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    const room = (request.url || "").slice(1).split("?")[0];
    console.log(`[ws] connected room=${room}`);
    wss.emit("connection", ws, request);
    ws.once("close", () => console.log(`[ws] disconnected room=${room}`));
  });
});

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`);
});
