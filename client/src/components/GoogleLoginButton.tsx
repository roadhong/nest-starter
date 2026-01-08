import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import userStore from '@root/common/store/UserStore';
import ServerApi from '@root/common/util/server.api';
import { ReqGoogleLogin } from 'nestjs-api-axios';
import { ReactElement } from 'react';

export interface GoogleLoginProps {
  useOneTap?: boolean;
}

export function GoogleLoginButton(props: GoogleLoginProps): ReactElement {
  const { useOneTap = false } = props;

  return (
    <GoogleLogin
      cancel_on_tap_outside={false}
      useOneTap={useOneTap}
      onSuccess={async function (credentialResponse: CredentialResponse): Promise<void> {
        const params: ReqGoogleLogin = {
          token: credentialResponse.credential ?? '',
        };
        const response = await ServerApi.Google.googleControllerGoogleLogin(params);
        if (response.data.data) {
          const profile = response.data.data.profile as any;
          ServerApi.headers['Authorization'] = `Bearer ${response.data.data.jwt.access_token}`;
          userStore.setUser({
            email: profile?.email ?? '',
            name: profile?.name ?? '',
            role: Number(response.data.data.role),
          });
        }
      }}
    ></GoogleLogin>
  );
}
