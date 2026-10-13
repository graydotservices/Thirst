import MenuCatalog from '@/components/MenuCatalog';
import { publicCatalog } from '@/lib/publicCatalog';

export default async function MenuPage() {
  const catalog = await publicCatalog();
  return <MenuCatalog initialItems={catalog.items} initialError={catalog.error} />;
}
