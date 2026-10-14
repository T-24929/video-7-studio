export interface Film {
  id: string
  title: string
  category: string
  description: string
  thumbnail: string
  source: string
}

// Titles and channel ownership verified with YouTube oEmbed on 2026-10-14.
// Both films belong to https://www.youtube.com/@Video7Cinematography.
export const films: Film[] = [
  {
    id: 'jRa2TubVWxE',
    title: 'Chami & Sahan',
    category: 'Wedding film',
    description: 'A celebration of love, told through the little moments.',
    thumbnail: 'https://i.ytimg.com/vi/jRa2TubVWxE/hqdefault.jpg',
    source: 'https://www.youtube.com/watch?v=jRa2TubVWxE',
  },
  {
    id: 'zIYkXyZzsI8',
    title: 'Dilki & Randika',
    category: 'Pre-wedding story',
    description: 'The beautiful beginning of a lifetime together.',
    thumbnail: 'https://i.ytimg.com/vi/zIYkXyZzsI8/hqdefault.jpg',
    source: 'https://www.youtube.com/watch?v=zIYkXyZzsI8',
  },
]
