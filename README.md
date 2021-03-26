# adapter-serverless for SvelteKit

An (esperimental) adapter building a lambda ready handler for
[Serverless](https://www.serverless.com/) applications.

```
yarn add --dev @thenikso/adapter-serverless
```

It uses [serverless-http](https://github.com/dougmoscrop/serverless-http) to wrap
a [Polka](https://github.com/lukeed/polka) server.

## Usage

In your `svelte.config.cjs` add the adapter like so:

```js
const serverless = require('@thenikso/adapter-serverless');
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
```
