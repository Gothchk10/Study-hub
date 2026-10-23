import express from 'express';
import { createServer } from 'node:http';
import { createBareServer } from '@tomphttp/bare-server-node';
import wisp from 'wisp-server-node';

const app = express();
const httpServer = createServer();
const PORT = process.env.PORT || 8080;

// Custom path to mask traffic signatures
const bareServer = createBareServer('/assets/chunks/'); 

app.use((req, res, next) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.route(req, res);
    } else {
        next();
    }
});

// Innocent disguise landing page
app.get('/', (req, res) => {
    res.status(404).send('Error 404: Internal Server Resource Not Found.');
});

httpServer.on('request', (req, res) => {
    app(req, res);
});

httpServer.on('upgrade', (req, socket, head) => {
    if (req.url.endsWith('/secure/feed/')) { 
        wisp.routeRequest(req, socket, head);
    } else if (bareServer.shouldRoute(req)) {
        bareServer.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

httpServer.listen(PORT, () => {
    console.log(`Backend service active on port ${PORT}`);
});
