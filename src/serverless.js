import { URLSearchParams } from 'url';
import { render, init } from './app.js'

init();

export async function handler(event) {
  const { path, headers, multiValueQueryStringParameters } = event;

  const query = new URLSearchParams();
  if (multiValueQueryStringParameters) {
    Object.keys(multiValueQueryStringParameters).forEach(k => {
      const vs = multiValueQueryStringParameters[k]
      vs.forEach(v => {
        query.append(k, v)
      })
    })
  }


  const rendered = await render({
    host: event.requestContext.domainName,
    method: event.httpMethod,
    body: JSON.parse(event.body), // TODO: other payload types
    headers,
    query,
    path,
  })

  if (rendered) {
    const resp = {
      headers: {},
      multiValueHeaders: {},
      body: rendered.body,
      statusCode: rendered.status
    }
    Object.keys(rendered.headers).forEach(k => {
      const v = rendered.headers[k]
      if (v instanceof Array) {
        resp.multiValueHeaders[k] = v
      } else {
        resp.headers[k] = v
      }
    })
    return resp
  }
  return {
    statusCode: 404,
    body: 'Not found.'
  }
}