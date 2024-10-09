import { readFile } from "fs";
import { send404 } from "../response/send404.js";
import { getContentTypeExt } from "./getContentTypeExt.js";
import { send500 } from "../response/send500.js";

const DEBUG = process.env.LOG_HTTP === 'true';

/**
 * Helper to send files from public directory.
 * 
 * @param {import("http").ServerResponse} response 
 * @param {string} filepath 
 * @param {boolean} useCache Cache response for 1 day. default: `false`
 */
export function sendFile(response, filepath, useCache = false) {
    // get header Content-Type
    const contentType = getContentTypeExt(filepath);

    // read file buffer and send it
    readFile(filepath, (error, content) => {
        if (error) {
            console.error(`404 ${process.pid} ${error.message} ${error.code}`)
            if (error.code == 'ENOENT') {
                return send404(response);
            }
            return send500(response);
        }
        // Ok, 200 response
        if (DEBUG) console.log(`200 ${process.pid} ${filepath}`) // DEBUG
        // set 1 day browser cache
        if (useCache) {
            response.writeHead(200, {
                'Content-Length': content.byteLength, //Buffer.byteLength("my string content"),
                'Content-Type': contentType,
                'X-Powered-By': 'Magic',
                'Cache-control': `public, max-age=${60 * 60 * 12}`,
            });
        } else {
            response.writeHead(200, {
                'Content-Length': content.byteLength, //Buffer.byteLength("my string content"),
                'Content-Type': contentType,
                'X-Powered-By': 'Magic',
            });
        }
        response.end(content, 'utf-8');
    });
}