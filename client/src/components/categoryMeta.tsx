import FastfoodOutlined from '@mui/icons-material/FastfoodOutlined';
import BreakfastDiningOutlined from '@mui/icons-material/BreakfastDiningOutlined';
import LocalCafeOutlined from '@mui/icons-material/LocalCafeOutlined';
import RiceBowlOutlined from '@mui/icons-material/RiceBowlOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import type { MenuCategory } from '@canteen/shared';

/** Visual identity per menu category, used by cards, tabs and forms. */
export const CATEGORY_META: Record<MenuCategory, { icon: SvgIconComponent; tile: string; blurb: string }> = {
  Breakfast: { icon: BreakfastDiningOutlined, tile: 'from-amber-100 to-orange-200 text-orange-800 dark:from-amber-950 dark:to-orange-900 dark:text-orange-200', blurb: 'Served 8 – 11 AM' },
  Lunch: { icon: RiceBowlOutlined, tile: 'from-lime-100 to-emerald-200 text-emerald-800 dark:from-lime-950 dark:to-emerald-900 dark:text-emerald-200', blurb: 'Served 12 – 3 PM' },
  Snacks: { icon: FastfoodOutlined, tile: 'from-rose-100 to-orange-200 text-rose-800 dark:from-rose-950 dark:to-orange-900 dark:text-rose-200', blurb: 'All day' },
  Drinks: { icon: LocalCafeOutlined, tile: 'from-sky-100 to-teal-200 text-teal-800 dark:from-sky-950 dark:to-teal-900 dark:text-teal-200', blurb: 'Hot & cold, all day' },
};
