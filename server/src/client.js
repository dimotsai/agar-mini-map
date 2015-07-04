import WebSocket from 'ws';
import Cell from './Cell.js';

var ws = new WebSocket('ws://127.0.0.1:34343');

function generateCellData(ws)
{
    var cells = [];

    for (var i=0; i<5; i++) {
        var cell = new Cell(Math.round(Math.random() * 100) % 100);

        cell.setPosition(Math.random(), Math.random());
        cell.setSize(Math.random());

        cells.push(cell);
    }

    ws.send(JSON.stringify(cells));

    console.log('Send', cells);
}

ws.on('open', function open() {
    process.stdin.on('readable', function readable() {
        var chunk = process.stdin.read();
        if (chunk !== null) {
            generateCellData(ws);
        }
    });

    ws.on('message', function message(data) {
        console.log('Receive', Cell.parse(data));
    });
});

