#!/usr/bin/env python3
"""
UniHive - Automatic Startup Script
Starts a local HTTP server with correct ES module MIME types and opens UniHive in your default web browser.
Zero external dependencies required (uses standard library only).
"""

import os
import sys
import socket
import mimetypes
import webbrowser
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Ensure correct MIME type for JavaScript ES modules across all operating systems
mimetypes.init()
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("text/css", ".css")

class UniHiveRequestHandler(SimpleHTTPRequestHandler):
    """Custom request handler ensuring proper caching and MIME types for UniHive."""

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".css": "text/css",
    }

    def end_headers(self):
        # Disable aggressive caching in local dev so changes reflect immediately
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        # Format compact server logs
        code = args[1] if len(args) > 1 else ""
        sys.stderr.write(f"  [UniHive HTTP] {args[0]} - Status: {code}\n")


def find_available_port(start_port=8000, max_attempts=50):
    """Find the first available TCP port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return start_port


def main():
    # Always serve from the directory containing start.py
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)

    port = find_available_port(8000)
    url = f"http://localhost:{port}"

    server = ThreadingHTTPServer(("127.0.0.1", port), UniHiveRequestHandler)

    banner = f"""
========================================================================
  _    _       _ _    _ _           
 | |  | |     (_) |  | (_)          
 | |  | |_ __  _| |__| |___   _____ 
 | |  | | '_ \\| |  __  | \\ \\ / / _ \\
 | |__| | | | | | |  | | |\\ V /  __/
  \\____/|_| |_|_|_|  |_|_| \\_/ \\___|
                                    
  Hardware & Electronics Component Sharing Platform for Campus Makers
========================================================================

  >>> Server running at: {url}
  >>> Root directory:    {project_dir}
  >>> Press Ctrl+C to stop the server anytime.

------------------------------------------------------------------------
  PRESET DEMO ACCOUNTS FOR EVALUATION
------------------------------------------------------------------------
  [Central Administrator]
    Email:    admin@unihive.edu
    Password: Admin@UniHive2025!
    Access:   Direct Student Allotment + Add/Remove Components + Reports

  [Technical Council Volunteer]
    Email:    volunteer@unihive.edu
    Password: Volunteer@UniHive2025!
    Access:   Add/Remove Components + QR Handover Passes + Inventory

  [Student]
    Email:    student@unihive.edu
    Password: Student@UniHive2025!
    Access:   Component Catalog + Request Hardware + QR Pickup Pass
------------------------------------------------------------------------
"""
    print(banner)

    # Automatically launch default browser after a brief delay so server is listening
    def open_browser():
        time.sleep(0.6)
        print(f"Opening {url} in your default browser...\n")
        try:
            webbrowser.open(url)
        except Exception as e:
            print(f"Notice: Could not automatically open browser ({e}). Please visit {url} manually.")

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[UniHive] Stopping server gracefully. Goodbye!")
        server.shutdown()
        server.server_close()
        sys.exit(0)


if __name__ == "__main__":
    main()
