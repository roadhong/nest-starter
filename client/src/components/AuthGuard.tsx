import userStore, { ROLE } from '@root/common/store/UserStore';
import Forbidden from '@root/components/Forbidden';
import { observer } from 'mobx-react-lite';

const AuthGuard = observer(async ({ children, requiredRole, returnPage }: { children: React.ReactNode; requiredRole?: ROLE; returnPage?: React.ReactNode }) => {
  if (!userStore.user) return returnPage;
  if (requiredRole && (!userStore.user?.role || userStore.user.role < requiredRole)) return <Forbidden requiredRole={requiredRole} />;

  return <div>{children}</div>;
});

export default AuthGuard;
