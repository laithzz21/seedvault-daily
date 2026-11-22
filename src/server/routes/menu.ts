import { Hono } from 'hono';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';

export const menuRouter = new Hono();

/**
 * The response shape Devvit menu actions understand: a toast and/or a
 * navigation for the moderator who tapped the menu item.
 */
type MenuActionResponse = {
  showToast?: { text: string; appearance?: 'neutral' | 'success' };
  navigateTo?: string;
};

/**
 * POST /internal/menu/post-create — moderator menu action ("Create today's
 * garden post"). Creates the daily post and takes the moderator to it.
 */
menuRouter.post('/post-create', async (c) => {
  const permalink = await createPost(context.subredditName);
  const response: MenuActionResponse = {
    showToast: {
      text: "Today's garden post is live!",
      appearance: 'success',
    },
    navigateTo: permalink,
  };
  return c.json(response);
});
