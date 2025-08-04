declare module 'imagemagick-cli' {
    export function convert(options: {
      srcData: Buffer;
      args: string[];
      format?: 'buffer' | 'string';
    }): Promise<{ stdout: Buffer | string; stderr: string }>;
  }