import cluster from 'cluster';
import os from 'os';
import * as dotenv from 'dotenv';
dotenv.config();
import { server } from './src/server.js';

const numSPUs = os.cpus().length;

// spread processes on multiple cores
if (cluster.isPrimary) {
    console.log(`mode: ${process.env.NODE_ENV}`);
    console.log(`Master process ${process.pid} is running`);

    for (let i = 0; i < numSPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker process ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });
} else {
    // start server
    server();
}

// single thread
// console.log(`mode: ${process.env.NODE_ENV}`);
// server();