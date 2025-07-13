// remix.config.js
import { readFileSync } from 'node:fs';

/** @type {import('@remix-run/dev').AppConfig} */
export default {
    ignoredRouteFiles: ["**/.*"],
    dev: {
        port: 5173, // Or your desired port, e.g., 8443
        https: {
            key: readFileSync("./localhost+2-key.pem"),
            cert: readFileSync("./localhost+2.pem"),
        },
    },
    browserNodeBuiltinsPolyfill: {
        modules: {
            buffer: true, // This tells Remix to polyfill the 'buffer' module
            events: true
        },
    },
};