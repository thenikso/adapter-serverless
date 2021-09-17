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
      builder.utils.log.minor('Copying assets');
      const static_directory = join(out, 'assets');
      builder.utils.copy_client_files(static_directory);
      builder.utils.copy_static_files(static_directory);

      builder.utils.log.minor('Copying server');
      builder.utils.copy_server_files(out);
      copyFileSync(`${__dirname}/files/serverless.js`, `${out}/_serverless.js`);

      builder.utils.log.minor('Building lambda');
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

      builder.utils.log.minor('Prerendering static pages');
      await builder.utils.prerender({
        dest: `${out}/prerendered`,
      });

      builder.utils.log.minor('Cleanup');
      unlinkSync(`${out}/_serverless.js`);
      unlinkSync(`${out}/app.js`);
    },
  };

  return adapter;
};
