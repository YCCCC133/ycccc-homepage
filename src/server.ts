import { createServer } from 'http';
import next from 'next';

const isProd = process.env.NODE_ENV === 'production';
const dev = !isProd;
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.DEPLOY_RUN_PORT || process.env.PORT || '5000', 10);

console.log(`[server] Starting with NODE_ENV=${process.env.NODE_ENV}, dev=${dev}`);
console.log(`[server] Environment diagnostics:`);
console.log(`  COZE_SUPABASE_URL: ${process.env.COZE_SUPABASE_URL ? 'SET' : 'NOT_SET'}`);
console.log(`  COZE_SUPABASE_ANON_KEY: ${process.env.COZE_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'}`);
console.log(`  COZE_SUPABASE_SERVICE_ROLE_KEY: ${process.env.COZE_SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET'}`);
console.log(`  COZE_WORKSPACE_PATH: ${process.env.COZE_WORKSPACE_PATH || 'NOT_SET'}`);
console.log(`  DEPLOY_RUN_PORT: ${process.env.DEPLOY_RUN_PORT || 'NOT_SET'}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Internal Server Error');
      }
    }
  });

  server.setTimeout(30000);

  server.once('error', err => {
    console.error('Server error:', err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${dev ? 'development' : 'production'}`,
    );
  });
});
