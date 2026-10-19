#!/usr/bin/env python3
"""Serve build/pages-artifact with trailing .html/ rewrite (local QA)."""
import http.server
import os
import socketserver

ROOT = os.path.join(os.path.dirname(__file__), "..", "build", "pages-artifact")
PORT = int(os.environ.get("SKISTER_SERVE_PORT", "8814"))


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.endswith(".html/"):
            self.path = self.path[:-1]
        return super().do_GET()


os.chdir(os.path.abspath(ROOT))
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"Serving {ROOT} on http://127.0.0.1:{PORT}/", flush=True)
    httpd.serve_forever()
