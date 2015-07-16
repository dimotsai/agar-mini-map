import Cell from './Cell.js';
import _ from 'lodash';

class Player
{
    /**
     * Constructor
     *
     * @param int no id of player
     * @param string address
     * @param int port
     */
    constructor(no, address, port) {
        this.no = no;
        this.address = address;
        this.port = port;

        // save as char code array
        this.name = [];

        this.ids = [];
        this.cells = [];
        this.server = '';

        // only mutate for updateNodes
        this.shouldUpdate = true;
    }

    /**
     * Get the address with port
     *
     * @return string
     */
    getFullAddress() {
        return this.address + ':' + this.port;
    }

    /**
     * Get the name string instead of char code array
     *
     * @return string
     */
    getNameString() {
        return String.fromCharCode.apply(null, this.name);
    }

    updateNodes(data) {
        var destroyQueue = data.destroyQueue;
        var nodes = data.nodes;
        var nonVisibleNodes = data.nonVisibleNodes;

        this.shouldUpdate = false;

        for (var i=0; i < destroyQueue.length; ++i) {
            delete this.cells[destroyQueue[i].node];

            var index = this.ids.indexOf(destroyQueue[i].node);

            if (index != -1) {
                this.ids.splice(index, 1);
                this.shouldUpdate = true;
            }
        }

        for (var i=0; i < nodes.length; ++i) {
            if (this.cells[nodes[i].id] === undefined)
                this.cells[nodes[i].id] = new Cell();
            _.assign(this.cells[nodes[i].id], nodes[i]);
        }

        for (var i=0;  i < nonVisibleNodes.length; ++i) {
            delete this.cells[nonVisibleNodes[i]];
        }
    }

    addNode(id) {
        if (!_.includes(this.ids, id))
            this.ids.push(id);
    }
}

export default Player;
