// Loopback-only CONNECT proxy for local source checks. The project resolves and checks each address
// itself (egress-proxy.ts) and asks this proxy to tunnel to that address; this side only connects.
import http from "node:http";
import net from "node:net";

const server = http.createServer((_req, res) => { res.writeHead(405); res.end("CONNECT only\n"); });
server.on("connect", (req, client, head) => {
  // URL parsing keeps IPv6 literals ("[2606:…]:443") whole; the brackets are not part of the address.
  const { hostname, port } = new URL(`http://${req.url}`);
  const upstream = net.connect(Number(port) || 80, hostname.replace(/^\[|\]$/g, ""), () => {
    client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    if (head.length) upstream.write(head);
    upstream.pipe(client);
    client.pipe(upstream);
  });
  const close = () => { upstream.destroy(); client.destroy(); };
  upstream.on("error", () => { client.end("HTTP/1.1 502 Bad Gateway\r\n\r\n"); close(); });
  client.on("error", close);
});
server.listen(55435, "127.0.0.1", () => console.log("loopback proxy on 127.0.0.1:55435"));
