// ==UserScript==
// @name         agar-mini-map
// @namespace    http://github.com/dimotsai/
// @version      0.46
// @description  This script will show a mini map and your location on agar.io
// @author       dimotsai
// @license      MIT
// @match        http://agar.io/*
// @require      http://cdn.jsdelivr.net/msgpack/1.05/msgpack.js
// @grant        none
// @run-at       document-body
// ==/UserScript==

var _WebSocket = window._WebSocket = window.WebSocket;
var $ = window.jQuery;
var msgpack = window.msgpack = this.msgpack;

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

function camel2cap(str) {
    return str.replace(/([A-Z])/g, function(s){return ' ' + s.toLowerCase();}).capitalize();
};

// create a linked property from slave object
// whenever master[prop] update, slave[prop] update
function refer(master, slave, prop) {
    Object.defineProperty(master, prop, {
        get: function(){
            return slave[prop];
        },
        set: function(val) {
            slave[prop] = val;
        },
        enumerable: true,
        configurable: true
    });
}

function Token(id, x, y, size, color) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
}

// cell constructor
function Cell(id, x, y, size, color, name) {
    // TODO: move out
    //cells[id] = this;
    this.id = id;
    this.ox = this.x = x;
    this.oy = this.y = y;
    this.oSize = this.size = size;
    this.color = color;
    this.setName(name);
}

Cell.prototype = {
    id: 0,
    name: null,
    x: 0,
    y: 0,
    size: 0,
    ox: 0,
    oy: 0,
    oSize: 0,
    nx: 0,
    ny: 0,
    nSize: 0,
    updateTime: 0,
    updateCode: 0,
    destroyed: false,
    isVirus: false,
    isAgitated: false,

    destroy: function() {
        // TODO: move out
        //delete cells[this.id];
        //id = current_cell_ids.indexOf(this.id);
        //-1 != id && current_cell_ids.splice(id, 1);
        this.destroyed = true;
        //if (map_server === null || map_server.readyState !== window._WebSocket.OPEN) {
            //minimap.unregisterToken(this.id);
        //}
    },

    setName: function(name) {
        this.name = name;
    },

    updatePos: function() {
        //if (map_server === null || map_server.readyState !== window._WebSocket.OPEN) {
            //if (options.enableMultiCells || -1 != current_cell_ids.indexOf(this.id)) {
                //if (! minimap.isTokenRegistered(this.id))
                //{
                    //minimap.registerToken(
                        //this.id,
                        //minimap.createToken(this.id, this.color)
                    //);
                //}

                //var size_n = this.nSize/length_x;
                //minimap.updateToken(this.id, (this.nx - start_x)/length_x, (this.ny - start_y)/length_y, size_n);
            //}
        //}

        //if (options.enablePosition && -1 != current_cell_ids.indexOf(this.id)) {
            //this.ui.pos.show();
            //minimap.updatePos(this.nx, this.ny);
        //} else {
            //this.ui.pos.hide();
        //}
    }
};

function MiniMap () {
    this.options = {
        enableMultiCells: true,
        enablePosition: true,
        enableCross: true
    };

    this.agar_server = null;
    this.map_server = null;
    this.player_name = [];
    this.players = [];
    this.id_players = [];
    this.current_cell_ids = [];
    this.width = 300;
    this.height = 300;
    this.start_x = -7000;
    this.start_y = -7000;
    this.end_x = 7000;
    this.end_y = 7000;
    this.render_timer = null;

    this.ui = {
         minimap: null,
         tokens: null,
         party: null,
         pos: null,
         options: null
    }
}

MiniMap.prototype = {
    getMapWidth: function() {
        return Math.abs(this.start_x - this.end_x);
    },

    getMapHeight: function() {
        return Math.abs(this.start_y - this.end_y);
    },

    sendRawData: function(data) {
        if (this.map_server !== null && this.map_server.readyState === window._WebSocket.OPEN) {
            var array = new Uint8Array(data);
            this.map_server.send(array.buffer);
        }
    },

    connectToMapServer: function(address, onOpen, onClose) {
        try {
            var ws = new window._WebSocket(address);
        } catch (ex) {
            onClose();
            console.error(ex);
            return false;
        }
        ws.binaryType = "arraybuffer";

        ws.onopen = function() {
            onOpen();
            console.log(address + ' connected');
        }

        ws.onmessage = function(event) {
            var buffer = new Uint8Array(event.data);
            var packet = msgpack.unpack(buffer);
            switch(packet.type) {
                case 128:
                    for (var i=0; i < packet.data.addition.length; ++i) {
                        var cell = packet.data.addition[i];

                        if (! this.isTokenRegistered(cell.id))
                        {
                            this.registerToken(
                                cell.id,
                                this.createToken(cell.id, cell.color)
                            );
                        }

                        var token = new Token(cell.id, cell.x, cell.y, cell.size, cell.color);
                        this.updateToken(token);
                    }

                    for (var i=0; i < packet.data.deletion.length; ++i) {
                        var id = packet.data.deletion[i];
                        this.unregisterToken(id);
                    }
                    break;
                case 129:
                    players = packet.data;
                    for (var p in players) {
                        var player = players[p];
                        var ids = player.ids;
                        for (var i in ids) {
                            id_players[ids[i]] = player.no;
                        }
                    }
                    this.ui.party.trigger('update-list');
                    break;
                case 130:
                    if (agar_server != packet.data.url) {
                        var region_name = $('#region > option[value="' + packet.data.region + '"]').text();
                        var gamemode_name = $('#gamemode > option[value="' + packet.data.gamemode + '"]').text();
                        var title = 'Agar Server Mismatched';
                        var content = ('You are now at: <strong>' + agar_server
                            + '</strong><br>Your team members are all at: <strong>' + packet.data.url + ', ' + region_name + ':' + gamemode_name + packet.data.party
                            + '</strong>.<br>The minimap server has disconnected automatically.');

                        $('#mini-map-connect-btn').popover('destroy').popover({
                            animation: false,
                            placement: 'top',
                            title: title,
                            content: content,
                            container: document.body,
                            html: true
                        }).popover('show');
                    } else {
                        $('#mini-map-content-btn').popover('hide');
                    }
                    break;
            }
        }.bind(this);

        ws.onerror = function() {
            onClose();
            console.error('failed to connect to map server');
        };

        ws.onclose = function() {
            onClose();
            this.map_server = null;
            console.log('map server disconnected');
        }.bind(this);

        this.map_server = ws;
    },

    render: function () {
        var canvas = this.ui.minimap;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var id in this.ui.tokens) {
            var token = this.ui.tokens[id];
            var x = token.x * canvas.width;
            var y = token.y * canvas.height;
            var size = token.size * canvas.width;

            ctx.beginPath();
            ctx.arc(
                x,
                y,
                size,
                0,
                2 * Math.PI,
                false
            );
            ctx.closePath();
            ctx.fillStyle = token.color;
            ctx.fill();

            if (this.options.enableCross && -1 != this.current_cell_ids.indexOf(token.id)) {
                this.drawCross(token.x, token.y, token.color);
            }

            if (this.id_players[id] !== undefined) {
                // Draw you party member's crosshair
                if (options.enableCross) {
                    miniMapDrawCross(token.x, token.y, token.color);
                }
                ctx.font = size * 2 + 'px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'white';
                ctx.fillText(id_players[id] + 1, x, y);
            }
        };
    },

    drawCross: function (x, y, color) {
        var canvas = this.ui.minimap;
        var ctx = canvas.getContext('2d');
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y * canvas.height);
        ctx.lineTo(canvas.width, y * canvas.height);
        ctx.moveTo(x * canvas.width, 0);
        ctx.lineTo(x * canvas.width, canvas.height);
        ctx.closePath();
        ctx.strokeStyle = color || '#FFFFFF';
        ctx.stroke();
    },

    createToken: function (id, color) {
        var mini_map_token = {
            id: id,
            color: color,
            x: 0,
            y: 0,
            size: 0
        };
        return mini_map_token;
    },

    registerToken: function (token) {
        if (this.ui.tokens[token.id] === undefined) {
            this.ui.tokens[token.id] = token;
        }
    },

    unregisterToken: function (id) {
        if (this.ui.tokens[id] !== undefined) {
            delete this.ui.tokens[id];
        }
    },

    updateToken: function (token) {
        if (this.ui.tokens[token.id] === undefined) {
            this.registerToken(token);
        }

        if (this.map_server === null || this.map_server.readyState !== window._WebSocket.OPEN) {
            if (this.options.enableMultiCells || -1 != this.current_cell_ids.indexOf(this.id)) {
                var size_n = token.size/this.getMapWidth();
                var map_token = this.ui.tokens[token.id];
                map_token.id = token.id;
                map_token.x = (token.x - this.start_x)/this.getMapWidth();
                map_token.y = (token.y - this.start_y)/this.getMapHeight();
                map_token.size = size_n;
            }
        }

        if (this.options.enablePosition && -1 != this.current_cell_ids.indexOf(this.id)) {
            this.ui.pos.show();
            this.updatePos(this.nx, this.ny);
        } else {
            this.ui.pos.hide();
        }


    },

    destroyCell: function (id) {
        delete this.cells[id];
        ret = this.current_cell_ids.indexOf(id);
        -1 != ret && this.current_cell_ids.splice(id, 1);
        if (this.map_server === null || this.map_server.readyState !== window._WebSocket.OPEN) {
            this.unregisterToken(id);
        }
    },

    updatePos: function (x, y) {
        this.ui.pos.text('x: ' + x.toFixed(0) + ', y: ' + y.toFixed(0));
    },

    reset: function () {
        this.cells = [];
        this.ui.tokens = [];
    },

    init: function () {
        this.ui.tokens = [];

        this.cells = [];
        this.current_cell_ids = [];
        this.start_x = -7000;
        this.start_y = -7000;
        this.end_x = 7000;
        this.end_y = 7000;

        // minimap dom
        if ($('#mini-map-wrapper').length === 0) {
            var wrapper = $('<div>').attr('id', 'mini-map-wrapper').css({
                position: 'fixed',
                bottom: 10,
                right: 10,
                width: 300,
                height: 300,
                background: 'rgba(128, 128, 128, 0.58)'
            });

            var minimap = $('<canvas>').attr({
                id: 'mini-map',
                width: 300,
                height: 300
            }).css({
                width: '100%',
                height: '100%',
                position: 'relative'
            });

            wrapper.append(minimap).appendTo(document.body);

            this.ui.minimap = minimap[0];
        }

        // minimap renderer
        if (this.render_timer === null)
            this.render_timer = setInterval(this.render.bind(this), 1000 / 30);

        // minimap location
        if ($('#mini-map-pos').length === 0) {
            this.ui.pos = $('<div>').attr('id', 'mini-map-pos').css({
                bottom: 10,
                right: 10,
                color: 'white',
                fontSize: 15,
                fontWeight: 800,
                position: 'fixed'
            }).appendTo(document.body);
        }

        // minimap options
        if ($('#mini-map-options').length === 0) {
            this.ui.options = $('<div>').attr('id', 'mini-map-options').css({
                bottom: 315,
                right: 10,
                color: '#666',
                fontSize: 14,
                position: 'fixed',
                fontWeight: 400,
                zIndex: 1000
            }).appendTo(document.body);

            var container = $('<div>')
                .css({
                    background: 'rgba(200, 200, 200, 0.58)',
                    padding: 5,
                    borderRadius: 5
                })
                .hide();

            for (var name in this.options) {

                var label = $('<label>').css({
                    display: 'block'
                });

                var checkbox = $('<input>').attr({
                    type: 'checkbox'
                }).prop({
                    checked: this.options[name]
                });

                label.append(checkbox);
                label.append(' ' + camel2cap(name));

                checkbox.click(function(options, name) { return function(evt) {
                    options[name] = evt.target.checked;
                }}(this.options, name));

                label.appendTo(container);
            }

            container.appendTo(this.ui.options);
            var form = $('<div>')
                .addClass('form-inline')
                .css({
                    opacity: 0.7,
                    marginTop: 2
                })
                .appendTo(this.ui.options);

            var form_group = $('<div>')
                .addClass('form-group')
                .appendTo(form);

            var setting_btn = $('<button>')
                .addClass('btn')
                .css({
                    float: 'right',
                    fontWeight: 800,
                    marginLeft: 2
                })
                .on('click', function() {
                    container.toggle();
                    setting_btn.blur();
                    return false;
                })
                .append($('<i>').addClass('glyphicon glyphicon-cog'))
                .appendTo(form_group);

            var help_btn = $('<button>')
                .addClass('btn')
                .text('?')
                .on('click', function(e) {
                    window.open('https://github.com/dimotsai/agar-mini-map/#minimap-server');
                    help_btn.blur();
                    return false;
                })
                .appendTo(form_group);

            var addressInput = $('<input>')
                .css({
                    marginLeft: 2
                })
                .attr('placeholder', 'ws://127.0.0.1:34343')
                .attr('type', 'text')
                .addClass('form-control')
                .val('ws://127.0.0.1:34343')
                .appendTo(form_group);

            var connect = function (evt) {
                var address = addressInput.val();

                connect_btn.popover('destroy');
                connect_btn.text('Disconnect');
                this.connectToServer(address, function onOpen() {
                    this.sendRawData(msgpack.pack({
                        type: 0,
                        data: player_name
                    }));
                    for (var i in this.current_cell_ids) {
                        this.sendRawData(msgpack.pack({
                            type: 32,
                            data: this.current_cell_ids[i]
                        }));
                    }
                    this.sendRawData(msgpack.pack({
                        type: 100,
                        data: {url: agar_server, region: $('#region').val(), gamemode: $('#gamemode').val(), party: location.hash}
                    }));
                    this.ui.party.show();
                }, function onClose() {
                    players = [];
                    id_players = [];
                    this.ui.party.hide();
                    disconnect();
                });

                connect_btn.off('click');
                connect_btn.on('click', disconnect);

                this.reset();

                connect_btn.blur();
            };

            var disconnect = function() {
                connect_btn.text('Connect');
                connect_btn.off('click');
                connect_btn.on('click', connect);
                connect_btn.blur();
                if (this.map_server)
                    this.map_server.close();

                this.reset();
            };

            var connect_btn = $('<button>')
                .attr('id', 'mini-map-connect-btn')
                .css({
                     marginLeft: 2
                })
                .text('Connect')
                .click(connect)
                .addClass('btn')
                .appendTo(form_group);
        }

        // minimap party
        if ($('#mini-map-party').length === 0) {
            var mini_map_party = this.ui.party = $('<div>')
                .css({
                    top: 50,
                    left: 10,
                    width: 200,
                    color: '#FFF',
                    fontSize: 20,
                    position: 'fixed',
                    fontWeight: 600,
                    background: 'rgba(128, 128, 128, 0.58)',
                    textAlign: 'center',
                    padding: 10
                })
                .attr('id', 'mini-map-party')
                .appendTo(window.document.body)
                .append(
                    $('<h3>').css({
                        margin: 0,
                        padding: 0
                    }).text('Party')
                );

            var mini_map_party_list = $('<ol>')
                .attr('id', 'mini-map-party-list')
                .css({
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                })
                .appendTo(mini_map_party);

            mini_map_party.on('update-list', function(e) {
                mini_map_party_list.empty();

                for (var p in players) {
                    var player = players[p];
                    var name = String.fromCharCode.apply(null, player.name);
                    name = (name == '' ? 'anonymous' : name);
                    $('<li>')
                        .text(player.no + 1 + '. ' + name)
                        .appendTo(mini_map_party_list);
                }
            });

            mini_map_party.hide();
        }
    }
};

(function() {
    var minimap = new MiniMap();
    window.minimap = minimap;

    // extract a websocket packet which contains the information of cells
    function extractCellPacket(data, offset) {
        ////
        var dataToSend = {
            destroyQueue : [],
            nodes : [],
            nonVisibleNodes : []
        };
        ////

        var I = +new Date;
        var qa = false;
        var b = Math.random(), c = offset;
        var size = data.getUint16(c, true);
        c = c + 2;

        // Nodes to be destroyed (killed)
        for (var e = 0; e < size; ++e) {
            var p = minimap.cells[data.getUint32(c, true)],
                f = minimap.cells[data.getUint32(c + 4, true)],
                c = c + 8;
            p && f && (
                f.destroy(),
                f.ox = f.x,
                f.oy = f.y,
                f.oSize = f.size,
                f.nx = p.x,
                f.ny = p.y,
                f.nSize = f.size,
                f.updateTime = I,
                dataToSend.destroyQueue.push(f.id),
                minimap.destroyCell(f.id));

        }

        // Nodes to be updated
        for (e = 0; ; ) {
            var d = data.getUint32(c, true);
            c += 4;
            if (0 == d) {
                break;
            }
            ++e;
            var p = data.getInt32(c, true),
                c = c + 4,
                f = data.getInt32(c, true),
                c = c + 4;
                g = data.getInt16(c, true);
                c = c + 2;
            for (var h = data.getUint8(c++), m = data.getUint8(c++), q = data.getUint8(c++), h = (h << 16 | m << 8 | q).toString(16); 6 > h.length; )
                h = "0" + h;

            var h = "#" + h,
                k = data.getUint8(c++),
                m = !!(k & 1),
                q = !!(k & 16);

            k & 2 && (c += 4);
            k & 4 && (c += 8);
            k & 8 && (c += 16);

            for (var n, k = ""; ; ) {
                n = data.getUint16(c, true);
                c += 2;
                if (0 == n)
                    break;
                k += String.fromCharCode(n)
            }

            n = k;
            k = null;

            var updated = false;
            // if d in cells then modify it, otherwise create a new cell
            minimap.cells.hasOwnProperty(d)
                ? (k = minimap.cells[d],
                   //k.updatePos(),
                   k.ox = k.x,
                   k.oy = k.y,
                   k.oSize = k.size,
                   k.color = h,
                   updated = true)
                : (minimap.cells[d] = k = new Cell(d, p, f, g, h, n),
                   k.pX = p,
                   k.pY = f);

            k.isVirus = m;
            k.isAgitated = q;
            k.nx = p;
            k.ny = f;
            k.nSize = g;
            k.updateCode = b;
            k.updateTime = I;
            n && k.setName(n);

            // ignore food creation
            if (updated) {
                var token = new Token(k.id, k.nx, k.ny, k.nSize, k.color);
                minimap.updateToken(token);
                dataToSend.nodes.push(token);
            }
        }

        // Destroy queue + nonvisible nodes
        b = data.getUint32(c, true);
        c += 4;
        for (e = 0; e < b; e++) {
            d = data.getUint32(c, true);
            c += 4, k = minimap.cells[d];
            null != k && k.destroy() && minimap.destroyCell(k.id);
            dataToSend.nonVisibleNodes.push(d);
        }

        var packet = {
            type: 16,
            data: dataToSend
        }

        minimap.sendRawData(msgpack.pack(packet));
    }

    // extract the type of packet and dispatch it to a corresponding extractor
    function extractPacket(event) {
        var c = 0;
        var data = new DataView(event.data);
        240 == data.getUint8(c) && (c += 5);
        var opcode = data.getUint8(c);
        c++;
        switch (opcode) {
            case 16: // cells data
                extractCellPacket(data, c);
                break;
            case 20: // cleanup ids
                minimap.current_cell_ids = [];
                break;
            case 32: // cell id belongs me
                var id = data.getUint32(c, true);

                if (minimap.current_cell_ids.indexOf(id) === -1)
                    minimap.current_cell_ids.push(id);

                minimap.sendRawData(msgpack.pack({
                    type: 32,
                    data: id
                }));
                break;
            case 64: // get borders
               minimap.start_x = data.getFloat64(c, true), c += 8;
               minimap.start_y = data.getFloat64(c, true), c += 8;
               minimap.end_x = data.getFloat64(c, true), c += 8;
               minimap.end_y = data.getFloat64(c, true), c += 8;
        }
    };

    function extractSendPacket(data) {
        var view = new DataView(data);
        switch (view.getUint8(0, true)) {
            case 0:
                minimap.player_name = [];
                for (var i=1; i < data.byteLength; i+=2) {
                    minimap.player_name.push(view.getUint16(i, true));
                }

                minimap.sendRawData(msgpack.pack({
                    type: 0,
                    data: minimap.player_name
                }));
                break;
        }
    }

    // the injected point, overwriting the WebSocket constructor
    window.WebSocket = function(url, protocols) {
        console.log('Listen');

        if (protocols === undefined) {
            protocols = [];
        }

        var ws = new _WebSocket(url, protocols);

        refer(this, ws, 'binaryType');
        refer(this, ws, 'bufferedAmount');
        refer(this, ws, 'extensions');
        refer(this, ws, 'protocol');
        refer(this, ws, 'readyState');
        refer(this, ws, 'url');

        this.send = function(data){
            extractSendPacket(data);
            return ws.send.call(ws, data);
        };

        this.close = function(){
            return ws.close.call(ws);
        };

        this.onopen = function(event){};
        this.onclose = function(event){};
        this.onerror = function(event){};
        this.onmessage = function(event){};

        ws.onopen = function(event) {
            minimap.init();
            agar_server = url;
            minimap.sendRawData(msgpack.pack({
                type: 100,
                data: {url: url, region: $('#region').val(), gamemode: $('#gamemode').val(), party: location.hash}
            }));
            if (this.onopen)
                return this.onopen.call(ws, event);
        }.bind(this);

        ws.onmessage = function(event) {
            extractPacket(event);
            if (this.onmessage)
                return this.onmessage.call(ws, event);
        }.bind(this);

        ws.onclose = function(event) {
            if (this.onclose)
                return this.onclose.call(ws, event);
        }.bind(this);

        ws.onerror = function(event) {
            if (this.onerror)
                return this.onerror.call(ws, event);
        }.bind(this);
    };

    window.WebSocket.prototype = _WebSocket;

    $(window.document).ready(function() {
        minimap.init();
    });

    $(window).load(function() {
        var main_canvas = document.getElementById('canvas');
        if (main_canvas && main_canvas.onmousemove) {
            document.onmousemove = main_canvas.onmousemove;
            main_canvas.onmousemove = null;
        }
    });
})();
