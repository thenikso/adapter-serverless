# adapter-serverless for SvelteKit

An (experimental) adapter to build a [SvelteKit](https://kit.svelte.dev/) app
into a lambda ready handler for [Serverless](https://www.serverless.com/) deployment.

```
npm install --save-dev @nikso/adapter-serverless
```

It uses [serverless-http](https://github.com/dougmoscrop/serverless-http) to wrap
a [Polka](https://github.com/lukeed/polka) server.

Note that because of the ESM nature of SvelteKit and the non-ESM nature of AWS
lamnda, this adapter uses [esbuild](https://esbuild.github.io/) to compile your
app in a CommonJS bundle.

## Usage

In your `svelte.config.cjs` add the adapter like so:

```js
const serverless = require('@nikso/adapter-serverless');
const pkg = require('./package.json');

module.exports = {
  kit: {
    adapter: serverless(),

    // NOTE that Serverless might add a "stage" fragment to URLs. You want to
    // reflect it here in `path.base` to have static files being served properly
    paths: {
      base: '/dev',
    },

    target: '#svelte',

    vite: {
      ssr: {
        noExternal: Object.keys(pkg.dependencies || {}),
      },
    },
  },
};
```

## Example serverless.yml

After building your Svelte app with `npm run build`, an example Serverless
configuration to run `serverless offline` could be:

```yml
service: svelte-app

frameworkVersion: '2'

provider:
  name: aws
  runtime: nodejs12.x
  lambdaHashingVersion: 20201221

package:
  individually: true
  exclude:
    - ./**
  include:
    - build/**

functions:
  svelte:
    handler: build/serverless.handler
    events:
      - http: ANY /
      - http: ANY /{proxy+}

plugins:
  - serverless-offline
```
