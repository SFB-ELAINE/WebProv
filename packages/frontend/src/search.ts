import Fuse from 'fuse.js';

export interface SearchItem {
  id: number;
  title: string;
  type: string;
  model: number;
  information: string[];
}


const options: Fuse.FuseOptions<SearchItem> = {
  keys: ['information', 'title'],
};

export const search = (items: SearchItem[], pattern: string) => {
  const fuse = new Fuse(items, options);
  return fuse.search(pattern);
};
