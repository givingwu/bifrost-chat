// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
const fs = require('fs');
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
const path = require('path');
const postcss = require('postcss');
const postcssConfig = require('../postcss.config.cjs');

const pkgRoot = path.join(__dirname, '..');
const srcDir = path.join(pkgRoot, 'src', 'styles');
const outDir = path.join(pkgRoot, 'dist');
const resolvePaths = [
  path.join(pkgRoot, 'node_modules'),
  path.join(pkgRoot, '..', '..', 'node_modules'),
];

const input = path.join(srcDir, 'index.css');
const output = path.join(outDir, 'index.css');

async function build() {
  const css = fs.readFileSync(input, 'utf8');
  const plugins = Object.entries(postcssConfig.plugins || {}).map(
    ([name, opts]) => {
      const pluginPath = require.resolve(name, { paths: resolvePaths });
      return require(pluginPath)(opts);
    },
  );
  const result = await postcss(plugins).process(css, {
    from: input,
    to: output,
  });
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(output, result.css);
  // biome-ignore lint/style/useTemplate: <explanation>
  if (result.map) fs.writeFileSync(output + '.map', result.map.toString());
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
