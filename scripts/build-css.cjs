const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const postcssConfig = require('../postcss.config.cjs');

const srcDir = path.join(__dirname, '..', 'src', 'styles');
const outDir = path.join(__dirname, '..', 'dist');

const input = path.join(srcDir, 'index.css');
const output = path.join(outDir, 'index.css');

async function build() {
  const css = fs.readFileSync(input, 'utf8');
  const result = await postcss(
    Object.entries(postcssConfig.plugins || {}).map(([name, opts]) =>
      require(name)(opts),
    ),
  ).process(css, { from: input, to: output });
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(output, result.css);
  if (result.map) fs.writeFileSync(output + '.map', result.map.toString());
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
