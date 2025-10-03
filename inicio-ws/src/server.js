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

const server = http.createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("okay");
});

wss.on("connection", setupWSConnection);

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    const params = new URLSearchParams(request.url?.replace(/^.*\?/, ""));

    const token = params.get("token") ? (params.get("token")?.split("/")[0]) : "";

    console.log("token:", token);

    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      const payload = jwt.verify(token, jwtSecret);

      if (payload.role !== "recruiter" && payload.role !== "admin") {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.emit("connection", ws, request);
    } catch (error) {
      console.error(error);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  });
});

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`);
});
