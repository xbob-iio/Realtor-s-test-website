import { Baby, Cat, Dog, PawPrint, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ClientDictionary as Dictionary } from '@/i18n/client-dictionary';
import { cn } from '@/lib/utils';

interface BadgeSource {
  isNew: boolean;
  childrenAllowed: boolean;
  petsAllowed: boolean;
  dogsAllowed: boolean;
  catsAllowed: boolean;
}

export function getApartmentBadges(apartment: BadgeSource, t: Dictionary) {
  const badges: {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: 'brand' | 'glass';
  }[] = [];
  if (apartment.isNew)
    badges.push({ key: 'new', label: t.apartment.badges.new, icon: Sparkles, tone: 'brand' });
  if (apartment.childrenAllowed) {
    badges.push({ key: 'children', label: t.apartment.badges.children, icon: Baby, tone: 'glass' });
  }
  if (apartment.dogsAllowed) {
    badges.push({ key: 'dog', label: t.apartment.badges.dog, icon: Dog, tone: 'glass' });
  } else if (apartment.catsAllowed) {
    badges.push({ key: 'cat', label: t.apartment.badges.cat, icon: Cat, tone: 'glass' });
  } else if (apartment.petsAllowed) {
    badges.push({ key: 'pets', label: t.apartment.badges.pets, icon: PawPrint, tone: 'glass' });
  }
  return badges;
}

export function ApartmentBadges({
  apartment,
  t,
  className,
  limit = 3,
}: {
  apartment: BadgeSource;
  t: Dictionary;
  className?: string;
  limit?: number;
}) {
  const badges = getApartmentBadges(apartment, t).slice(0, limit);
  if (!badges.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {badges.map(({ key, label, icon: Icon, tone }) => (
        <li key={key}>
          <Badge variant={tone}>
            <Icon />
            {label}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
