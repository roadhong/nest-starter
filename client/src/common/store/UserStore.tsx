import { makeAutoObservable } from 'mobx';

export enum ROLE {
  GUEST = 0,
  USER = 1,
  ADMIN = 100,
}

export interface User {
  name: string;
  email: string;
  role: ROLE;
}

export interface PlatformInfo {
  google: {
    client_id: string;
    client_email: string;
  };
}

class UserStore {
  user: User | undefined;
  platformInfo: PlatformInfo | undefined;

  constructor() {
    makeAutoObservable(this);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (e) {
        this.user = undefined;
      }
    }
  }

  setUser(user: User) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearUser() {
    this.user = undefined;
    localStorage.removeItem('user');
  }

  setPlatformInfo(platformInfo: PlatformInfo) {
    this.platformInfo = platformInfo;
  }
}

const userStore = new UserStore();
export default userStore;
