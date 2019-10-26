import Fuse from 'fuse.js';
import { Study } from 'common';

export interface SearchItem {
  id: string;
  title: string;
  study: Study | undefined;
  extra: string[];
}

const keys: Array<keyof SearchItem> = ['extra', 'title', 'id'];

export const search = (items: SearchItem[], pattern: string) => {
  if (pattern.trim() === '') {
    return items;
  }

  const fuse = new Fuse(items, { keys });
  return fuse.search(pattern);
};
