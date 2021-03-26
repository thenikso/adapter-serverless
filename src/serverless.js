import serverless from 'serverless-http';
import fs from 'fs';
import path from 'path';
import polka from 'polka';
import sirv from 'sirv';
import compression from 'compression';
import { URLSearchParams } from 'url';
import { get_body } from '@sveltejs/kit/http';
import * as app from './app.js';

const mutable = (dir) =>
  sirv(dir, {
    etag: true,
    maxAge: 0,
  });

const noop_handler = (_req, _res, next) => next();

const prerendered_handler = fs.existsSync('prerendered')
  ? mutable('prerendered')
  : noop_handler;

const assets_handler = sirv(path.join(__dirname, '/assets'), {
  maxAge: 31536000,
  immutable: true,
});

const server = polka().use(
  compression({ threshold: 0 }),
  assets_handler,
  prerendered_handler,
  async (req, res) => {
    const params = {
      method: req.method,
      headers: req.headers,
      path: req.path || '/',
      body: await get_body(req),
      query: new URLSearchParams(req.query),
    };
    const rendered = await app.render(params);

    if (rendered) {
      res.writeHead(rendered.status, rendered.headers);
      res.end(rendered.body);
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  },
);

export const handler = serverless(server);
