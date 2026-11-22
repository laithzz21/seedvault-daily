import { Hono } from 'hono';
import { menuRouter } from './menu';
import { triggersRouter } from './triggers';

export const internalRouter = new Hono();

internalRouter.route('/menu', menuRouter);
internalRouter.route('/triggers', triggersRouter);
