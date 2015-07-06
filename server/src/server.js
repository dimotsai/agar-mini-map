import { Server as WebSocketServer } from 'ws';

var debug = require('debug')('server');
var port = 34343;
var wss = new WebSocketServer({ port: port });

wss.broadcast = function broadcast(data, except = {}) {
    var to = [];

    wss.clients.forEach(function each(client) {
        var key = client._socket.remoteAddress + ':' + client._socket.remotePort;
        if (except[key] === undefined) {
            client.send(data);
            to.push(key);
        }
    });

    debug('broadcast', to);
};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(data) {
        var except = {};
        var key = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
        except[key] = ws;
        wss.broadcast(data, except);

        debug('receive', key);
    });

    ws.on('close', function close() {
        console.log(ws._socket.remoteAddress + ':' + ws._socket.remotePort, 'closed');
    });

    console.log(ws._socket.remoteAddress + ':' + ws._socket.remotePort, 'connected');
});

console.log('server is now on ws://0.0.0.0:' + port);
