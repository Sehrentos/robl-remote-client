roBrowserLegacy Remote Client
=======================

This remote client server is made to serve assets for the [roBrowserLegacy](https://github.com/MrAntares/roBrowserLegacy) project.
It serves assets to browser via HTTP from resources directory or by extracting them from compressed files.
It also has little caching.

- GRF version 0x200 is supported. No DES encryption.
- Resources get cache-control set for 1-day.

## Configure

Current project structure is something like this:
- /project-root/roBrowserLegacy
- **/project-root/robl-remote-client**
- /project-root/rathena
- /project-root/Hercules

### Environment
Make or edit `.env` file (in project root directory) or system environment variables.

- NODE_ENV - environment mode
- HOST - IP address of the host
- PORT_HTTP - port address for HTTP requests
- PORT_HTTPS - port address for HTTPS requests
- LOG_HTTP - show console logs for server requests
- LOG_PROXY - show console logs for WebSocket/TCP communication
- DIR_ROBL_NAME - roBrowserLegacy directory name

Sample `.env` file content:
```txt
NODE_ENV=development
# networking
HOST=127.0.0.1
PORT_HTTP=80
PORT_HTTPS=443
# logging
LOG_HTTP=false
LOG_PROXY=false
# paths
DIR_ROBL_NAME=roBrowserLegacy
```

### SSL Certificate
For secure HTTPS put `cert.pem` and `key.pem` files in the `/certs` directory.

- See certs [README](./certs/README.md) for more info.
- WebSocket requires secure connection.

### Client resources
Put GRF, BGM audio, AI lua/lub, System lua/lub files in the `/resources` directory.

- If you have uncompressed data resources, put them in `/data` subdirectory.
- See resources [README](./resources/README.md) for more info.

## Install
```sh
npm install
```

## Start the server
```sh
npm start
```

## Modules
- [dotenv](https://github.com/motdotla/dotenv)
- [grf-loader](https://github.com/vthibault/grf-loader/)
- [websockets/ws](https://github.com/websockets/ws)

## Credits
- [roBrowser](https://github.com/vthibault/roBrowser) [Vincent Thibault](https://github.com/vthibault) & all the contributors.
- [roBrowserLegacy](https://github.com/MrAntares/roBrowserLegacy) & all the contributors.
- WSProxy class is based on [herenow](https://github.com/herenow)'s [wsProxy](https://github.com/herenow/wsProxy)

## To-Do
- Change possibly express, restana or fastify for server implementation. Depends how complex the requests will become. 
As for now they are very simple, so i decided not to use any library for now.