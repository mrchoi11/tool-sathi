declare module 'file-saver' {
  export function saveAs(data: Blob | string, filename?: string, options?: any): void;
}

declare module 'qrcode' {
  export interface QRCodeToDataURLOptions {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }

  export function toDataURL(text: string | Array<any>, options?: QRCodeToDataURLOptions): Promise<string>;
}
