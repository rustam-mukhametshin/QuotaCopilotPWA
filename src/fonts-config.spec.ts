import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Static checks for the Inter font setup in project config files (index.html, ngsw-config.json).
 * Files are read from disk via Node's built-in `fs` (tests run in Node with jsdom).
 */
interface NodeFs {
  readFileSync(path: string, encoding: 'utf-8'): string;
}

function readProjectFile(relativePath: string): string {
  const proc = (globalThis as any).process;
  const fs = proc.getBuiltinModule('node:fs') as NodeFs;
  return fs.readFileSync(`${proc.cwd()}/${relativePath}`, 'utf-8');
}

interface DataGroup {
  name: string;
  urls: string[];
  cacheConfig: { strategy: string; maxSize: number; maxAge: string };
}

describe('Inter font configuration', () => {
  describe('src/index.html', () => {
    let head: HTMLHeadElement;

    beforeAll(() => {
      const doc = new DOMParser().parseFromString(readProjectFile('src/index.html'), 'text/html');
      head = doc.head;
    });

    it('preconnects to fonts.googleapis.com', () => {
      const link = head.querySelector(
        'link[rel="preconnect"][href="https://fonts.googleapis.com"]',
      );

      expect(link).not.toBeNull();
    });

    it('preconnects to fonts.gstatic.com with crossorigin', () => {
      const link = head.querySelector('link[rel="preconnect"][href="https://fonts.gstatic.com"]');

      expect(link).not.toBeNull();
      expect(link!.hasAttribute('crossorigin')).toBe(true);
    });

    it('loads the Inter stylesheet from Google Fonts with display=swap', () => {
      const link = head.querySelector<HTMLLinkElement>(
        'link[rel="stylesheet"][href^="https://fonts.googleapis.com/css2"]',
      );

      expect(link).not.toBeNull();
      const url = new URL(link!.getAttribute('href')!);
      expect(url.searchParams.get('family')).toMatch(/^Inter(:|$)/);
      expect(url.searchParams.get('display')).toBe('swap');
    });
  });

  describe('ngsw-config.json', () => {
    let fontsGroup: DataGroup | undefined;

    beforeAll(() => {
      const config = JSON.parse(readProjectFile('ngsw-config.json')) as {
        dataGroups?: DataGroup[];
      };
      fontsGroup = config.dataGroups?.find((group) =>
        group.urls.some((url) => url.includes('fonts.googleapis.com')),
      );
    });

    it('declares a data group caching Google Fonts', () => {
      expect(fontsGroup).toBeDefined();
      expect(fontsGroup!.urls).toEqual(
        expect.arrayContaining(['https://fonts.googleapis.com/**', 'https://fonts.gstatic.com/**']),
      );
    });

    it('uses the performance (cache-first) strategy for Google Fonts', () => {
      expect(fontsGroup!.cacheConfig.strategy).toBe('performance');
    });
  });
});
