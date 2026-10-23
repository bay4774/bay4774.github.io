import type { CollectionEntry } from 'astro:content';

export function directionChapters(entries: CollectionEntry<'notes'>[], track: string) {
  return entries.filter(entry => !entry.data.draft && entry.data.directionTrack === track)
    .sort((a, b) => (a.data.directionChapter ?? Infinity) - (b.data.directionChapter ?? Infinity));
}
