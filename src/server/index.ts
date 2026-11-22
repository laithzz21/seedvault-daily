import { createServer, getServerPort } from '@devvit/web/server';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { apiRouter } from './routes/api';
import { internalRouter } from './routes/internal';

const app = new Hono();

app.route('/api', apiRouter);
app.route('/internal', internalRouter);

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
