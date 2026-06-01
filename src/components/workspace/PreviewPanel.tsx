"use client";

import React, { useEffect, useRef, useState } from "react";
import { useProjectStore } from "@/stores/project";
import { 
  Laptop, 
  Tablet, 
  Smartphone, 
  RefreshCw, 
  ExternalLink,
  Code2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PreviewPanel() {
  const { files, devicePreview, setDevicePreview, activeFilePath, setRuntimeError } = useProjectStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const reloadIframe = () => {
    setRuntimeError(null);
    setIframeKey(prev => prev + 1);
  };

  // Convert files structure to pass to sandbox
  const filesPayload = Object.keys(files).reduce((acc, path) => {
    acc[path] = files[path].content;
    return acc;
  }, {} as Record<string, string>);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;
      if (data.type === "PREVIEW_ERROR") {
        setRuntimeError({ source: data.source, message: data.message });
      } else if (data.type === "PREVIEW_SUCCESS") {
        setRuntimeError(null);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setRuntimeError]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      // Send the latest code files to the iframe
      iframe.contentWindow?.postMessage({
        type: "UPDATE_FILES",
        files: filesPayload,
        entryPath: "src/app/page.tsx" // standard Next.js page
      }, "*");
    };

    iframe.addEventListener("load", handleLoad);
    
    // If iframe already loaded, send files directly
    iframe.contentWindow?.postMessage({
      type: "UPDATE_FILES",
      files: filesPayload,
      entryPath: "src/app/page.tsx"
    }, "*");

    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, [filesPayload, iframeKey]);

  // Construct iframe dimension styling
  const getDeviceClass = () => {
    switch (devicePreview) {
      case "mobile":
        return "w-[360px] h-[640px] rounded-2xl border-4 border-zinc-800 shadow-2xl";
      case "tablet":
        return "w-[768px] h-[1024px] rounded-2xl border-4 border-zinc-800 shadow-2xl";
      default:
        return "w-full h-full border-0";
    }
  };

  // In-browser compiler/bundler running inside iframe srcdoc
  const srcdoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Opviber App Preview</title>
      
      <!-- Load tailwind utility -->
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              colors: {
                border: "hsl(240 5.9% 90%)",
                input: "hsl(240 5.9% 90%)",
                ring: "hsl(240 5.9% 10%)",
                background: "hsl(0 0% 100%)",
                foreground: "hsl(240 10% 3.9%)",
                primary: {
                  DEFAULT: "hsl(240 5.9% 10%)",
                  foreground: "hsl(0 0% 98%)",
                },
                secondary: {
                  DEFAULT: "hsl(240 4.8% 95.9%)",
                  foreground: "hsl(240 5.9% 10%)",
                },
                destructive: {
                  DEFAULT: "hsl(0 84.2% 60.2%)",
                  foreground: "hsl(0 0% 98%)",
                },
                muted: {
                  DEFAULT: "hsl(240 4.8% 95.9%)",
                  foreground: "hsl(240 3.8% 46.1%)",
                },
                accent: {
                  DEFAULT: "hsl(240 4.8% 95.9%)",
                  foreground: "hsl(240 5.9% 10%)",
                },
                popover: {
                  DEFAULT: "hsl(0 0% 100%)",
                  foreground: "hsl(240 10% 3.9%)",
                },
                card: {
                  DEFAULT: "hsl(0 0% 100%)",
                  foreground: "hsl(240 10% 3.9%)",
                },
              }
            }
          }
        }
      </script>

      <!-- Load React, ReactDOM and Babel Standalone from CDN -->
      <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

      <!-- Load Lucide icons from ESM -->
      <script type="module">
        import * as lucideReact from 'https://esm.sh/lucide-react';
        window.LucideReact = lucideReact;
      </script>

      <style>
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #09090b;
          color: #fafafa;
        }
        /* Custom scrollbars */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #09090b;
        }
        ::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 3px;
        }
      </style>
    </head>
    <body class="bg-zinc-950 text-white min-h-screen">
      <div id="root" class="min-h-screen">
        <div class="flex items-center justify-center min-h-screen text-zinc-550 text-sm">
          <span>Loading app modules...</span>
        </div>
      </div>

      <script>
        // Global error handlers
        window.onerror = function(message, source, lineno, colno, error) {
          const cleanSource = source ? (source.includes("src/") ? "src/" + source.split("src/")[1] : source.split("/").pop()) : "runtime";
          const errMessage = error ? error.message : message;
          const displayMsg = errMessage + (lineno ? " (at " + cleanSource + ":" + lineno + ":" + colno + ")" : "");
          window.parent.postMessage({
            type: "PREVIEW_ERROR",
            source: cleanSource,
            message: displayMsg
          }, "*");
          return false;
        };

        window.addEventListener("unhandledrejection", function(event) {
          const reason = event.reason;
          const msg = reason instanceof Error ? reason.message : String(reason);
          window.parent.postMessage({
            type: "PREVIEW_ERROR",
            source: "Promise Rejection",
            message: msg
          }, "*");
        });

        // Simple in-browser Virtual Module System
        window.__modules = {};
        window.__files = {};
        window.__exportsCache = {};

        // Module loader
        function requireModule(path) {
          // Resolve relative path imports e.g. "./Navbar" -> "src/components/Navbar"
          const resolvedPath = resolvePath(path);

          if (window.__exportsCache[resolvedPath]) {
            return window.__exportsCache[resolvedPath];
          }

          // Handle third party libraries
          if (path === "react") {
            return window.React;
          }
          if (path === "react-dom" || path === "react-dom/client") {
            return {
              createRoot: window.ReactDOM.createRoot,
              render: window.ReactDOM.render
            };
          }
          if (path === "lucide-react") {
            return window.LucideReact || {};
          }

          // Find file in workspace
          const fileContent = findFile(resolvedPath);
          if (!fileContent) {
            console.warn("Module not found: " + path + " (Resolved: " + resolvedPath + ")");
            return {};
          }

          // Compile code using Babel standalone
          try {
            const cleanCode = fileContent.replace(/^["']use client["'];?\\n?/, "");
            const transformed = Babel.transform(cleanCode, {
              presets: ["env", "react", "typescript"],
              filename: resolvedPath
            }).code;

            const moduleExports = {};
            const moduleObj = { exports: moduleExports };
            
            // Execute module function
            const runFn = new Function("exports", "require", "module", transformed);
            runFn(moduleExports, requireModule, moduleObj);

            window.__exportsCache[resolvedPath] = moduleObj.exports;
            return moduleObj.exports;
          } catch (err) {
            console.error("Compile error in: " + resolvedPath, err);
            // Render compiler error panel
            renderError(resolvedPath, err.message);
            throw err;
          }
        }

        function resolvePath(path) {
          if (!path.startsWith(".")) return path;

          // Default resolve for pages / components
          if (path.startsWith("@/")) {
            const clean = path.slice(2);
            return "src/" + clean;
          }

          // Relative resolver
          return path.replace(/^\\.\\//, "src/components/").replace(/^\\.\\.\\//, "src/");
        }

        function findFile(resolvedPath) {
          const extensions = ["", ".tsx", ".ts", ".jsx", ".js"];
          for (const ext of extensions) {
            const p = resolvedPath + ext;
            if (window.__files[p]) return window.__files[p];
            // Match with exact src prefix
            if (window.__files["src/" + p]) return window.__files["src/" + p];
          }
          // Search flat match
          const keys = Object.keys(window.__files);
          const match = keys.find(k => k.endsWith(resolvedPath) || k.endsWith(resolvedPath + ".tsx") || k.endsWith(resolvedPath + ".ts"));
          return match ? window.__files[match] : null;
        }

        function renderError(filename, message) {
          window.parent.postMessage({
            type: "PREVIEW_ERROR",
            source: filename,
            message: message
          }, "*");
          const root = document.getElementById("root");
          root.innerHTML = \`
            <div class="p-6 bg-red-950/20 border border-red-500/30 rounded-lg max-w-2xl mx-auto my-12">
              <h3 class="text-red-500 font-bold mb-2">Build Compilation Error</h3>
              <p class="text-xs text-zinc-400 font-mono mb-4">File: \${filename}</p>
              <pre class="bg-zinc-950 p-4 rounded text-xs text-red-400 border border-zinc-900 font-mono overflow-auto max-h-[300px] whitespace-pre-wrap">\${message}</pre>
              <button onclick="window.location.reload()" class="mt-4 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold">
                Retry Build
              </button>
            </div>
          \`;
        }

        // Render project entrypoint
        function runApplication(entryPath) {
          try {
            window.__exportsCache = {}; // clear cache
            const entryExports = requireModule(entryPath);
            const RootComponent = entryExports.default || entryExports.App;

            if (!RootComponent) {
              throw new Error("No default export or App export found in entrypath: " + entryPath);
            }

            const container = document.getElementById("root");
            const root = ReactDOM.createRoot(container);
            root.render(React.createElement(RootComponent));
            
            // Post success to parent
            window.parent.postMessage({ type: "PREVIEW_SUCCESS" }, "*");
          } catch (err) {
            console.error("Initialization error", err);
            window.parent.postMessage({
              type: "PREVIEW_ERROR",
              source: entryPath,
              message: err.message
            }, "*");
          }
        }

        // Listen for files payload from workspace
        window.addEventListener("message", (event) => {
          const data = event.data;
          if (data && data.type === "UPDATE_FILES") {
            window.__files = data.files;
            runApplication(data.entryPath);
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <div className="flex flex-col h-full bg-zinc-950/20">
      {/* Device Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/40 h-9 px-2 text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className={`h-7 w-7 ${devicePreview === "desktop" ? "text-violet-400 bg-zinc-900" : "text-zinc-400"}`}
            onClick={() => setDevicePreview("desktop")}
            title="Desktop view"
          >
            <Laptop size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={`h-7 w-7 ${devicePreview === "tablet" ? "text-violet-400 bg-zinc-900" : "text-zinc-400"}`}
            onClick={() => setDevicePreview("tablet")}
            title="Tablet view"
          >
            <Tablet size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={`h-7 w-7 ${devicePreview === "mobile" ? "text-violet-400 bg-zinc-900" : "text-zinc-400"}`}
            onClick={() => setDevicePreview("mobile")}
            title="Mobile view"
          >
            <Smartphone size={14} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={reloadIframe}
            className="h-7 w-7 text-zinc-400 hover:text-white"
            title="Refresh preview"
          >
            <RefreshCw size={12} />
          </Button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-zinc-950/40">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          srcDoc={srcdoc}
          sandbox="allow-scripts allow-same-origin allow-modals"
          className={`bg-zinc-950 shadow-2xl transition-all duration-300 ${getDeviceClass()}`}
        />
      </div>
    </div>
  );
}
