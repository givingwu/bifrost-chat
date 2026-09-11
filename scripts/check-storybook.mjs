import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const outputDir = resolve(process.argv[2] ?? 'storybook-static');
const origin = 'https://storybook.example';

/**
 * Check the generated entrypoints as a browser would resolve them when hosted
 * at the root or under a subdirectory. No development-server fallback is used.
 * @param {string} basePath Hosting path, including its trailing slash.
 * @returns {Promise<void>} Rejects if an asset escapes the site or is missing.
 */
async function checkAssets(basePath) {
  for (const filename of ['index.html', 'iframe.html']) {
    const html = await readFile(resolve(outputDir, filename), 'utf8');
    const dom = new JSDOM(html, {
      url: `${origin}${basePath}${filename}`,
      // Only inspect URLs; jsdom cannot parse all of Storybook's modern CSS.
      virtualConsole: new VirtualConsole(),
    });
    try {
      const { document } = dom.window;
      const assets = [
        ...Array.from(document.querySelectorAll('script[src]'), (script) =>
          script.getAttribute('src'),
        ),
        ...Array.from(document.querySelectorAll('link[href]'), (link) =>
          link.getAttribute('href'),
        ),
        ...Array.from(
          document.querySelectorAll('script[type="module"]'),
        ).flatMap((script) =>
          Array.from(
            script.textContent.matchAll(/\bimport\s+['"]([^'"]+)['"]/g),
            (match) => match[1],
          ),
        ),
      ];

      assert(assets.length > 0, `${filename} must reference built assets`);
      for (const asset of assets) {
        const url = new URL(asset, document.baseURI);
        if (url.origin !== origin) continue;
        assert(
          url.pathname.startsWith(basePath),
          `${filename}: ${asset} resolves outside hosting path ${basePath}`,
        );
        const file = resolve(
          outputDir,
          decodeURIComponent(url.pathname.slice(basePath.length)),
        );
        assert(
          (await stat(file)).isFile(),
          `${filename}: missing asset ${asset}`,
        );
      }
    } finally {
      dom.window.close();
    }
  }
}

for (const basePath of ['/', '/bifrost-chat/', '/nested/storybook/']) {
  await checkAssets(basePath);
  console.log(`Storybook entrypoint assets verified at ${basePath}`);
}
