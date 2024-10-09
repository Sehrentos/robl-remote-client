import path from 'path';
import http from 'http';
import { access, constants } from 'fs/promises';
import { fileURLToPath } from 'url';
import { send404 } from '../response/send404.js';
import { send500 } from '../response/send500.js';
import { sendFile } from '../utils/sendFile.js';
import { parseURL } from '../utils/parseURL.js';
import { setCache } from '../middleware/setCache.js';
import { loadGRF } from '../modules/loadGRF.js';
import { getContentTypeExt } from '../utils/getContentTypeExt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR_ROOT = path.resolve(__dirname, '../../');
const DIR_ROBROWSER = path.resolve(__dirname, '../../../', process.env.DIR_ROBL_NAME || 'roBrowserLegacy');

// show logs etc.
const LOGS = process.env.LOG_HTTP === 'true';

const HOST_IPv4 = process.env.HOST || '127.0.0.1';
// const PORT_HTTP = Number(process.env.HTTP_PORT || 80);
// const PORT_HTTPS = Number(process.env.HTTPS_PORT || 443);

/**
 * Listener entry request
 * 
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
export async function onEntryRequest(req, res) {
    try {
        // `https://${HOST_IPv4}:${PORT_HTTPS}${req.url}`
        const url = new URL(req.url || "/", `https://${req.headers.host || HOST_IPv4}${req.url}`);

        // serve blank favicon
        // remove when you have existing favicon in the public directory
        if (url.pathname === '/favicon.ico') {
            setCache(req, res);
            res.writeHead(200, { 'Content-Type': 'image/x-icon' });
            return res.end();
        }

        // #region Application Scripts
        if (url.pathname === '/Online.js') {
            const filepath = path.join(DIR_ROBROWSER, '/dist/Web/Online.js');
            // setCORS(req, res);
            // setCache(request, response, 60 * 10); // smaller cache time for development (10-minutes)
            sendFile(res, filepath, false);
            // streamFile(response, filepath); // big file, use streamFile
            return;
        }

        if (url.pathname === '/ThreadEventHandler.js') {
            const filepath = path.join(DIR_ROBROWSER, '/dist/Web/ThreadEventHandler.js');
            // setCORS(req, res);
            sendFile(res, filepath, false); // small file, use sendFile
            // streamFile(response, filepath);
            return;
        }
        // #endregion

        // static /AI *.lua files
        // if (/AI\/(.*).lua$/.test(url.pathname)) {
        //     // setCORS(req, res);
        //     const filepath = parseURL(req, path.join(DIR_ROOT, '/'))
        //         .replace('.lua.lua', '.lua') // bugfix "<filename.extension>.lua.lua"
        //     sendFile(res, filepath, true);
        //     // streamFile(response, filepath);
        //     return;
        // }

        // static /client/* files, TODO is this needed for GRF?, but server does not support GRF files YET
        // if (/client\/(BGM|data|resources|System)\/(.*)/.test(url.pathname)) {
        //     const filepath = parseURL(request, path.join(__dirname, '/')) // -> /client
        //     if (LOGS) console.log(process.pid, filepath);
        //     sendFile(response, filepath, true);
        //     // streamFile(response, filepath);
        //     return;
        // }

        // static /BGM|data|resources|System/* files
        // Note: AI files are inside /data/ai/ folder
        if (/^\/(BGM|data|resources|System|SystemEN)\/(.*)/i.test(url.pathname)) {
            // setCORS(req, res);
            let filepath = parseURL(req, path.join(DIR_ROOT, '/resources'));
            // decode the filename, they may contain special characters
            const dataPath = filepath.match(/data\\(imf|lua%20files|luafiles514|model|palette|sprite|texture|wav)\\(.*)/);
            if (dataPath != null) {
                filepath = filepath.replace(dataPath[2], decodeURIComponent(dataPath[2]));
            }
            // check if the file exists
            try {
                await access(filepath, constants.F_OK);
                return sendFile(res, filepath, true);
            } catch (error) {
                // initialize GRF reading process
                try {
                    const grfFileData = await loadGRF(url.pathname);
                    const buf = Buffer.from(grfFileData);
                    if (LOGS) console.log(`${process.pid} GRF`, url.pathname, buf.byteLength);
                    res.writeHead(200, {
                        'Content-Length': buf.byteLength, //Buffer.byteLength("my string content"),
                        'Content-Type': getContentTypeExt(filepath),
                        'X-Powered-By': 'Magic',
                        'Cache-control': `public, max-age=${60 * 60 * 12}`,
                    });
                    res.end(buf, 'utf-8');
                    return;
                } catch (grfError) {
                    console.error(`404 ${process.pid} GRF error ${url.pathname}:`, error.message || error);
                    send404(res);
                    return;
                }
            }
        }

        // static /src * files for DEBUGGING client source code?
        // if (/src\/(.*)/.test(url.pathname)) {
        //     const filepath = parseURL(req, path.join(DIR_ROBROWSER, '/src'))
        //         .replace('src\\src\\', 'src\\')
        //         .replace('src/src/', 'src/')
        //     // setCORS(req, res);
        //     sendFile(res, filepath, false);
        //     // streamFile(response, filepath);
        //     return;
        // }

        // fallback to /public directory
        if (req.method === 'GET') {
            const filepath = parseURL(req, path.join(DIR_ROOT, '/public'));
            // try to send requested file from our static dir, or 404 page
            // setCORS(req, res);
            sendFile(res, filepath, false);
            // streamFile(response, filepath);
            return;
        }

        // no other request methods are implemented,
        // but you can add them below if you need.
        // POST, PUT, DEL, etc.
        send404(res);

    } catch (error) {
        // catch any sync errors
        console.error(`${process.pid} RequestError:`, error);
        send500(res);
    }
}