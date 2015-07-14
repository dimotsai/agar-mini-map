class Packet
{
    constructor(packet) {
        this.type = packet.type;
        this.data = packet.data;
    }
}

export default Packet;

Packet.TYPE_UPDATE_NODES = 16;
Packet.TYPE_CLEAR_NODES = 20;
Packet.TYPE_ADD_NODE = 32;
Packet.TYPE_UPDATE_MAP = 128;
