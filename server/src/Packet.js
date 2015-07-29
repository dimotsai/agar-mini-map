class Packet
{
    constructor(packet) {
        this.type = packet.type;
        this.data = packet.data;
    }
}

export default Packet;

// operations for server
Packet.TYPE_SET_NICKNAME = 0;
Packet.TYPE_UPDATE_NODES = 16;
Packet.TYPE_CLEAR_NODES = 20;
Packet.TYPE_ADD_NODE = 32;
Packet.TYPE_UPDATE_ADDRESS = 100;

// operations for client
Packet.TYPE_UPDATE_MAP = 128;
Packet.TYPE_UPDATE_PLAYERS = 129;
Packet.TYPE_SERVER_ADDRESS = 130;
