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
    const os = require("os");
    const nets = os.networkInterfaces();
    const lanIps = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === "IPv4" && !net.internal) lanIps.push(net.address);
      }
    }
    // eslint-disable-next-line no-console
    console.log(`> Quiz Thing ready on http://${hostname}:${port}`);
    if (lanIps.length) {
      // eslint-disable-next-line no-console
      console.log(`> LAN access:  ${lanIps.map((ip) => `http://${ip}:${port}`).join("  ")}`);
    }
    if (process.env.PUBLIC_URL) {
      // eslint-disable-next-line no-console
      console.log(`> Public URL:  ${process.env.PUBLIC_URL}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`> Tip: set PUBLIC_URL to your tunnel URL so players can join from anywhere.`);
    }
  });
});
