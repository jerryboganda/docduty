declare module 'pusher-js' {
  interface Channel {
    bind(event: string, callback: (data: any) => void): this;
    unbind(event: string, callback?: (data: any) => void): this;
  }

  interface ConnectionManager {
    bind(event: string, callback: (data?: any) => void): void;
  }

  interface Options {
    wsHost?: string;
    wsPort?: number;
    wssPort?: number;
    forceTLS?: boolean;
    disableStats?: boolean;
    enabledTransports?: string[];
    cluster?: string;
  }

  class Pusher {
    connection: ConnectionManager;
    constructor(key: string, options?: Options);
    subscribe(channelName: string): Channel;
    unsubscribe(channelName: string): void;
    disconnect(): void;
  }

  export default Pusher;
}

declare module 'pusher' {
  interface Options {
    appId: string;
    key: string;
    secret: string;
    host?: string;
    port?: string;
    useTLS?: boolean;
    cluster?: string;
  }

  class Pusher {
    constructor(options: Options);
    trigger(channel: string, event: string, data: Record<string, any>): Promise<any>;
  }

  export default Pusher;
}
