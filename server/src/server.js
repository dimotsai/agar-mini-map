import { Server as WebSocketServer } from 'ws';
import Cell from './Cell.js';

var debug = require('debug')('server');
var port = 34343;
var wss = new WebSocketServer({ port: port });

var cells = [];

wss.broadcast = function broadcast(data, except = {}) {
    wss.clients.forEach(function each(client) {
        var key = client._socket.remoteAddress + ':' + client._socket.remotePort;
        if (except[key] === undefined)
            client.send(data);
    });
};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(data) {
        var except = {};
        var key = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
        except[key] = ws;
        wss.broadcast(data, except);

        debug('receive', key, Cell.parse(data));
    });
});

console.log('server is now on ws://0.0.0.0:' + port);
