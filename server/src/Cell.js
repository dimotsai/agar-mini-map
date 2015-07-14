import assign from 'object-assign';

class Cell
{
    /**
     * Constructor
     *
     * @param int id cell id
     */
    constructor()
    {
        this.id = 0;
        this.x = 0.0;
        this.y = 0.0;
        this.size = 0.0;
        this.color = 0;
    }
}

export default Cell;
