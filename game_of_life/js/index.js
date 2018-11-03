'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _class3;

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

/**
 * Game Rules
 * - Any live cell with < 2 live neighbours dies
 * - Any live cell with 2 or 3 live neighbours lives on to the next generation.
 * - Any live cell with more > 3 live neighbours dies
 * - Any dead cell with 3 live neighbours becomes a live cell
 */

/****************************************/
/* imports-ish
/****************************************/
var _mobxReact = mobxReact;
var observer = _mobxReact.observer;
var _mobx = mobx;
var observable = _mobx.observable;
var computed = _mobx.computed;

/****************************************/
/* Constants
/****************************************/

var BASE_DELAY = 100;
var GAME_STATUS = { RUN: Symbol('RUN'), PAUSE: Symbol('PAUSE') };
var CELL_STATUS = { DEAD: 0, LIVE: 1, OLD: 2 };
var BOARD_SIZE = {
  small: { w: 50, h: 30 },
  medium: { w: 70, h: 50 },
  large: { w: 100, h: 80 }
};

/****************************************/
/* Store
/****************************************/
var GameOfLifeStore = (_class = function () {
  function GameOfLifeStore() {
    _classCallCheck(this, GameOfLifeStore);

    _initDefineProp(this, 'cells', _descriptor, this);

    _initDefineProp(this, 'generations', _descriptor2, this);

    _initDefineProp(this, 'speedModifier', _descriptor3, this);

    _initDefineProp(this, 'status', _descriptor4, this);

    _initDefineProp(this, 'boardSize', _descriptor5, this);
  }

  GameOfLifeStore.prototype.reset = function reset() {
    var newCells = [];
    for (var i = 0; i < this.numCells; i++) {
      newCells.push(CELL_STATUS.DEAD);
    }
    this.cells = newCells;
    this.generations = 0;
    this.status = GAME_STATUS.PAUSE;
  };

  GameOfLifeStore.prototype.toggleCell = function toggleCell(id) {
    var cellStatus = this.cells[id];
    this.cells[id] = cellStatus === CELL_STATUS.DEAD ? CELL_STATUS.LIVE : CELL_STATUS.DEAD;
  };

  GameOfLifeStore.prototype.randomizeCells = function randomizeCells() {
    var newCells = [];
    for (var i = 0; i < this.numCells; i++) {
      newCells.push(this.getRandomCellState());
    }
    this.cells = newCells;
  };

  GameOfLifeStore.prototype.getRandomCellState = function getRandomCellState() {
    // dead cell gets higher chance
    // to make patches of live cell instead of half dead/live
    var random = Math.floor(Math.random() * 5);
    if (random === 0) {
      return CELL_STATUS.LIVE;
    } else {
      return CELL_STATUS.DEAD;
    }
  };

  GameOfLifeStore.prototype.computeNextGeneration = function computeNextGeneration() {
    var newCells = [];
    for (var i = 0; i < this.numCells; i++) {
      newCells.push(this.getNextGenerationCell(this.cells, i));
    }
    this.generations++;
    this.cells = newCells;
  };

  GameOfLifeStore.prototype.getNextGenerationCell = function getNextGenerationCell(cells, id) {
    var liveCount = this.getLiveNeighborCount(cells, id);
    // gist of game of life
    if (cells[id] === CELL_STATUS.DEAD) {
      return liveCount === 3 ? CELL_STATUS.LIVE : CELL_STATUS.DEAD;
    } else {
      // live and old
      return liveCount < 2 || liveCount > 3 ? CELL_STATUS.DEAD : CELL_STATUS.OLD;
    }
  };

  GameOfLifeStore.prototype.getLiveNeighborCount = function getLiveNeighborCount(cells, id) {
    var liveCount = 0;
    var col = id % this.width;
    for (var key in this.neighborDiff) {
      if (col === 0 && key === "colL") continue; // no left neighbors
      if (col === 29 && key === "colR") continue; // no right neighbors
      for (var i = 0; i < this.neighborDiff[key].length; i++) {
        var neighborId = id + this.neighborDiff[key][i];
        if (neighborId >= 0 && neighborId < this.numCells && cells[neighborId] !== CELL_STATUS.DEAD) {
          liveCount++;
        }
      }
    }
    return liveCount;
  };

  _createClass(GameOfLifeStore, [{
    key: 'neighborDiff',
    get: function get() {
      return {
        colL: [-(this.width + 1), -1, this.width - 1],
        colM: [-this.width, this.width],
        colR: [-(this.width - 1), 1, this.width + 1]
      };
    }
  }, {
    key: 'numCells',
    get: function get() {
      return this.width * this.height;
    }
  }, {
    key: 'width',
    get: function get() {
      return BOARD_SIZE[this.boardSize].w;
    }
  }, {
    key: 'height',
    get: function get() {
      return BOARD_SIZE[this.boardSize].h;
    }
  }]);

  return GameOfLifeStore;
}(), (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'cells', [observable], {
  enumerable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'generations', [observable], {
  enumerable: true,
  initializer: function initializer() {
    return 0;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'speedModifier', [observable], {
  enumerable: true,
  initializer: function initializer() {
    return 1;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'status', [observable], {
  enumerable: true,
  initializer: function initializer() {
    return GAME_STATUS.RUN;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'boardSize', [observable], {
  enumerable: true,
  initializer: function initializer() {
    return "small";
  }
}), _applyDecoratedDescriptor(_class.prototype, 'neighborDiff', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'neighborDiff'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'numCells', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'numCells'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'width', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'width'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'height', [computed], Object.getOwnPropertyDescriptor(_class.prototype, 'height'), _class.prototype)), _class);

/****************************************/
/* Components
/****************************************/

/*
 *Button
 */

var Button = function Button(_ref) {
  var className = _ref.className;
  var onClick = _ref.onClick;
  var label = _ref.label;

  return React.createElement(
    'button',
    { className: className, onClick: onClick },
    label
  );
};
Button.propTypes = {
  className: React.PropTypes.string,
  onClick: React.PropTypes.func.isRequired,
  label: React.PropTypes.string.isRequired
};

/*
 * Cell
 */
var Cell = observer(function (_ref2) {
  var id = _ref2.id;
  var status = _ref2.status;

  var statusClass = undefined;
  if (status === CELL_STATUS.LIVE) {
    statusClass = "live";
  } else if (status === CELL_STATUS.OLD) {
    statusClass = "old";
  } else {
    statusClass = "dead";
  }
  return React.createElement('div', { id: id, className: "cell " + statusClass });
});
Cell.propTypes = {
  id: React.PropTypes.string.isRequired,
  status: React.PropTypes.string.isRequired
};

/*
 * Board
 */
var Board = observer(function (_ref3) {
  var cells = _ref3.cells;
  var className = _ref3.className;
  var width = _ref3.width;
  var height = _ref3.height;
  var onCellClick = _ref3.onCellClick;

  onCellClick = onCellClick || function () {};
  className = className || "";

  var rows = [];
  var id = 0;
  for (var r = 0; r < height; r++) {
    var row = [];
    for (var c = 0; c < width; c++) {
      row.push(React.createElement(Cell, { status: cells[id], id: id }));
      id++;
    }
    rows.push(row);
  }

  return React.createElement(
    'div',
    { className: "board " + className,
      onClick: function onClick(e) {
        return onCellClick(e.target);
      }
    },
    rows.map(function (row) {
      return React.createElement(
        'div',
        { className: 'row' },
        row
      );
    })
  );
});
Board.propTypes = {
  cells: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired
};

/*
 * GameOfLife
 */

var GameOfLife = observer(_class3 = function (_React$Component) {
  _inherits(GameOfLife, _React$Component);

  function GameOfLife(props) {
    _classCallCheck(this, GameOfLife);

    var _this = _possibleConstructorReturn(this, _React$Component.call(this, props));

    props.store.randomizeCells();
    return _this;
  }

  GameOfLife.prototype.componentDidMount = function componentDidMount() {
    var store = this.props.store;

    var timeout;
    var updateBoard = function updateBoard() {
      if (store.status === GAME_STATUS.RUN) {
        store.computeNextGeneration();
      }
      timeout = setTimeout(updateBoard, BASE_DELAY / store.speedModifier);
    };
    timeout = setTimeout(updateBoard, BASE_DELAY / store.speedModifier);
  };

  GameOfLife.prototype.render = function render() {
    var store = this.props.store;

    return React.createElement(
      'div',
      null,
      React.createElement(
        'h1',
        null,
        'Game Of Life'
      ),
      React.createElement(
        'div',
        { className: 'controlPanel' },
        React.createElement(
          'p',
          { className: 'panelText' },
          'Generations ',
          store.generations
        ),
        React.createElement(
          'div',
          { className: 'controlGroup' },
          React.createElement(Button, { label: 'RUN',
            className: 'btn btn-success',
            onClick: function onClick() {
              return store.status = GAME_STATUS.RUN;
            } }),
          React.createElement(Button, { label: 'PAUSE',
            className: 'btn btn-danger',
            onClick: function onClick() {
              return store.status = GAME_STATUS.PAUSE;
            } }),
          React.createElement(Button, { label: 'RESET',
            className: 'btn btn-info',
            onClick: function onClick() {
              return store.reset();
            } }),
          React.createElement(Button, { label: 'Randomize',
            className: 'btn btn-default',
            onClick: function onClick() {
              return store.randomizeCells();
            } })
        ),
        React.createElement(
          'div',
          { className: 'controlGroup' },
          React.createElement(Button, { label: 'SLOW',
            className: 'btn btn-info',
            onClick: this.setSpeedModifier.bind(this, 1) }),
          React.createElement(Button, { label: 'MEDIUM',
            className: 'btn btn-primary',
            onClick: this.setSpeedModifier.bind(this, 2) }),
          React.createElement(Button, { label: 'FAST',
            className: 'btn btn-danger',
            onClick: this.setSpeedModifier.bind(this, 3) })
        ),
        React.createElement(
          'div',
          { className: 'controlGroup' },
          React.createElement(Button, { label: BOARD_SIZE.small.w + "x" + BOARD_SIZE.small.h,
            className: 'btn btn-default',
            onClick: this.setSize.bind(this, "small") }),
          React.createElement(Button, { label: BOARD_SIZE.medium.w + "x" + BOARD_SIZE.medium.h,
            className: 'btn btn-default',
            onClick: this.setSize.bind(this, "medium") }),
          React.createElement(Button, { label: BOARD_SIZE.large.w + "x" + BOARD_SIZE.large.h,
            className: 'btn btn-default',
            onClick: this.setSize.bind(this, "large") })
        )
      ),
      React.createElement(Board, {
        cells: store.cells,
        className: store.boardSize,
        width: store.width, height: store.height,
        onCellClick: this.onCellClick.bind(this) })
    );
  };

  GameOfLife.prototype.onCellClick = function onCellClick(cell) {
    this.props.store.toggleCell(parseInt(cell.id));
    this.props.store.status = GAME_STATUS.PAUSE;
  };

  GameOfLife.prototype.setSpeedModifier = function setSpeedModifier(speedModifier) {
    this.props.store.speedModifier = speedModifier;
  };

  GameOfLife.prototype.setSize = function setSize(size) {
    var store = this.props.store;

    store.boardSize = size;
    store.reset();
  };

  return GameOfLife;
}(React.Component)) || _class3;

GameOfLife.propTypes = {
  store: React.PropTypes.object.isRequired
};

// index
var gameStore = new GameOfLifeStore();
ReactDOM.render(React.createElement(GameOfLife, { store: gameStore }), document.getElementById('root'));