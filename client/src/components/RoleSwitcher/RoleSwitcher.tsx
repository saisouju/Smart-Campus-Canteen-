import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded';
import RestaurantMenuRounded from '@mui/icons-material/RestaurantMenuRounded';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export type RoleView = 'customer' | 'admin';

export interface RoleSwitcherProps {
  view: RoleView;
  onViewChange: (view: RoleView) => void;
}

/** Shown to admins only: switch between running the canteen and ordering as a customer. */
export function RoleSwitcher({ view, onViewChange }: RoleSwitcherProps) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      color="primary"
      value={view}
      onChange={(_, v: RoleView | null) => v && onViewChange(v)}
      aria-label="Switch view"
    >
      <ToggleButton value="admin" className="gap-1.5 px-3">
        <AdminPanelSettingsRounded fontSize="small" /> Admin
      </ToggleButton>
      <ToggleButton value="customer" className="gap-1.5 px-3">
        <RestaurantMenuRounded fontSize="small" /> Order food
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
