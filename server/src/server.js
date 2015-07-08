import { Server as WebSocketServer } from 'ws';

var debug = require('debug')('server');
var port = 34343;
var wss = new WebSocketServer({ port: port });

wss.broadcast = function broadcast(data, except = {}) {
    var to = [];

    wss.clients.forEach(function each(client) {
        var address = client._socket.remoteAddress + ':' + client._socket.remotePort;
        if (except[address] === undefined && client && client.readyState === 1) {
            client.send(data);
            to.push(address);
        }
    });

    debug('broadcast', to);
};

wss.on('connection', function connection(ws) {
    var address = ws._socket.remoteAddress + ':' + ws._socket.remotePort;

    ws.on('message', function incoming(data) {
        var except = {};
        except[address] = ws;
        wss.broadcast(data, except);

        debug('receive', address);
    });

    ws.on('close', function close() {
        console.log(address, 'closed');
    });

    console.log(ws._socket.remoteAddress + ':' + ws._socket.remotePort, 'connected');
});

console.log('server is now on ws://0.0.0.0:' + port);
