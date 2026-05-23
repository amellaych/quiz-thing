// Custom Next.js server with Socket.IO attached.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
    path: "/api/socket",
  });

  // Lazy-require so TS-built file is loaded after `next build` or via ts-node-less runtime.
  const { registerSocketHandlers } = require("./src/server/realtime");
  registerSocketHandlers(io);

  httpServer.listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`> Quiz Thing ready on http://${hostname}:${port}`);
  });
});
