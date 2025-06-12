import { User } from '@entities/users/users.entity';

declare module 'express' {
  interface Request {
    user?: User;
  }
}
