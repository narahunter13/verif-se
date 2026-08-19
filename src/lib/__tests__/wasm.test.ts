import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { formatFileSize, compressImage } from '../wasm/wasmLoader';

const imageBuffer = readFileSync('file-6a475e3fd3f92.png');

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('should format kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(10240)).toBe('10.0 KB');
  });

  it('should format megabytes correctly', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(5242880)).toBe('5.0 MB');
    expect(formatFileSize(10485760)).toBe('10.0 MB');
  });
});

interface MockImageOpts {
  width?: number;
  height?: number;
  fail?: boolean;
}

function mockImageOnLoad(opts: MockImageOpts = {}) {
  const { width = 800, height = 600, fail = false } = opts;

  const restore = vi.fn();
  const imgSpy = vi.spyOn(window, 'Image' as any).mockImplementation(function (this: any) {
    this.width = width;
    this.height = height;
    this.onload = null;
    this.onerror = null;
    Object.defineProperty(this, 'src', {
      set() {
        const self = this;
        setTimeout(() => {
          if (fail) {
            if (self.onerror) self.onerror();
          } else {
            if (self.onload) self.onload();
          }
        }, 0);
      },
      get() { return ''; },
      configurable: true
    });
    return this;
  } as any);

  return () => imgSpy.mockRestore();
}

interface MockCanvasOpts {
  contextNull?: boolean;
  blobFail?: boolean;
  blobCallback?: (cb: BlobCallback, type: string, quality: number) => void;
}

function mockCanvasOnCreate(opts: MockCanvasOpts = {}) {
  const { contextNull = false, blobFail = false, blobCallback } = opts;

  const canvasObj: any = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => {
      if (contextNull) return null;
      return { drawImage: vi.fn() };
    }),
    toBlob: vi.fn((cb: BlobCallback, type: string, quality: number) => {
      if (blobCallback) { blobCallback(cb, type, quality); return; }
      if (blobFail) { cb(null); return; }
      const data = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      cb(new Blob([data], { type: 'image/jpeg' }));
    })
  };

  const origCreate = document.createElement.bind(document);
  const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return canvasObj;
    return origCreate(tag);
  });

  return { canvasObj, restore: () => spy.mockRestore() };
}

describe('compressImage', () => {
  let cleanups: (() => void)[] = [];

  afterEach(() => {
    cleanups.forEach((fn) => fn());
    cleanups = [];
  });

  it('should compress PNG to JPEG with valid output', async () => {
    cleanups.push(mockImageOnLoad({ width: 1920, height: 1080 }));
    const { canvasObj, restore } = mockCanvasOnCreate();
    cleanups.push(restore);

    const file = new File([imageBuffer], 'file-6a475e3fd3f92.png', { type: 'image/png' });
    const result = await compressImage(file, 80, 1280);

    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(typeof result.base64).toBe('string');
    expect(result.base64.length).toBeGreaterThan(0);
    expect(canvasObj.toBlob).toHaveBeenCalled();
  });

  it('should produce JPEG header bytes (FF D8 FF)', async () => {
    cleanups.push(mockImageOnLoad({ width: 800, height: 600 }));
    const { restore } = mockCanvasOnCreate();
    cleanups.push(restore);

    const file = new File([imageBuffer], 'file-6a475e3fd3f92.png', { type: 'image/png' });
    const result = await compressImage(file, 80, 1280);

    expect(result.data[0]).toBe(0xff);
    expect(result.data[1]).toBe(0xd8);
    expect(result.data[2]).toBe(0xff);
  });

  it('should produce valid base64 string', async () => {
    cleanups.push(mockImageOnLoad({ width: 800, height: 600 }));
    const { restore } = mockCanvasOnCreate();
    cleanups.push(restore);

    const file = new File([imageBuffer], 'file-6a475e3fd3f92.png', { type: 'image/png' });
    const result = await compressImage(file, 80, 1280);

    expect(/^[A-Za-z0-9+/]+=*$/.test(result.base64)).toBe(true);
  });

  it('should pass quality as fraction to canvas.toBlob (60 -> 0.6)', async () => {
    let capturedQuality = 0;
    cleanups.push(mockImageOnLoad({ width: 800, height: 600 }));
    const { canvasObj, restore } = mockCanvasOnCreate({
      blobCallback: (cb, _type, quality) => {
        capturedQuality = quality;
        const data = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
        cb(new Blob([data], { type: 'image/jpeg' }));
      }
    });
    cleanups.push(restore);

    const file = new File([imageBuffer], 'test.png', { type: 'image/png' });
    await compressImage(file, 60, 1280);

    expect(capturedQuality).toBe(0.6);
    expect(canvasObj.toBlob).toHaveBeenCalled();
  });

  it('should reject when canvas context is unavailable', async () => {
    cleanups.push(mockImageOnLoad({ width: 800, height: 600 }));
    const { restore } = mockCanvasOnCreate({ contextNull: true });
    cleanups.push(restore);

    const file = new File([imageBuffer], 'test.png', { type: 'image/png' });
    await expect(compressImage(file)).rejects.toThrow('Canvas context not available');
  });

  it('should reject when toBlob returns null', async () => {
    cleanups.push(mockImageOnLoad({ width: 800, height: 600 }));
    const { restore } = mockCanvasOnCreate({ blobFail: true });
    cleanups.push(restore);

    const file = new File([imageBuffer], 'test.png', { type: 'image/png' });
    await expect(compressImage(file)).rejects.toThrow('Failed to create blob');
  });

  it('should reject when image fails to load', async () => {
    cleanups.push(mockImageOnLoad({ fail: true }));
    const { restore } = mockCanvasOnCreate();
    cleanups.push(restore);

    const file = new File([imageBuffer], 'test.png', { type: 'image/png' });
    await expect(compressImage(file)).rejects.toThrow('Failed to load image');
  });

  it('should read file-6a475e3fd3f92.png (~2.3MB) and compress to JPEG', async () => {
    expect(imageBuffer.length).toBeGreaterThan(2_000_000);

    cleanups.push(mockImageOnLoad({ width: 2560, height: 1440 }));
    const { restore } = mockCanvasOnCreate();
    cleanups.push(restore);

    const file = new File([imageBuffer], 'file-6a475e3fd3f92.png', { type: 'image/png' });
    const result = await compressImage(file, 80, 1280);

    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.base64.length).toBeGreaterThan(0);
    expect(result.data[0]).toBe(0xff);
    expect(result.data[1]).toBe(0xd8);
    expect(result.data[2]).toBe(0xff);
  });
});
