import _ from 'lodash';

class MiniMap
{
    constructor() {
        this.cells = [];
    }

    mergeFromPlayers(players) {
        var cells = [];

        var diff = {
            addition: [],
            deletion: []
        };


        for (var p in players) {
            var player = players[p];

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
}

export default MiniMap;
