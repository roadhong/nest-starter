class ServerConfig {
  static server_name: string;
  static zone: string;
  static api_url: string;
  static batch_url: string;
  static socket_url: string;
  static mq_url: string;

  static {
    this.server_name = import.meta.env.VITE_SERVER_NAME;
    this.zone = import.meta.env.VITE_ZONE;
    this.api_url = import.meta.env.VITE_SERVER_API_URL;
    this.batch_url = import.meta.env.VITE_SERVER_BATCH_URL;
    this.socket_url = import.meta.env.VITE_SERVER_SOCKET_URL;
    this.mq_url = import.meta.env.VITE_SERVER_MQ_URL;
  }
}

export default ServerConfig;
