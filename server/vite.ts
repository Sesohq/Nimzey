import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions: any = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      // Per-route SEO meta injection for crawlers
      template = injectRouteMeta(template, url);

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

/**
 * Inject route-specific meta tags for better SEO per page.
 * Replaces the default title/description with route-appropriate ones.
 */
function injectRouteMeta(html: string, url: string): string {
  if (url.startsWith('/textures')) {
    html = html.replace(
      '<title>NIMZEY - Free Procedural Texture Generator | Noise, Grunge & Abstract Textures</title>',
      '<title>Free Texture Library - 150+ Procedural Noise, Grunge & Abstract Textures | NIMZEY</title>',
    );
    html = html.replace(
      'content="Create unique procedural textures with Nimzey\'s node-based texture editor. Browse 150+ free noise, grunge, abstract, and organic textures. Download high-res 4K PNGs instantly."',
      'content="Browse and download 150+ free procedural textures. Noise, grunge, abstract, organic, geometric, and cosmic textures available in 4K resolution. Create your own with the node editor."',
    );
  }
  return html;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  // Apply per-route meta injection for SEO
  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    let html = fs.readFileSync(indexPath, "utf-8");
    html = injectRouteMeta(html, req.originalUrl);
    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  });
}
