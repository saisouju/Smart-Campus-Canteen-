import LogoutRounded from '@mui/icons-material/LogoutRounded';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import type { User } from '@canteen/shared';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export interface UserMenuProps {
  user: User;
  onSignOut: () => void;
}

/** Avatar button with the signed-in identity and a sign-out action. */
export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Account: ${user.name}`} size="small">
        <Avatar className="size-9 bg-brand text-sm font-bold text-white dark:text-stone-900">{initials(user.name)}</Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <div className="px-4 py-2">
          <p className="font-semibold">{user.name}</p>
          <p className="text-xs text-ink-muted">{user.email}</p>
          <p className="mt-1 text-xs font-semibold text-brand capitalize">{user.role}</p>
        </div>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onSignOut();
          }}
        >
          <ListItemIcon>
            <LogoutRounded fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
