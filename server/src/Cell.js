import assign from 'object-assign';

class Cell
{
    /**
     * Constructor
     *
     * @param int id cell id
     */
    constructor(id)
    {
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.size = 0;
        this.isAlly = false;
    }

    /**
     * Set position
     *
     * @param float x normalized x
     * @param float y normalized y
     */
    setPosition(x, y)
    {
        this.x = x;
        this.y = y;
    }

    /**
     * Set size
     *
     * @param float size normalized size
     */
    setSize(size)
    {
        this.size = size;
    }

    /**
     * Deserialize
     *
     * @param string data
     * @return Array
     */
    static parse(data)
    {
         var obj = JSON.parse(data);

         var objs = [];

         var cells = [];

         if (Array.isArray(obj)) {
            objs = obj;
         } else {
            objs.push(obj);
         }

         objs.forEach(function each(obj) {
             var cell = new Cell(obj.id);

             assign(cell, obj);

             cells.push(cell);
         });

         return cells;
    }

    /**
     * Serialize
     *
     * @return string
     */
    serialize()
    {
         return JSON.stringify(this);
    }
}

export default Cell;
