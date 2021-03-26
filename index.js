const { copyFileSync, writeFileSync, unlinkSync } = require('fs');
const { join } = require('path');

const esbuild = require('esbuild');

/**
 * @param {{
 *   out?: string;
 * }} options
 */
module.exports = function ({ out = 'build' } = {}) {
  /** @type {import('@sveltejs/kit').Adapter} */
  const adapter = {
    name: 'adapter-serverless',

    async adapt(builder) {
      builder.log.minor('Copying assets');
      const static_directory = join(out, 'assets');
      builder.copy_client_files(static_directory);
      builder.copy_static_files(static_directory);

      builder.log.minor('Copying server');
      builder.copy_server_files(out);
      copyFileSync(`${__dirname}/files/serverless.js`, `${out}/_serverless.js`);

      builder.log.minor('Building lambda');
      esbuild.buildSync({
        entryPoints: [`${out}/_serverless.js`],
        outfile: `${out}/serverless.js`,
        format: 'cjs',
        bundle: true,
        platform: 'node',
      });

      writeFileSync(
        `${out}/package.json`,
        JSON.stringify(
          {
            name: 'svelte-serverless',
            version: '1.0.0',
            main: 'serverless.js',
          },
          null,
          2,
        ),
      );

      builder.log.minor('Prerendering static pages');
      await builder.prerender({
        dest: `${out}/prerendered`,
      });

      builder.log.minor('Cleanup');
      unlinkSync(`${out}/_serverless.js`);
      unlinkSync(`${out}/app.js`);
    },
  };

  return adapter;
};
