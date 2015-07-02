// ==UserScript==
// @name         agar-mini-map
// @namespace    http://github.com/dimotsai/
// @version      0.30
// @description  This script will show a mini map and your location on agar.io
// @author       dimotsai
// @license      MIT
// @match        http://agar.io/
// @grant        none
// @run-at       document-body
// ==/UserScript==

(function() {
    var _WebSocket = window.WebSocket;
    var $ = window.jQuery;

    var cells = [];
    var my_cell_ids = [];

    var options = {
        enableMultiCells: true,
        enablePosition: true
    };

    function miniMapCreateToken(id, color) {
        var mini_map_token = $('<div>').attr('id', 'mini-map-token-' + id).css({
            position: 'absolute',
            width: '5%',
            height: '5%',
            background: color,
            top: '0%',
            left: '0%',
            borderRadius: '50%'
        });
        return mini_map_token;
    }

    function miniMapRegisterToken(id, token) {
        if (window.mini_map_tokens[id] === undefined) {
            window.mini_map.append(token);
            window.mini_map_tokens[id] = token;
        }
    }

    function miniMapUnregisterToken(id) {
        if (window.mini_map_tokens[id] !== undefined) {
            window.mini_map_tokens[id].detach();
            delete window.mini_map_tokens[id];
        }
    }

    function miniMapIsRegisteredToken(id) {
        return window.mini_map_tokens[id] !== undefined;
    }

    function miniMapUpdateToken(id, x, y, size) {
        if (window.mini_map_tokens[id] !== undefined) {
            window.mini_map_tokens[id]
            .css({
                left:   x    * 100 + '%',
                top:    y    * 100 + '%',
                width:  size * 100 + '%',
                height: size * 100 + '%'
            });
            return true;
        } else {
            return false;
        }
    }

    function miniMapUpdatePos(x, y) {
        window.mini_map_pos.text('x: ' + x.toFixed(0) + ', y: ' + y.toFixed(0));
    }

    function miniMapInit() {
        var $ = window.jQuery;
        window.mini_map_tokens = {};

        if ($('#mini-map-wrapper').length === 0) {
            var wrapper = $('<div>').attr('id', 'mini-map-wrapper').css({
                position: 'fixed',
                bottom: 10,
                right: 10,
                width: 300,
                height: 300,
                background: 'rgba(128, 128, 128, 0.58)'
            });

            var mini_map = $('<div>').attr('id', 'mini-map').css({
                width: '100%',
                height: '100%',
                position: 'relative'
            });

            wrapper.append(mini_map).appendTo(document.body);

            window.mini_map = mini_map;
        }

        if ($('#mini-map-pos').length === 0) {
            window.mini_map_pos = $('<div>').attr('id', 'mini-map-pos').css({
                bottom: 10,
                right: 10,
                color: 'white',
                fontSize: 15,
                fontWeight: 800,
                position: 'fixed',
                padding: '0px 10px'
            }).appendTo(document.body);
        }

    }

    // cell constructor
    function Cell(id, x, y, size, color, name) {
        cells[id] = this;
        this.id = id;
        this.ox = this.x = x;
        this.oy = this.y = y;
        this.oSize = this.size = size;
        this.color = color;
        this.points = [];
        this.pointsAcc = [];
        this.setName(name);
    }

    Cell.prototype = {
        id: 0,
        points: null,
        pointsAcc: null,
        name: null,
        nameCache: null,
        sizeCache: null,
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
        drawTime: 0,
        destroyed: false,
        isVirus: false,
        isAgitated: false,
        wasSimpleDrawing: true,

        destroy: function() {
            delete cells[this.id];
            id = my_cell_ids.indexOf(this.id);
            -1 != id && my_cell_ids.splice(id, 1);
            this.destroyed = true;
            miniMapUnregisterToken(this.id);
        },
        setName: function(name) {
            this.name = name;
        },
        updatePos: function() {
            if (options.enableMultiCells || -1 != my_cell_ids.indexOf(this.id)) {
                if (! miniMapIsRegisteredToken(this.id))
                {
                    miniMapRegisterToken(
                        this.id,
                        miniMapCreateToken(this.id, this.color)
                    );
                }

                var size_n = this.nSize/7000;
                miniMapUpdateToken(this.id, (this.nx+7000)/14000 - size_n / 2, (this.ny+7000)/14000 - size_n / 2, size_n);
            }

            if (options.enablePosition && -1 != my_cell_ids.indexOf(this.id)) {
                miniMapUpdatePos(this.nx, this.ny);
            }
        }
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
    };

    // extract a websocket packet which contains the information of cells
    function extractCellPacket(data, offset) {
        var I = +new Date;
        var qa = false;
        var b = Math.random(), c = offset;
        var size = data.getUint16(c, true);
        c = c + 2;

        // destroy foods? (or cells?)
        for (var e = 0; e < size; ++e) {
            var p = cells[data.getUint32(c, true)],
                f = cells[data.getUint32(c + 4, true)],
                c = c + 8;
            p && f && (
                f.destroy(),
                f.ox = f.x,
                f.oy = f.y,
                f.oSize = f.size,
                f.nx = p.x,
                f.ny = p.y,
                f.nSize = f.size,
                f.updateTime = I)
        }

        // update or create cells (player)
        for (e = 0; ; ) {
            var d = data.getUint32(c, true);
            c += 4;
            if (0 == d) {
                break;
            }
            ++e;
            var p = data.getInt16(c, true),
                c = c + 2,
                f = data.getInt16(c, true),
                c = c + 2;
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

            // if d in cells then modify it, otherwise create a new cell
            cells.hasOwnProperty(d)
                ? (k = cells[d], k.updatePos(),
                   k.ox = k.x,
                   k.oy = k.y,
                   k.oSize = k.size,
                   k.color = h)
                : (k = new Cell(d, p, f, g, h, n),
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
        }

        // destroy cells(?)
        b = data.getUint32(c, true);
        c += 4;
        for (e = 0; e < b; e++)
            d = data.getUint32(c, true),
            c += 4, k = cells[d],
            null != k && k.destroy();
    }

    // extract the type of packet and dispatch it to a corresponding extractor
    function extractPacket(event) {
        var c = 0;
        var data = new DataView(event.data);
        240 == data.getUint8(c) && (c += 5);
        switch (data.getUint8(c++)) {
            case 16: // cells data
                extractCellPacket(data, c);
                break;
            case 20: // cleanup ids
                my_cell_ids = [];
                break;
            case 32: // cell id belongs me
                var id = data.getUint32(c, true);
                my_cell_ids.push(id);
                break;
        }
    };

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
            return ws.send.call(ws, data);
        };

        this.close = function(code, reason){
            return ws.close.call(ws, code, reason);
        };

        this.onopen = function(event){};
        this.onclose = function(event){};
        this.onerror = function(event){};
        this.onmessage = function(event){};

        ws.onopen = function(event) {
            return this.onopen.call(ws, event);
        }.bind(this);

        ws.onmessage = function(event) {
            extractPacket(event);
            return this.onmessage.call(ws, event);
        }.bind(this);

        ws.onclose = function(event) {
            return this.onclose.call(ws, event);
        }.bind(this);

        ws.onerror = function(event) {
            return this.onerror.call(ws, event);
        }.bind(this);
    };

    window.WebSocket.prototype = _WebSocket;

    $(window.document).ready(function() {
        miniMapInit();
    })
})();
