import Fuse from 'fuse.js';

export interface SearchItem {
  id: string;
  title: string;
  type: string;
  model: number | undefined;
  information: string[];
}


const options: Fuse.FuseOptions<SearchItem> = {
  keys: ['information', 'title', 'id'],
};

export const search = (items: SearchItem[], pattern: string) => {
  if (pattern.trim() === '') {
    return items;
  }

  const fuse = new Fuse(items, options);
  return fuse.search(pattern);
};
