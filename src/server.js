#!/usr/bin/env node
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';
import https from 'https';
import { WebSocketServer } from 'ws'; // version 8.18.0
import { WSProxy } from './modules/WSProxy.js';
import { onEntryRequest } from './routes/entry.js';

const LOGS = process.env.LOG_HTTP === 'true';
const LOGS_PROXY = process.env.LOG_PROXY === 'true';
const HOST_IPv4 = process.env.HOST || '127.0.0.1';
const PORT_HTTP = Number(process.env.HTTP_PORT || 80);
const PORT_HTTPS = Number(process.env.HTTPS_PORT || 443);

// paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR_ROOT = path.resolve(__dirname, '../');

// SSL/HTTPS certificates
const serverOptions = {
    key: fs.readFileSync(path.join(DIR_ROOT, 'certs/key.pem')),
    cert: fs.readFileSync(path.join(DIR_ROOT, 'certs/cert.pem'))
};

export function server() {
    // create HTTP & HTTPS servers
    const httpServer = http.createServer();
    const httpsServer = https.createServer(serverOptions);

    // force all HTTP requests to be redirected to HTTPS
    // use this when you have certs and want to force HTTPS
    httpServer.on('request', (req, res) => {
        res.writeHead(301, { 'Location': 'https://' + (req.headers.host || HOST_IPv4) + req.url });
        res.end();
    });
    // httpServer.on('request', onEntryRequest); // use this when you don't have certs
    httpsServer.on('request', onEntryRequest);

    // start ws server
    // bind it to our HTTPS server.
    // if NOT, use the host/port options.
    const wss = new WebSocketServer({
        server: httpsServer, // bind to HTTPS server instance.
        // host: '127.0.0.1', // {String} The hostname where to bind the server.
        // port: 5999, // {Number} The port number on which to listen.
        clientTracking: false, // {Boolean} Specifies whether or not to track clients.
        // maxPayload: 104857600, // {Number} The maximum allowed message size in bytes. Defaults to 100 MiB (104857600 bytes).
        skipUTF8Validation: false, // {Boolean} Specifies whether or not to skip UTF-8 validation for text and close messages. Defaults to false. Set to true only if clients are trusted.
        perMessageDeflate: false, // {Boolean|Object} Enable/disable permessage-deflate.
    });

    // after connection is established, setup proxy to TCP server
    wss.on('connection', (ws, req) => {
        const proxy = new WSProxy(ws, req);
        if (LOGS_PROXY) console.log(`Worker process ${process.pid} connected to ${proxy.tcpHost}:${proxy.tcpPort}.`);
    });

    // Start web servers
    httpServer.listen(PORT_HTTP, HOST_IPv4, () => {
        const address = httpServer.address();
        // @ts-ignore
        console.log(`Worker process ${process.pid} is listening http://${address.address}:${address.port}/`)
    });

    httpsServer.listen(PORT_HTTPS, HOST_IPv4, () => {
        const address = httpsServer.address();
        // @ts-ignore
        console.log(`Worker process ${process.pid} is listening https://${address.address}:${address.port}`)
    });
}
