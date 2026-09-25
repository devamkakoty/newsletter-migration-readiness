import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8" };
const files = new Set(["/index.html", "/app.mjs", "/audit.mjs"]);

const server = http.createServer(async (request, response) => {
  const pathname = request.url === "/" ? "/index.html" : new URL(request.url, "http://localhost").pathname;
  if (!files.has(pathname)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  try {
    const body = await readFile(join(root, pathname.slice(1)));
    response.writeHead(200, {
      "content-type": types[extname(pathname)],
      "cache-control": "no-store",
      "content-security-policy": "default-src 'self'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    });
    response.end(body);
  } catch {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Unable to read the requested file");
  }
});

server.listen(Number(process.env.PORT || 8184), "127.0.0.1", () => {
  const address = server.address();
  console.log(`Newsletter audit: http://127.0.0.1:${address.port}`);
});
