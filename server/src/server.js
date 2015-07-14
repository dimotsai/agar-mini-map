import { Server as WebSocketServer } from 'ws';
import Packet from './Packet.js';
import Player from './Player.js';
import MiniMap from './MiniMap.js';
import msgpack from 'msgpack';

//var msgpack = msgpack5();
var debug = require('debug')('server');
var port = 34343;
var wss = new WebSocketServer({ port: port });

var players = [];
var player_counter = 0;

var map = new MiniMap();

if (Buffer.prototype.toArrayBuffer === undefined) {
    Buffer.prototype.toArrayBuffer = function toArrayBuffer() {
        var ab = new ArrayBuffer(this.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < this.length; ++i) {
            view[i] = this[i];
        }
        return ab;
    }
}

wss.broadcast = function broadcast(data, except = {}) {
    var to = [];

    wss.clients.forEach(function each(client) {
        var address = client._socket.remoteAddress + ':' + client._socket.remotePort;
        if (except[address] === undefined && client && client.readyState === 1) {
            client.send(data);
            to.push(address);
        }
    });

    debug('broadcast', 'packet size:', data.length);
};

wss.on('connection', function connection(ws) {
    var player = new Player(player_counter++, ws._socket.remoteAddress, ws._socket.remotePort);
    var address = player.getFullAddress();
    players[player.no] = player;

    ws.on('message', function incoming(data) {
        var except = {};
        except[address] = ws;
        //wss.broadcast(data, except);
        var packet = new msgpack.unpack(data);

        switch (packet.type) {
            case Packet.TYPE_UPDATE_NODES:
                player.updateNodes(packet.data);
                break;
            case Packet.TYPE_ADD_NODE:
                player.addNode(packet.data);
                break;
        }

        debug('receive', address, 'packet size: ', data.length);
    });

    ws.on('close', function close() {
        console.log('player', player.no, address, 'has left.');
        delete players[player.no];
    });

    console.log('player', player.no, address, 'joined.');
});

setInterval(function updateMap() {
    var diff = map.mergeFromPlayers(players);
    //console.log(map);
    var packet = {
        type: Packet.TYPE_UPDATE_MAP,
        data: diff
    };

    var buffer = msgpack.pack(packet);
    //console.log(buffer.length);
    //console.log(buffer.toArrayBuffer());

    if (diff.addition.length > 0 || diff.deletion.length > 0)
        wss.broadcast(buffer);
}, 1000 / 30);

console.log('server is now on ws://0.0.0.0:' + port);

