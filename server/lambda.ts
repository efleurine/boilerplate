const awsServerlessExpress = require('aws-serverless-express');
const compression = require("compression");
const express = require("express");
const pathMatch = require("path-match");
const path = require('path');
const { parse } = require("url");

// setup Express and hook up Next.js handler
const app = express();
app.use(compression());

const route = pathMatch();
const matches = [];
const binaryMimeTypes = ['*/*'];

// host the static files
app.use("/_next/static", express.static(path.join(__dirname, "/static")));

app.get('/', __non_webpack_require__('./serverless/pages/index').render)
app.get('*', (req, res) => {

  const parsedUrl = parse(req.url, true);
  const { pathname, query } = parsedUrl;
  let hasMatch = false;

  for (const match of matches) {
    const params = match.route(pathname);
    if (params) {
      try {
        __non_webpack_require__(`./serverless/pages${pathname}`).render(req, res, match.page, Object.assign(params, query))
      } catch (err) {
        __non_webpack_require__('./serverless/pages/_error').render(req, res, match.page, Object.assign(params, query))
      }
      hasMatch = true;
      break;
    }
  }
  if (!hasMatch) {
    try {
      __non_webpack_require__(`./serverless/pages${pathname}`).render(req, res, parsedUrl)
    } catch (err) {
      __non_webpack_require__('./serverless/pages/_error').render(req, res, parsedUrl)
    }
  }
})

// 404 handler
app.get("*", __non_webpack_require__('./serverless/pages/_error').render);

const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes);
const lambda = (event, context) => awsServerlessExpress.proxy(server, event, context);

// export the wrapped handler for the Lambda runtime
exports.handler = lambda;