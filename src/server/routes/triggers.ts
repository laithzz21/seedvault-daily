import { Hono } from 'hono';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';

export const triggersRouter = new Hono();

/**
 * POST /internal/triggers/on-app-install — when the app is installed in a
 * subreddit, seed it with today's garden post right away.
 */
triggersRouter.post('/on-app-install', async (c) => {
  await createPost(context.subredditName);
  return c.json({ status: 'ok' });
});
