import { Server as WebSocketServer } from 'ws';
import Packet from './Packet.js';
import Player from './Player.js';
import MiniMap from './MiniMap.js';
import msgpack from 'msgpack';
import url from 'url';
import _ from 'lodash';

var debug = require('debug')('server');
var port = 34343;
var wss = new WebSocketServer({ port: port });

var players = [];
var player_count = 0;
var accepted_server = [];

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

function findUnusedPlayerID() {
    for (var i=0; i < players.length; ++i) {
         if (players[i] === undefined)
             return i;
    }

    return players.length;
};

function updatePlayers() {
    var data = [];
    for (var p in players) {
        var player = players[p];
        data.push({
            name: player.name,
            no: player.no,
            ids: player.ids
        });
    }

    wss.broadcast(msgpack.pack({
        type: Packet.TYPE_UPDATE_PLAYERS,
        data: data
    }));
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
    var player = new Player(findUnusedPlayerID(), ws._socket.remoteAddress, ws._socket.remotePort);
    var address = player.getFullAddress();
    players[player.no] = player;
    player_count++;

    updatePlayers();

    ws.on('message', function incoming(data) {
        var except = {};
        except[address] = ws;
        try {
            var packet = new msgpack.unpack(data);
        } catch (ex) {
            console.error(ex);
            return false;
        }

        switch (packet.type) {
            case Packet.TYPE_SET_NICKNAME:
                player.name = packet.data;
                updatePlayers();
                console.log('player', player.no + 1, 'set nickname:', player.getNameString());
                break;
            case Packet.TYPE_UPDATE_NODES:
                player.updateNodes(packet.data);
                if (player.shouldUpdate) {
                    updatePlayers();
                }
                break;
            case Packet.TYPE_ADD_NODE:
                player.addNode(packet.data);
                updatePlayers();
                break;
            case Packet.TYPE_UPDATE_ADDRESS:
                var original_server = player.server;
                player.server = packet.data;
                console.log('player', player.no + 1, 'update address:', original_server.url , '->', player.server.url);

                if (player_count == 1) {
                    accepted_server = player.server;
                } else {
                    if (accepted_server.url != player.server.url) {
                        console.warn('player\'s address mismatched:', player.server.url, '!=', accepted_server.url );
                        wss.broadcast(msgpack.pack({
                            type: Packet.TYPE_SERVER_ADDRESS,
                            data: accepted_server
                        }));
                        ws.close();
                    }
                }
                break;
        }

        debug('receive', address, 'packet size: ', data.length, 'packet type: ', packet.type);
    });

    ws.on('close', function close() {
        console.log('player', player.no + 1, address, 'has left.');
        delete players[player.no];
        player_count--;
        updatePlayers();
    });

    console.log('player', player.no + 1, address, 'joined.');
});

setInterval(function updateMap() {
    var diff = map.mergeFromPlayers(players);

    var packet = {
        type: Packet.TYPE_UPDATE_MAP,
        data: diff
    };

    var buffer = msgpack.pack(packet);

    if (diff.addition.length > 0 || diff.deletion.length > 0)
        wss.broadcast(buffer);
}, 1000 / 30);

console.log('server is now on the port:' + port);

