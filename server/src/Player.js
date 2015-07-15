import Cell from './Cell.js';
import assign from 'object-assign';

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
        this.ids = [];
        this.cells = [];
        this.server = '';
    }

    /**
     * Get the address with port
     *
     * @return string
     */
    getFullAddress() {
        return this.address + ':' + this.port;
    }

    updateNodes(data) {
        var destroyQueue = data.destroyQueue;
        var nodes = data.nodes;
        var nonVisibleNodes = data.nonVisibleNodes;

        for (var i=0; i < destroyQueue.length; ++i) {
            delete this.cells[destroyQueue[i].node];
        }

        for (var i=0; i < nodes.length; ++i) {
            if (this.cells[nodes[i].id] === undefined)
                this.cells[nodes[i].id] = new Cell();
            assign(this.cells[nodes[i].id], nodes[i]);
        }

        for (var i=0;  i < nonVisibleNodes.length; ++i) {
            delete this.cells[nonVisibleNodes[i]];
        }
    }

    addNode(id) {
        this.ids.push(id);
    }
}

export default Player;
