const express = require("express");
const dgram = require("dgram");

const app = express();
const PORT = 3000;

// Config do servidor SA-MP
const SERVER_IP = "185.91.127.201";
const SERVER_PORT = 7777;

// Função para query SA-MP
function querySamp(ip, port) {
  return new Promise((resolve) => {
    const client = dgram.createSocket("udp4");

    const ipParts = ip.split(".").map(Number);

    const packet = Buffer.from([
      0x53, 0x41, 0x4D, 0x50, // "SAMP"
      ipParts[0],
      ipParts[1],
      ipParts[2],
      ipParts[3],
      port & 0xFF,
      port >> 8,
      0x69 // 'i'
    ]);

    const timeout = setTimeout(() => {
      client.close();
      resolve(false);
    }, 2000);

    client.send(packet, 0, packet.length, port, ip);

    client.on("message", (msg) => {
      clearTimeout(timeout);

      if (!msg || msg.length < 13) {
        client.close();
        return resolve(false);
      }

      const players = msg[11] + (msg[12] << 8);

      client.close();

      resolve({
        players1: players,
        ping: Math.floor(Math.random() * (180 - 60) + 60),
        doubling: 1,
        new: 1
      });
    });

    client.on("error", () => {
      clearTimeout(timeout);
      client.close();
      resolve(false);
    });
  });
}

// Rota API
app.get("/", async (req, res) => {
  let status = await querySamp(SERVER_IP, SERVER_PORT);

  if (!status) {
    status = {
      players1: 0,
      ping: 999,
      doubling: 0,
      new: 0
    };
  }

  res.json({
    servers: [status]
  });
});

// Start servidor
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});