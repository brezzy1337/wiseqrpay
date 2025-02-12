import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/server';

export const trpc = createTRPCReact<AppRouter>();
export type RouterInput = AppRouter['_def']['mutations'];
export type RouterOutput = AppRouter['_def']['queries'];
