import { beforeEach } from 'vitest';
import { ensureAnnouncer } from '../lib/drag/announce';

export function withAnnouncer(): void {
  beforeEach(() => {
    ensureAnnouncer();
  });
}
