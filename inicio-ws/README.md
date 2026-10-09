# inicio-ws

Websocket service used by iNIcio for two things:

- **Collaborative editing**: y-websocket rooms used by the real-time editor.
- **Live voting**: `voting/{votingPhaseId}` rooms that push vote and progress
  updates to connected admins and recruiters.

## Environment

| Variable       | Required | Default                    | Purpose                                   |
| -------------- | -------- | -------------------------- | ----------------------------------------- |
| `JWT_SECRET`   | yes      | -                          | Verifies client and server tokens         |
| `HOST`         | no       | `localhost`                | Bind address (`0.0.0.0` in Docker)        |
| `PORT`         | no       | `1234`                     | Listen port                               |
| `NEXTJS_URL`   | no       | `http://localhost:3000`    | Next.js app used to sync voting rooms     |

The service refuses to start without `JWT_SECRET`.

## Endpoints

- `ws://host:port/{room}?token=...`: client connection. The token must have
  role `recruiter` or `admin` and list the room in its `rooms` claim.
- `POST /broadcast`: internal endpoint used by Next.js server actions. It
  requires a token with role `server` and a JSON body
  `{ "room": "voting/1", "event": { ... } }`. Bodies over 64 KB are rejected.

## Running

```sh
npm install
JWT_SECRET=... npm start
```

With Docker, see `docker-compose.yml` in the repository root.
