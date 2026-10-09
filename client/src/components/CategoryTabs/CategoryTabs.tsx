import RestaurantMenuRounded from '@mui/icons-material/RestaurantMenuRounded';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { MENU_CATEGORIES, type MenuCategory } from '@canteen/shared';
import { CATEGORY_META } from '../categoryMeta';

export type CategoryFilter = MenuCategory | 'All';

export interface CategoryTabsProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
  /** Optional item counts shown beside each label. */
  counts?: Partial<Record<CategoryFilter, number>>;
}

export function CategoryTabs({ value, onChange, counts }: CategoryTabsProps) {
  const label = (name: CategoryFilter) => (counts?.[name] === undefined ? name : `${name} · ${counts[name]}`);
  return (
    <Tabs
      value={value}
      onChange={(_, v: CategoryFilter) => onChange(v)}
      variant="scrollable"
      allowScrollButtonsMobile
      aria-label="Menu categories"
    >
      <Tab value="All" label={label('All')} icon={<RestaurantMenuRounded />} iconPosition="start" />
      {MENU_CATEGORIES.map((c) => {
        const Icon = CATEGORY_META[c].icon;
        return <Tab key={c} value={c} label={label(c)} icon={<Icon />} iconPosition="start" />;
      })}
    </Tabs>
  );
}
