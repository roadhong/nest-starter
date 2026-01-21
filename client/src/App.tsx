import { Box, LinearProgress, linearProgressClasses } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ServerApi from '@root/common/util/server.api';
import { varAlpha } from 'minimal-shared/utils';
import { observer } from 'mobx-react-lite';
import { lazy, ReactElement, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppProviders from './components/context/AppProvider';
import userStore, { PlatformInfo } from '@root/common/store/UserStore';

const PageServerError = lazy(async () => import('@root/views/pages/management/material-kit/pages/page-server-error'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

const App = observer((): ReactElement => {
  const getRoutes = async () => {
    const platformInfo = await ServerApi.App.appControllerGetPlatformInfo();
    const info: PlatformInfo = {
      google: {
        client_id: platformInfo.data.platform.google.client_id ?? '',
        client_email: platformInfo.data.platform.google.client_email ?? '',
      },
    };
    userStore.setPlatformInfo(info);

    ServerApi.setLogout(async () => {
      try {
        await ServerApi.Account.accountControllerLogout();
        userStore.clearUser();
      } catch (error) {
        console.error('Logout failed:', error);
      }
    });

    const { routesSection } = await import('@root/views/pages/management/material-kit/routes/sections');

    return (
      <GoogleOAuthProvider clientId={userStore.platformInfo?.google?.client_id || ''}>
        <Routes>
          {userStore.platformInfo?.google?.client_id ? (
            routesSection.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} caseSensitive={route.caseSensitive}>
                {route.children?.map((child, childIndex) => (
                  <Route key={childIndex} path={child.path} element={child.element} caseSensitive={child.caseSensitive} />
                ))}
              </Route>
            ))
          ) : (
            <Route path="*" element={<PageServerError />} />
          )}
        </Routes>
      </GoogleOAuthProvider>
    );
  };

  return (
    <BrowserRouter>
      <Suspense fallback={renderFallback()}>
        <AppProviders>{getRoutes()}</AppProviders>
      </Suspense>
    </BrowserRouter>
  );
});

export default App;
