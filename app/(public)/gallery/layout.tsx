import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery — Thirst.',
  description: 'Take a visual journey through our beautifully crafted desserts, shakes, and cafe atmosphere.',
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
