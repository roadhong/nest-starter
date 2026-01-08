import { CONFIG } from '@root/views/pages/management/material-kit/config-global';

import { Box, Typography } from '@mui/material';
import { GoogleLoginButton } from '@root/components/GoogleLoginButton';

// ----------------------------------------------------------------------

export default function PageLoginRequest() {
  return (
    <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <title>{`Login Required - ${CONFIG.appName}`}</title>
      <Typography variant="h2" color="primary" gutterBottom>
        Login Required
      </Typography>
      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        이 페이지를 보려면 로그인이 필요합니다.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <GoogleLoginButton />
      </Box>
    </Box>
  );
}
