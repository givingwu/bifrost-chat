// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
const fs = require('fs');
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
const path = require('path');
const postcss = require('postcss');
const config = require('../postcss.config.cjs');

const root = path.resolve(__dirname, '..');
const input = path.join(root, 'src/styles/index.css');
const output = path.join(root, 'dist/index.css');

const plugins = Object.entries(config.plugins || {}).map(([name, opts]) => {
  const plugin = require(name);
  return plugin.default ? plugin.default(opts) : plugin(opts);
});

postcss(plugins)
  .process(fs.readFileSync(input, 'utf8'), { from: input, to: output })
  .then(result => {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, result.css);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
