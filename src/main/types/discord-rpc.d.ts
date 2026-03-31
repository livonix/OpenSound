declare module 'discord-rpc' {
  export interface Client {
    on(event: string, listener: (...args: any[]) => void): void;
    login(options: { clientId: string }): Promise<void>;
    setActivity(activity: Activity): Promise<void>;
    clearActivity(): Promise<void>;
    destroy(): Promise<void>;
  }

  export interface Activity {
    details?: string;
    state?: string;
    largeImageKey?: string;
    largeImageText?: string;
    smallImageKey?: string;
    smallImageText?: string;
    startTimestamp?: number;
    endTimestamp?: number;
    instance?: boolean;
    buttons?: Button[];
  }

  export interface Button {
    label: string;
    url: string;
  }

  export class Client {
    constructor(options: { transport: 'ipc' });
  }
}
