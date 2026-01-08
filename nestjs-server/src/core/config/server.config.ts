import { SERVER_TYPE, ZONE_TYPE } from '@root/core/define/core.define';
import * as fs from 'fs';
import * as path from 'path';

class ServerConfig {
  static zone: string = ZONE_TYPE.LOCAL;
  static server_type: string = SERVER_TYPE.NONE;
  static throttler: ThorttlerConfig[] = [];
  static dev: boolean = true;
  static service: ServiceConfig = {
    name: '',
  };

  static jwt: JwtConfig = {
    key: '',
    ttl_access_sec: 0,
    ttl_refresh_sec: 0,
    type: '',
  };

  static server_info: ServerInfo = {
    api: { port: 20000 },
    batch: { port: 30000 },
    socket: { port: 40000 },
    mq: { port: 50000 },
  };

  static swagger: SwaggerConfig = {
    active: false,
    servers: {},
  };

  static paths: PathConfig = {
    root: '',
    env: '',
  };

  static platform: PlatformConfig = {
    google: { client_id: '' },
    slack: {
      token: '',
      signing_secret: '',
      channel_id: '',
    },
  };

  static db: DBConfig = {
    mongo: {
      active: false,
      host: '',
      port: 0,
      auth_source: '',
      db_name: 'global',
      user_name: 'admin',
      password: 'admin',
      min_pool_size: 0,
      max_pool_size: 10,
      use_tls: false,
    },
    redis: {
      active: false,
      host: '',
      port: 0,
      db_name: '',
      user_name: '',
      password: '',
      tls: false,
      db: 0,
    },
  };

  static {
    this.loadConfig();
  }

  private static loadConfig(): void {
    this.zone = process.env.zone ?? ZONE_TYPE.NONE;
    this.server_type = process.env.server_type ?? SERVER_TYPE.NONE;
    this.paths.root = path.join(__dirname, '..', '..', '..');
    const isDist = __dirname.includes('dist');
    if (isDist) {
      this.paths.env = path.join(__dirname, '..', '..', 'env');
    } else {
      this.paths.env = path.join(this.paths.root, 'dist', 'env');
    }
    if (this.zone === ZONE_TYPE.NONE) return;

    const excludes = ['name', 'prototype', 'length', 'zone', 'paths', 'server_type'];
    const configPath = path.join(this.paths.env, `${this.zone}-config.json`);
    const forceConfigPath = path.join(this.paths.env, `force-config.json`);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    let forceConfig = undefined;
    if (fs.existsSync(forceConfigPath)) {
      forceConfig = JSON.parse(fs.readFileSync(forceConfigPath, 'utf8'));
    }
    Object.keys(this).forEach((key) => {
      if (excludes.includes(key)) {
        return;
      }
      if (key in config) {
        if (forceConfig && key in forceConfig) {
          this[key] = forceConfig[key];
        } else {
          this[key] = config[key];
        }
      } else {
        throw new Error(`Config Error: Missing key '${key}' in config file.`);
      }
    });
  }
}

/**
 * 서비스 설정
 */
export interface ServiceConfig {
  name: string;
}

/**
 * 포트 설정
 */
export interface ServerInfo {
  api: {
    port: number;
  };
  batch: {
    port: number;
  };
  socket: {
    port: number;
  };
  mq: {
    port: number;
  };
}

export interface ServerUrl {
  api: string;
  socket: string;
  batch: string;
  mq: string;
}

/**
 * 스웨거 설정
 */
export interface SwaggerConfig {
  active: boolean;
  servers: Record<string, ServerUrl>;
}

/**
 * JWT 설정
 */
export interface JwtConfig {
  key: string;
  type: string;
  ttl_access_sec: number;
  ttl_refresh_sec: number;
}

/**
 * DB설정
 */
export interface DBConfig {
  mongo: MongoConfig;
  redis: RedisConfig;
}

/**
 * 몽고DB 설정
 */
export interface MongoConfig {
  active: boolean;
  host: string;
  port: number;
  auth_source: string;
  db_name: string;
  user_name: string;
  password: string;
  min_pool_size: number;
  max_pool_size: number;
  use_tls: false;
}

/**
 * Redis 설정
 */
export interface RedisConfig {
  active: boolean;
  host: string;
  port: number;
  db_name: string;
  user_name: string;
  password: string;
  tls: boolean;
  db: number;
}

/**
 * 경로 설정
 */
export interface PathConfig {
  root: string;
  env: string;
}

/**
 * 플랫폼 설정
 */
export interface PlatformConfig {
  google: {
    client_id: string;
  };
  slack: {
    token: string;
    signing_secret: string;
    channel_id: string;
  };
}

/**
 * 플랫폼 설정
 */
export interface ThorttlerConfig {
  name: string;
  ttl: number;
  limit: number;
}

export default ServerConfig;
