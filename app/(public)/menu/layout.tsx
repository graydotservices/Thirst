import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu — Thirst.',
  description: 'Explore our premium menu of artisan thick shakes, dream cakes, biscoff waffles, and signature crushers.',
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
