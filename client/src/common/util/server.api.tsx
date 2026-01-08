import ServerConfig from '@root/common/config/server.config';
import MessageUtil from '@root/common/util/message.util';
import axios from 'axios';
import { AccountApi, AdminApi, AppApi, AuthApi, Configuration, CronApi, GoogleApi, UserApi } from 'nestjs-api-axios';

export default class ServerApi {
  static headers: Record<string, string> = {};
  static App: AppApi;
  static Account: AccountApi;
  static Admin: AdminApi;
  static Auth: AuthApi;
  static Cron: CronApi;
  static Google: GoogleApi;
  static User: UserApi;

  static logout: () => Promise<void>;

  static setLogout(logout: () => Promise<void>) {
    ServerApi.logout = logout;
  }

  static init() {
    const configuration = new Configuration();
    configuration.baseOptions = {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    };

    const requestInterceptor = async (config: any) => {
      config.headers = {
        ...config.headers,
        ...ServerApi.headers,
      };

      return config;
    };

    const responseInterceptor = async (response: any) => {
      const originalRequest = response.config as any;

      if (response.data?.error?.message === 'invalid or expired refresh token' && !originalRequest?._retry) {
        originalRequest._retry = true;
        alert('세션 만료');

        return response;
      } else if (response.data?.error?.message === 'invalid or expired token' && !originalRequest?._retry) {
        originalRequest._retry = true;
        const response = await ServerApi.Auth.authControllerTokenRefresh();
        if (response.data.data?.jwt?.access_token) {
          ServerApi.headers['Authorization'] = `Bearer ${response.data.data.jwt.access_token}`;
        }

        return axios.request(originalRequest);
      }

      if (response.data?.data) {
        MessageUtil.success(`${new URL(response.config.url).pathname} Done`);
      } else if (response.data?.error) {
        MessageUtil.error(response.data.error.message ?? 'API 요청이 실패했습니다.');
      }

      return response;
    };

    axios.interceptors.request.clear();
    axios.interceptors.response.clear();
    axios?.interceptors.request.use(requestInterceptor);
    axios?.interceptors.response.use(responseInterceptor);

    //api server
    ServerApi.App = new AppApi(configuration, ServerConfig.api_url, axios);
    ServerApi.Account = new AccountApi(configuration, ServerConfig.api_url, axios);
    ServerApi.Admin = new AdminApi(configuration, ServerConfig.api_url, axios);
    ServerApi.Auth = new AuthApi(configuration, ServerConfig.api_url, axios);
    ServerApi.Google = new GoogleApi(configuration, ServerConfig.api_url, axios);
    ServerApi.User = new UserApi(configuration, ServerConfig.api_url, axios);

    //batch server
    ServerApi.Cron = new CronApi(configuration, ServerConfig.batch_url, axios);
  }
}

ServerApi.init();
