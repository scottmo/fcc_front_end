'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CELL = {
  WALL: '#',
  ROOM: ' '
};

var DungeonGenerator = function () {
  //public

  function DungeonGenerator(config) {
    _classCallCheck(this, DungeonGenerator);

    this.DEFAULT_CONFIG = {
      mapSize: 50,
      roomCount: 10,
      roomMinSize: 5,
      roomMaxSize: 15
    };
    Object.assign(this, this.DEFAULT_CONFIG, config);
  }

  DungeonGenerator.prototype.generate = function generate() {
    // init grid with walls
    var grid = [];
    this._drawRect(grid, CELL.WALL, {
      x: 0,
      y: 0,
      w: this.mapSize,
      h: this.mapSize
    });

    // randomly put rooms on map and connect them
    var rooms = this._connectRooms(this._compactRooms(this._generateRooms()));

    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      this._drawRect(grid, CELL.ROOM, room);

      var neighbor = room.neighbor;
      if (neighbor) {
        this._drawTunnel(grid, CELL.ROOM, room, neighbor);
      }
    }
    return grid;
  };

  // private
  // get uniformly distributed random int between min and max

  DungeonGenerator.prototype._getRandomInt = function _getRandomInt(min, max) {
    return ~ ~(Math.random() * (max - min) + min);
  };

  // fill a 2D rect with $cell starting from grid[y][x]

  DungeonGenerator.prototype._drawRect = function _drawRect(grid, cell, _ref) {
    var x = _ref.x;
    var y = _ref.y;
    var w = _ref.w;
    var h = _ref.h;

    for (var row = 0; row < h; row++) {
      if (typeof grid[row + y] === "undefined") {
        grid[row + y] = [];
      }
      for (var col = 0; col < w; col++) {
        grid[row + y][col + x] = cell;
      }
    }
  };

  // draw a tunnel between 2 rooms

  DungeonGenerator.prototype._drawTunnel = function _drawTunnel(grid, cell, room1, room2) {
    var end1 = {
      x: this._getRandomInt(room1.x, room1.x + room1.w),
      y: this._getRandomInt(room1.y, room1.y + room1.h)
    };
    var end2 = {
      x: this._getRandomInt(room2.x, room2.x + room2.w),
      y: this._getRandomInt(room2.y, room2.y + room2.h)
    };
    while (end1.x != end2.x) {
      end1.x > end2.x ? end1.x-- : end1.x++;
      grid[end1.y][end1.x] = cell;
    }
    while (end1.y != end2.y) {
      end1.y > end2.y ? end1.y-- : end1.y++;
      grid[end1.y][end1.x] = cell;
    }
  };

  // check if room "check" is overlapping any of the rooms

  DungeonGenerator.prototype._isOverlapped = function _isOverlapped(check, rooms) {
    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      if (check === room) continue;
      // any of the 4 following conditions makes overlapping impossible
      if (!(check.x + check.w < room.x || // check's right not touching room's left
      check.y + check.h < room.y || // check's bottom not touching room's top
      room.x + room.w < check.x || // room's right not touching check's left
      room.y + room.h < check.y // room's bottom not touching check's top
      )) {
          return true;
        }
    }
    return false;
  };

  // return a set of rooms with random locations/sizes

  DungeonGenerator.prototype._generateRooms = function _generateRooms() {
    var rooms = [];
    while (rooms.length < this.roomCount) {
      var room = {
        x: this._getRandomInt(1, this.mapSize - this.roomMaxSize - 1),
        y: this._getRandomInt(1, this.mapSize - this.roomMaxSize - 1),
        w: this._getRandomInt(this.roomMinSize, this.roomMaxSize),
        h: this._getRandomInt(this.roomMinSize, this.roomMaxSize)
      };

      if (!this._isOverlapped(room, rooms)) {
        rooms.push(room);
      }
    }
    return rooms;
  };

  DungeonGenerator.prototype._getCenter = function _getCenter(room) {
    return {
      x: room.x + room.w / 2,
      y: room.y + room.h / 2
    };
  };

  DungeonGenerator.prototype._getClosestRoom = function _getClosestRoom(currentRoom, rooms) {
    var center = this._getCenter(currentRoom);
    var closestRoom = null;
    var closestDistance = Math.pow(this.mapSize, 2);
    for (var i = 0; i < rooms.length; i++) {
      var neighbor = rooms[i];
      if (neighbor !== currentRoom && !neighbor.linked) {
        var neighborCenter = this._getCenter(neighbor);
        var distance = Math.abs(center.x - neighbor.x) + Math.abs(center.y - neighbor.y);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestRoom = neighbor;
        }
      }
    }
    return closestRoom;
  };

  // connect rooms with tunnels

  DungeonGenerator.prototype._connectRooms = function _connectRooms(rooms) {
    var currentRoom = rooms[0];
    for (var i = 0; i < rooms.length - 1; i++) {
      currentRoom.linked = true;
      var neighbor = this._getClosestRoom(currentRoom, rooms);
      currentRoom.neighbor = neighbor;
      currentRoom = neighbor;
    }
    // have the tail connect to some other node
    currentRoom.neighbor = rooms[this._getRandomInt(0, rooms.length - 2)];
    return rooms;
  };

  // nudge rooms towards the center to make tunnels shorter

  DungeonGenerator.prototype._compactRooms = function _compactRooms(rooms) {
    var center = {
      x: this.mapSize / 2,
      y: this.mapSize / 2
    };
    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      while (room.x !== center.x) {
        var oldx = room.x;
        if (room.x < center.x) room.x++;else if (room.x > center.x) room.x--;
        if (this._isOverlapped(room, rooms)) {
          room.x = oldx;
          break;
        }
      }
      while (room.y !== center.y) {
        var oldy = room.y;
        if (room.y < center.y) room.y++;else if (room.y > center.y) room.y--;
        if (this._isOverlapped(room, rooms)) {
          room.y = oldy;
          break;
        }
      }
    }
    return rooms;
  };

  return DungeonGenerator;
}();

// a way to avoid import to execute this

if (document.getElementById("__main__")) {
  var Renderer = function () {
    function Renderer() {
      _classCallCheck(this, Renderer);
    }

    Renderer.prototype.printGrid = function printGrid(grid) {
      var output = '';
      for (var i = 0; i < grid.length; i++) {
        output += grid[i].join('') + '\n';
      }
      console.log(output);
    };

    Renderer.prototype.initializeCanvas = function initializeCanvas(id, width, height, scale) {
      this.canvas = document.getElementById(id);
      this.canvas.width = width * scale;
      this.canvas.height = height * scale;
      this.ctx = this.canvas.getContext('2d');
      this.scale = scale;
    };

    Renderer.prototype.drawCanvas = function drawCanvas(grid) {
      var ctx = this.ctx;
      var scale = this.scale;

      // var canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var numRows = grid.length;
      var numCols = grid[0].length;
      for (var y = 0; y < numRows; y++) {
        for (var x = 0; x < numCols; x++) {
          var cell = grid[y][x];
          switch (cell) {
            case CELL.WALL:
              ctx.fillStyle = '#304d5d';
              break;
            case CELL.ROOM:
              ctx.fillStyle = '#6699cc';
              break;
            default:
              ctx.fillStyle = '#FFFFFF';
          }
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    };

    return Renderer;
  }();

  var dungeon = new DungeonGenerator();
  var renderer = new Renderer();
  renderer.initializeCanvas("grid", dungeon.mapSize, dungeon.mapSize, 10);
  renderer.drawCanvas(dungeon.generate());

  var button = document.getElementById("reset");
  if (reset) {
    button.addEventListener("click", function () {
      renderer.drawCanvas(dungeon.generate());
    });
  }
}