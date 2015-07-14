import _ from 'lodash';

class MiniMap
{
    constructor() {
        this.cells = [];
        this.players = [];
    }

    mergeFromPlayers(players) {
        var cells = [];

        var diff = {
            addition: [],
            deletion: []
        };

        for (var p in players) {
            var player = players[p];
            this.players[player.no] = {
                no: player.no,
                ids: player.ids
            };

            for (var c in player.cells) {
                var cell = player.cells[c];
                var ocell = this.cells[c];
                /*if (!_.isEqual(cell, this.cells[cell.id])) {*/
                if (ocell === undefined
                    || ocell.x != cell.x
                    || ocell.y != cell.y
                    || ocell.size != cell.size) {
                    diff.addition.push(cell);
                }
                /*}*/
                cells[cell.id] = _.clone(cell);
            }
        }

        for (var c in this.cells) {
            if (cells[c] === undefined) {
                diff.deletion.push(this.cells[c].id);
            }
        }

        this.cells = cells;

        return diff;
    }

    getCompactData() {
        var ret = {
            cells: [],
            players: []
        }

        for (var c in this.cells) {
            ret.cells.push(this.cells[c]);
        }

        for (var p in this.players) {
            ret.players.push(this.players[p]);
        }

        return ret;
    }
}

export default MiniMap;
