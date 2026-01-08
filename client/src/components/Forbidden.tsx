import { CONFIG } from '@root/views/pages/management/material-kit/config-global';

import { Box, Button, Typography } from '@mui/material';
import { ROLE } from '@root/common/store/UserStore';
import ServerApi from '@root/common/util/server.api';

// ----------------------------------------------------------------------

export default function Forbidden({ requiredRole }: { requiredRole?: ROLE }) {
  const handleRequestAccess = async () => {
    await ServerApi.User.userControllerRequestRoleUpdate({
      role: Number(requiredRole),
    });
  };

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <title>{`403 Forbidden - ${CONFIG.appName}`}</title>
      <Typography variant="h2" color="error" gutterBottom>
        403 Forbidden
      </Typography>
      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        이 페이지에 접근할 권한이 없습니다.
      </Typography>
      {requiredRole && requiredRole < ROLE.ADMIN && (
        <Button variant="contained" color="primary" sx={{ mt: 4 }} onClick={handleRequestAccess}>
          권한 요청
        </Button>
      )}
    </Box>
  );
}
