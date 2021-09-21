import serverless from 'serverless-http';
import fs from 'fs';
import polka from 'polka';
import sirv from 'sirv';
import compression from 'compression';
import { URLSearchParams } from 'url';
import * as app from '../app.js';

app.init();

const mutable = (dir) =>
  sirv(dir, {
    etag: true,
    maxAge: 0,
  });

const noop_handler = (_req, _res, next) => next();

const prerendered_handler = fs.existsSync('prerendered')
  ? mutable('prerendered')
  : noop_handler;


const server = polka().use(
  compression({ threshold: 0 }),
  prerendered_handler,
  async (req, res) => {

    const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = req;

    const query = new URLSearchParams(rawQuery);

    const encoding = isBase64Encoded ? 'base64' : headers['content-encoding'] || 'utf-8';
    const rawBody = typeof body === 'string' ? Buffer.from(body, encoding) : body;


    console.log(req.body.toString())
    const params = {
      method: req.method,
      headers: req.headers,
      path: req.path || '/',
      rawBody,
      query: query
    };

    console.log(req);
    console.log(params);
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