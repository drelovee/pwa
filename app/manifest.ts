import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SkillCrew',
    short_name: 'SkillCrew',
    description: 'PWA marketplace for customers, executors and teams',
    start_url: '/app/home',
    display: 'standalone',
    background_color: '#070b14',
    theme_color: '#070b14',
    icons: [
      { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }
    ]
  };
}
