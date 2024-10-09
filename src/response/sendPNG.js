import { readFile } from 'fs';
import { send404 } from "./send404.js";
import { send500 } from "./send500.js";

/**
 * Helper to send PNG files from public directory.
 * 
 * @param {import("http").ServerResponse} response
 * @param {string} filepath
 */
export function sendPNG(response, filepath) {
    readFile(filepath, (error, content) => {
        if (error) {
            console.error(`${process.pid} ServerRequest.sendFile: ${error.message} ${error.code}`)
            if (error.code == 'ENOENT') {
                return send404(response);
            }
            return send500(response);
        }
        // TODO use canvas module to paint BMP and then convert to PNG
        // https://github.com/Automattic/node-canvas

        // Convert BMP to PNG file
        // this will not work, it's still just a bmp file but with png extension
        // fs.writeFile(filepath.replace(/.bmp$/, '.png'), content, 'binary', (errorPng) => {
        //     if (errorPng) {
        //         console.error('ServerRequest.sendFile:', errorPng.message, errorPng.code)
        //     }
        // })
        // OK 200 response
        response.writeHead(200, {
            'Content-Length': content.byteLength,
            'Content-Type': 'image/bmp', // 'image/npg',
            'X-Powered-By': 'Magic',
        });
        response.end(content, 'binary');
    });
}