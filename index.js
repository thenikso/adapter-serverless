const { copyFileSync, writeFileSync, unlinkSync, readdirSync, statSync } = require('fs');
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

      const static_directory = join(out, 'assets');
      const server_directory = join(out, 'server');

      builder.utils.log.minor('Copying assets');
      builder.utils.copy_client_files(join(static_directory, 'assets'));
      builder.utils.copy_static_files(static_directory);


      builder.utils.log.minor('Copying server');
      builder.utils.copy_server_files(out);
      copyFileSync(`${__dirname}/files/serverless.js`, `${server_directory}/_serverless.js`);
      copyFileSync(`${__dirname}/src/shims.js`, `${server_directory}/shims.js`);


      builder.utils.log.minor('Building lambda');
      esbuild.buildSync({
        entryPoints: [`${server_directory}/_serverless.js`],
        outfile: `${server_directory}/serverless.js`,
        inject: [join(`${server_directory}/shims.js`)],
        format: 'cjs',
        bundle: true,
        platform: 'node',
      });

      writeFileSync(
        `${server_directory}/package.json`,
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
      unlinkSync(`${server_directory}/_serverless.js`);
      unlinkSync(`${out}/app.js`);
    },
  };

  return adapter;
};

function ThroughDirectory(Directory, Files = []) {
  readdirSync(Directory).forEach(File => {
    const Absolute = join(Directory, File);
    if (statSync(Absolute).isDirectory()) return ThroughDirectory(Absolute, Files);
    else return Files.push(Absolute);
  });
  return Files
}
