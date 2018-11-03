'use strict';

/*****************************************
 * Game Logic
 *****************************************/
var WIN_COMBO = [[0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontal
[0, 3, 6], [1, 4, 7], [2, 5, 8], // vertical
[0, 4, 8], [2, 4, 6] // diagonal
];

function hasWon(marker, cells) {
  var cellIndex, i;
  for (i = 0; i < WIN_COMBO.length; i++) {
    cellIndex = WIN_COMBO[i];
    if (cells[cellIndex[0]] === marker && cells[cellIndex[1]] === marker && cells[cellIndex[2]] === marker) {
      return true;
    }
  }
  return false;
}

function markCell(marker, pos, cells) {
  var newCells = cells.slice();
  newCells[pos] = marker;
  return newCells;
}

function getScore(markers, cells) {
  if (hasWon(markers.player, cells)) {
    return -1;
  } else if (hasWon(markers.AI, cells)) {
    return 1;
  } else {
    return 0;
  }
}

function updateBoard(pos, marker, board) {
  board.cells[pos] = marker;
  board.freeCells.splice(board.freeCells.indexOf(pos), 1);
}

function cloneBoard(board) {
  return {
    cells: board.cells.slice(),
    freeCells: board.freeCells.slice()
  };
}

// our score is pretty small, so no need to get actual INF
var POS_INF = 999;
var NEG_INF = -999;

function minmax(markers, board, maximizingAI) {
  var cells = board.cells;
  var freeCells = board.freeCells;

  var score = getScore(markers, cells);
  if (score !== 0 || freeCells.length === 0) {
    return [score, -1];
  }

  var bestScore = undefined,
      bestMove = undefined,
      subScore = undefined,
      subMove = undefined,
      nextMove = undefined,
      nextBoard = undefined,
      i = undefined;
  if (maximizingAI) {
    bestScore = NEG_INF;
    for (i = 0; i < freeCells.length; i++) {
      nextMove = freeCells[i];
      nextBoard = cloneBoard(board);
      updateBoard(nextMove, markers.AI, nextBoard);

      var _minmax = minmax(markers, nextBoard, false);

      subScore = _minmax[0];
      subMove = _minmax[1];

      if (subScore > bestScore) {
        bestScore = subScore;
        bestMove = nextMove;
      }
    }
    return [bestScore, bestMove];
  } else {
    bestScore = POS_INF;
    for (i = 0; i < freeCells.length; i++) {
      nextMove = freeCells[i];
      nextBoard = cloneBoard(board);
      updateBoard(nextMove, markers.player, nextBoard);

      var _minmax2 = minmax(markers, nextBoard, true);

      subScore = _minmax2[0];
      subMove = _minmax2[1];

      if (subScore < bestScore) {
        bestScore = subScore;
        bestMove = nextMove;
      }
    }
    return [bestScore, bestMove];
  }
}

function computerRandomMove(marker, board) {
  var randIndex = Math.floor(Math.random() * board.freeCells.length);
  board = cloneBoard(board);
  updateBoard(randIndex, marker, board);
  return board;
}

function AIThink(markers, board) {
  var _minmax3 = minmax(markers, board, true);

  var bestScore = _minmax3[0];
  var bestMove = _minmax3[1];

  return bestMove;
}

function computeNextTurn(move, marker, board) {
  board = cloneBoard(board);
  updateBoard(move, marker, board);
  var won = hasWon(marker, board.cells);
  var draw = !won && board.freeCells.length === 0;
  return [board, won, draw];
}

function computeGameUpdates(playerMove, markers, board) {
  var won = undefined,
      lost = undefined,
      draw = undefined;
  won = lost = draw = false;

  // player turn
  if (playerMove > -1 || playerMove < 9) {
    var _computeNextTurn = computeNextTurn(playerMove, markers.player, board);

    board = _computeNextTurn[0];
    won = _computeNextTurn[1];
    draw = _computeNextTurn[2];
  }

  // AI turn
  if (!won && !draw) {
    var AIMove = AIThink(markers, board);

    var _computeNextTurn2 = computeNextTurn(AIMove, markers.AI, board);

    board = _computeNextTurn2[0];
    lost = _computeNextTurn2[1];
    draw = _computeNextTurn2[2];
  }

  var gameStatus = { won: won, lost: lost, draw: draw };
  return { gameStatus: gameStatus, board: board };
}

/*****************************************/
/* React-Redux stuff start here -------------------------------------
/*****************************************/

/*****************************************/
/* state tree
/*****************************************/
/*
{
  gameStatus: 'running',
  gameSettings: { player: 'x', AI: 'o', hideSettings: false }
  cells: ['', 'x', 'o', ...]
}
*/

/*****************************************/
/* reducers
/*****************************************/
var combineReducers = Redux.combineReducers;

var initialStateGameSettings = {
  player: 'x',
  AI: 'o',
  hideSettings: false
};
var gameSettings = function gameSettings() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? initialStateGameSettings : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case 'SET_MARKERS':
      return {
        player: action.player,
        AI: action.AI,
        hideSettings: true
      };
    default:
      return state;
  }
};

var GAME_STATUS = {
  WON: "You won :)",
  LOST: "You lost :(",
  DRAW: "It's a draw = - =",
  DEFAULT: "PLAYING"
};
var gameStatus = function gameStatus() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? GAME_STATUS.DEFAULT : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case 'UPDATE_GAME_STATUS':
      if (action.gameStatus.won) {
        return GAME_STATUS.WON;
      } else if (action.gameStatus.lost) {
        return GAME_STATUS.LOST;
      } else if (action.gameStatus.draw) {
        return GAME_STATUS.DRAW;
      } else {
        return state;
      }
    case 'RESET':
      return GAME_STATUS.DEFAULT;
    default:
      return state;
  }
};

var initialStateBoard = {
  freeCells: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  cells: ['', '', '', '', '', '', '', '', '']
};
var board = function board() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? initialStateBoard : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case 'UPDATE_CELLS':
      return action.board;
    case 'RESET':
      return initialStateBoard;
    default:
      return state;
  }
};

var ticTacToe = combineReducers({
  gameSettings: gameSettings, gameStatus: gameStatus, board: board
});

/*****************************************/
/* actions.jsx
/*****************************************/
function makeAct(type) {
  for (var _len = arguments.length, argNames = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    argNames[_key - 1] = arguments[_key];
  }

  return function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var action = { type: type };
    argNames.forEach(function (arg, index) {
      action[argNames[index]] = args[index];
    });
    return action;
  };
}

var updateCells = makeAct('UPDATE_CELLS', 'board');

var setMarkers = makeAct('SET_MARKERS', 'player', 'AI');

var updateGameStatus = makeAct('UPDATE_GAME_STATUS', 'gameStatus');
var resetGame = makeAct('RESET');

/*****************************************/
/* presentational components for TicTacToe
/*****************************************/
var PropTypes = React.PropTypes;

var Cell = function Cell(_ref) {
  var id = _ref.id;
  var marker = _ref.marker;
  var onClick = _ref.onClick;
  return React.createElement(
    'div',
    { className: 'cell', id: id, onClick: onClick },
    marker
  );
};
Cell.propTypes = {
  id: PropTypes.number.isRequired,
  marker: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

var Board = function Board(_ref2) {
  var board = _ref2.board;
  var markers = _ref2.markers;
  var onCellClick = _ref2.onCellClick;
  return React.createElement(
    'div',
    { className: 'board' },
    board.cells.map(function (marker, id) {
      return React.createElement(Cell, {
        id: id, marker: marker,
        onClick: function onClick() {
          return onCellClick(id, markers, board, marker);
        }
      });
    })
  );
};
Board.propTypes = {
  board: PropTypes.object.isRequired,
  onCellClick: PropTypes.func.isRequired
};

var Notification = function Notification(_ref3) {
  var message = _ref3.message;
  var show = _ref3.show;
  var buttonYes = _ref3.buttonYes;
  var onClickYes = _ref3.onClickYes;
  var buttonNo = _ref3.buttonNo;
  var onClickNo = _ref3.onClickNo;
  return React.createElement(
    'div',
    { className: "notification" + (show ? " active" : "") },
    React.createElement(
      'div',
      { className: 'content' },
      React.createElement(
        'p',
        null,
        message
      ),
      React.createElement(
        'button',
        { onClick: onClickYes },
        buttonYes
      ),
      buttonNo && React.createElement(
        'button',
        { onClick: onClickNo },
        buttonNo
      )
    )
  );
};
Notification.propTypes = {
  message: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  buttonYes: PropTypes.string.isRequired,
  onClickYes: PropTypes.func.isRequired
};

/*****************************************/
/* container component for TicTacToe
/*****************************************/
var connect = ReactRedux.connect;

var TicTacToe = connect(function (state) {
  return {
    board: state.board,
    markers: state.gameSettings
  };
}, function (dispatch) {
  return {
    onCellClick: function onCellClick(id, markers, board, marker) {
      if (marker === '') {
        (function () {
          var updates = computeGameUpdates(id, markers, board);
          dispatch(updateCells(updates.board));
          // timeout is not a good solution here, but good enough for now
          setTimeout(function () {
            dispatch(updateGameStatus(updates.gameStatus));
          }, 500);
        })();
      }
    }
  };
})(Board);

var GameSetting = connect(function (state) {
  return {
    message: "Which one do you want to be?",
    show: !state.gameSettings.hideSettings,
    buttonYes: 'X',
    buttonNo: 'O'
  };
}, function (dispatch) {
  return {
    onClickYes: function onClickYes() {
      dispatch(setMarkers('X', 'O'));
    },
    onClickNo: function onClickNo() {
      dispatch(setMarkers('O', 'X'));
    }
  };
})(Notification);

var GameStatus = connect(function (state) {
  return {
    message: state.gameStatus,
    show: state.gameStatus != GAME_STATUS.DEFAULT,
    buttonYes: 'Restart'
  };
}, function (dispatch) {
  return {
    onClickYes: function onClickYes() {
      dispatch(resetGame());
    }
  };
})(Notification);

/*****************************************/
/* App.js
/*****************************************/
var App = function App(_ref4) {
  var title = _ref4.title;
  return React.createElement(
    'div',
    { className: 'app' },
    React.createElement(
      'p',
      { className: 'title' },
      title
    ),
    React.createElement(GameSetting, null),
    React.createElement(GameStatus, null),
    React.createElement(TicTacToe, null)
  );
};

/*****************************************/
/* index.js
/*****************************************/
var Provider = ReactRedux.Provider;
var createStore = Redux.createStore;

var store = createStore(ticTacToe);
ReactDOM.render(React.createElement(
  Provider,
  { store: store },
  React.createElement(App, { title: 'Tic Tac Toe' })
), document.getElementById('root'));

/*****************************************/
/* Debug store
/*****************************************/
// let unsubscribe = store.subscribe(() =>
//   console.log(store.getState())
// )