import type { IconButtonProps } from '@mui/material/IconButton';

import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';

import { usePathname, useRouter } from '@root/views/pages/management/material-kit/routes/hooks';

import ServerApi from '@root/common/util/server.api';
import userStore, { ROLE } from '@root/common/store/UserStore';
import { GoogleLoginButton } from '@root/components/GoogleLoginButton';

// ----------------------------------------------------------------------

export type AccountPopoverProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

export const AccountPopover = observer(({ data = [], sx, ...other }: AccountPopoverProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleClickItem = useCallback(
    (path: string) => {
      handleClosePopover();
      router.push(path);
    },
    [handleClosePopover, router],
  );

  const handleLogout = async () => {
    setOpenPopover(null);

    await ServerApi.Account.accountControllerLogout();
    userStore.clearUser();
    console.log('Logged out');
  };

  return (
    <>
      {!userStore.user ? (
        <Box sx={{ p: 1 }}>
          <GoogleLoginButton useOneTap />
        </Box>
      ) : (
        <>
          <IconButton
            onClick={handleOpenPopover}
            sx={{
              p: '2px',
              width: 40,
              height: 40,
              background: (theme) => `conic-gradient(${theme.vars.palette.primary.light}, ${theme.vars.palette.warning.light}, ${theme.vars.palette.primary.light})`,
              ...sx,
            }}
            {...other}
          >
            {userStore.user.name.charAt(0).toUpperCase()}
          </IconButton>

          <Popover
            open={!!openPopover}
            anchorEl={openPopover}
            onClose={handleClosePopover}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: { width: 300 },
              },
            }}
          >
            <Box sx={{ p: 2, pb: 1.5 }}>
              <Typography variant="subtitle2" noWrap>
                {userStore.user.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                {userStore.user.email}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                {ROLE[userStore.user.role]}
              </Typography>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <MenuList
              disablePadding
              sx={{
                p: 1,
                gap: 0.5,
                display: 'flex',
                flexDirection: 'column',
                [`& .${menuItemClasses.root}`]: {
                  px: 1,
                  gap: 2,
                  borderRadius: 0.75,
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                  [`&.${menuItemClasses.selected}`]: {
                    color: 'text.primary',
                    bgcolor: 'action.selected',
                    fontWeight: 'fontWeightSemiBold',
                  },
                },
              }}
            >
              {data.map((option) => (
                <MenuItem key={option.label} selected={option.href === pathname} onClick={() => handleClickItem(option.href)}>
                  {option.label}
                </MenuItem>
              ))}
            </MenuList>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <Box sx={{ p: 1 }}>
              <Button fullWidth color="error" size="medium" variant="text" onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          </Popover>
        </>
      )}
    </>
  );
});
