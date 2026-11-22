import { reddit } from '@devvit/web/server';
import { generatePuzzle, todayDateString } from '../../shared/game';

/**
 * Create today's garden post in a subreddit. The post carries the date in
 * its post data; the puzzle itself is derived from the date, so every
 * player sees the same bed and hand. Returns the post's permalink.
 */
export const createPost = async (subredditName: string): Promise<string> => {
  const date = todayDateString();
  const puzzle = generatePuzzle(date);
  const plantCount = puzzle.hand.length;
  const post = await reddit.submitCustomPost({
    subredditName,
    title: `🌱 Seedvault — ${date}: today's garden is ready`,
    postData: { date },
    textFallback: {
      text: `Seedvault — a tiny garden, a new puzzle every day. Plant today's hand of ${plantCount} seeds on the 5x5 bed and grow the best garden you can. Open this post in the Reddit app or on new reddit to play.`,
    },
  });
  return post.permalink;
};
