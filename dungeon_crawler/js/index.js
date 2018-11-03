'use strict';

var _MOVE_STEP;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _React = React;
var PropTypes = _React.PropTypes;
var Component = _React.Component;
var _Redux = Redux;
var combineReducers = _Redux.combineReducers;
var createStore = _Redux.createStore;
var _ReactRedux = ReactRedux;
var connect = _ReactRedux.connect;
var Provider = _ReactRedux.Provider;

// action types

var Types = {
  SET_ENTITIES: 'SET_ENTITIES',
  REMOVE_ENTITY: 'REMOVE_ENTITY',
  SET_ENEMY_HEALTH: 'SET_ENEMY_HEALTH',

  LEVEL_UP: 'LEVEL_UP',
  SET_XP: 'SET_XP',
  SET_PLAYER_HEALTH: 'SET_PLAYER_HEALTH',
  UPGRADE_WEAPON: 'UPGRADE_WEAPON',
  MOVE: 'MOVE',

  TOGGLE_DARKNESS: 'TOGGLE_DARKNESS',
  SET_DUNGEON: 'SET_DUNGEON',
  SET_DUNGEON_LEVEL: 'SET_DUNGEON_LEVEL',
  RESET: 'RESET'
};

// actions
function action(type) {
  for (var _len = arguments.length, argNames = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    argNames[_key - 1] = arguments[_key];
  }

  return function actionCreator() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var newAction = { type: type };
    argNames.forEach(function (arg, index) {
      newAction[argNames[index]] = args[index];
    });
    return newAction;
  };
}
var Actions = {
  setEntities: action(Types.SET_ENTITIES, 'entities'),
  removeEntity: action(Types.REMOVE_ENTITY, 'entityName'),
  setEnemyHealth: action(Types.SET_ENEMY_HEALTH, 'entityName', 'health'),

  levelUp: action(Types.LEVEL_UP),
  setXP: action(Types.SET_XP, 'xp'),
  setPlayerHealth: action(Types.SET_PLAYER_HEALTH, 'health'),
  upgradeWeapon: action(Types.UPGRADE_WEAPON),
  move: action(Types.MOVE, 'x', 'y'),

  reset: action(Types.RESET),
  setDungeon: action(Types.SET_DUNGEON, 'dungeonMap'),
  setDungeonLevel: action(Types.SET_DUNGEON_LEVEL, 'level'),
  toggleDarkness: action(Types.TOGGLE_DARKNESS)
};

// dungeon generator
var DungeonGenerator = function DungeonGeneratorSetup() {
  var DEFAULT_CONFIG = {
    mapSize: 50,
    roomCount: 10,
    roomMinSize: 5,
    roomMaxSize: 15,
    tileType: {
      wall: '#',
      room: ' '
    }
  };

  function getRandomInt(min, max) {
    return ~ ~(Math.random() * (max - min) + min);
  }

  function getRandomLocation(_ref) {
    var x = _ref.x;
    var y = _ref.y;
    var w = _ref.w;
    var h = _ref.h;

    return { x: getRandomInt(x, x + w), y: getRandomInt(y, y + h) };
  }

  function getCenter(_ref2) {
    var x = _ref2.x;
    var y = _ref2.y;
    var w = _ref2.w;
    var h = _ref2.h;

    return { x: x + w / 2, y: y + h / 2 };
  }

  // check if room 'check' is overlapping any of the rooms
  function isOverlapped(check, rooms) {
    for (var id = 0; id < rooms.length; id++) {
      var room = rooms[id];
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
  }

  // fill a 2D rect with $tile starting from grid[y][x]
  function drawRect(grid, tile, _ref3) {
    var x = _ref3.x;
    var y = _ref3.y;
    var w = _ref3.w;
    var h = _ref3.h;

    for (var row = 0; row < h; row++) {
      if (typeof grid[row + y] === 'undefined') {
        grid[row + y] = [];
      }
      for (var col = 0; col < w; col++) {
        grid[row + y][col + x] = tile;
      }
    }
  }

  // draw a tunnel between 2 rooms
  function drawTunnel(grid, tile, room1, room2) {
    var end1 = getRandomLocation(room1);
    var end2 = getRandomLocation(room2);
    while (end1.x !== end2.x) {
      end1.x += end1.x > end2.x ? -1 : 1;
      grid[end1.y][end1.x] = tile;
    }
    while (end1.y !== end2.y) {
      end1.y += end1.y > end2.y ? -1 : 1;
      grid[end1.y][end1.x] = tile;
    }
  }

  function drawRooms(grid, rooms, tile) {
    for (var id = 0; id < rooms.length; id++) {
      var room = rooms[id];
      var neighbor = room.neighbor;
      drawRect(grid, tile, room);
      if (neighbor) {
        drawTunnel(grid, tile, room, neighbor);
      }
    }
  }

  // return a set of rooms with random locations/sizes
  function generateRooms(mapSize, roomMinSize, roomMaxSize, roomCount) {
    var rooms = [];
    while (rooms.length < roomCount) {
      var room = {
        x: getRandomInt(1, mapSize - roomMaxSize - 1),
        y: getRandomInt(1, mapSize - roomMaxSize - 1),
        w: getRandomInt(roomMinSize, roomMaxSize),
        h: getRandomInt(roomMinSize, roomMaxSize)
      };

      if (!isOverlapped(room, rooms)) {
        rooms.push(room);
      }
    }
    return rooms;
  }

  function getDistance(pointA, pointB) {
    return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
  }

  function getClosestRoom(currentRoom, rooms, avoidLinked) {
    var center = getCenter(currentRoom);
    var closestRoom = null;
    var closestDistance = Number.MAX_SAFE_INTEGER;
    for (var id = 0; id < rooms.length; id++) {
      var neighbor = rooms[id];
      if (neighbor !== currentRoom && avoidLinked && !neighbor.linked) {
        var neighborCenter = getCenter(neighbor);
        var distance = getDistance(center, neighborCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestRoom = neighbor;
        }
      }
    }
    return closestRoom;
  }

  // connect rooms with tunnels
  function connectRooms(rooms) {
    var currentRoom = rooms[0];
    var neighbor = undefined;
    for (var id = 0; id < rooms.length - 1; id++) {
      currentRoom.linked = true;
      neighbor = getClosestRoom(currentRoom, rooms, true);
      currentRoom.neighbor = neighbor;
      currentRoom = neighbor;
    }
    // have the tail connect to a node as well
    currentRoom.neighbor = getClosestRoom(currentRoom, rooms, false);
  }

  function nudgeRoom(room, rooms, dest, xORy) {
    var oldLoc = undefined;
    while (room[xORy] !== dest) {
      oldLoc = room[xORy];
      if (room[xORy] < dest) room[xORy]++;else if (room[xORy] > dest) room[xORy]--;
      if (isOverlapped(room, rooms)) {
        room[xORy] = oldLoc;
        break;
      }
    }
  }

  // nudge rooms towards the center to make tunnels shorter
  function compactRooms(rooms, center) {
    for (var id = 0; id < rooms.length; id++) {
      nudgeRoom(rooms[id], rooms, center.x, 'x');
      nudgeRoom(rooms[id], rooms, center.y, 'y');
    }
  }

  /******************************
   * public
   ******************************/
  var main = function main(config) {
    Object.assign(this, DEFAULT_CONFIG, config);
  };

  main.prototype.generate = function generate() {
    // init grid with walls
    var grid = [];
    drawRect(grid, this.tileType.wall, { x: 0, y: 0, w: this.mapSize, h: this.mapSize });

    // generate rooms and connect them
    var mapCenter = { x: this.mapSize / 2, y: this.mapSize / 2 };
    var rooms = generateRooms(this.mapSize, this.roomMinSize, this.roomMaxSize, this.roomCount);
    compactRooms(rooms, mapCenter);
    connectRooms(rooms);

    // draw rooms on grid
    drawRooms(grid, rooms, this.tileType.room);

    return grid;
  };

  main.prototype.inject = function inject(grid, injects, updateGrid) {
    var injected = {};
    for (var id = 0; id < injects.length; id++) {
      var tile = injects[id];
      var tileType = tile.tileType;
      var numTilePlaced = 0;
      while (numTilePlaced < tile.count) {
        var tileToInject = {
          type: tileType,
          x: getRandomInt(1, this.mapSize - 1),
          y: getRandomInt(1, this.mapSize - 1)
        };
        if (grid[tileToInject.y][tileToInject.x] === this.tileType.room) {
          injected[tileToInject.x + '_' + tileToInject.y] = tileToInject;
          numTilePlaced++;
          if (updateGrid) {
            grid[tileToInject.y][tileToInject.x] = tileType;
          }
        }
      }
    }
    return injected;
  };

  return main;
}();

// game logics
var SIGHT_RANGE = 7;
var TILE_TYPE = {
  wall: 0, room: 1, weapon: 2, health: 3,
  stair: 4, enemy: 5, player: 6, dark: 7, boss: 8
};
var TILE_CLASS = Object.keys(TILE_TYPE);
var CONFIGS = {
  damageVariance: 5,
  sightRange: 7,
  playerBase: {
    baseHealth: 100,
    baseDamage: 12,
    health: 20,
    damage: 12,
    xp: 60
  },
  enemyBase: {
    health: 20,
    damage: 12,
    xp: 15
  },
  healthBase: 20,
  weapons: [{ name: 'Unbreakable Chopstick', damage: 0 }, { name: 'Millitary Dagger', damage: 12 }, { name: 'Ninja Katana', damage: 16 }, { name: 'Ninja Katana', damage: 22 }, { name: 'Jedi Lightsaber', damage: 30 }, { name: '==|[[{{Excaliber}}]]>', damage: 40 }],
  dungeonDisplay: {
    width: 100,
    height: 100
  },
  dungeon: {
    maxLevel: 4,
    mapSize: 100,
    roomCount: 12,
    roomMinSize: 10,
    roomMaxSize: 25,
    tileType: {
      wall: TILE_TYPE.wall, room: TILE_TYPE.room
    }
  },
  entities: [{ tileType: TILE_TYPE.stair, count: 1 }, { tileType: TILE_TYPE.weapon, count: 1 }, { tileType: TILE_TYPE.health, count: 5 }, { tileType: TILE_TYPE.enemy, count: 5 }, { tileType: TILE_TYPE.player, count: 1 }],
  bossEntity: { tileType: TILE_TYPE.boss, count: 1 },
  winMessage: "You've beaten the dungoen!",
  lostMessage: "You've lost:( Better luck next time!"
};
var dungeonGenerator = new DungeonGenerator(CONFIGS.dungeon);
var LOGICS = {
  generateDungeon: function generateDungeon(dungeonLevel) {
    var dungeonMap = dungeonGenerator.generate();
    var entitiesConfig = CONFIGS.entities;
    if (dungeonLevel >= CONFIGS.dungeon.maxLevel) {
      entitiesConfig = entitiesConfig.slice(0);
      for (var i = 0; i < entitiesConfig.length; i++) {
        if (entitiesConfig[i].tileType === TILE_TYPE.stair) {
          entitiesConfig[i] = CONFIGS.bossEntity;
        }
      }
    }
    var entities = dungeonGenerator.inject(dungeonMap, entitiesConfig);
    var playerLoc = {};
    Object.keys(entities).forEach(function (entityName) {
      var entity = entities[entityName];
      switch (entity.type) {
        case TILE_TYPE.enemy:
          entity.health = CONFIGS.enemyBase.health * dungeonLevel;
          break;
        case TILE_TYPE.boss:
          entity.health = CONFIGS.enemyBase.health * dungeonLevel * 2;
          break;
        case TILE_TYPE.player:
          playerLoc.x = entity.x;
          playerLoc.y = entity.y;
          delete entities[entityName];
          break;
      }
    });
    return { dungeonMap: dungeonMap, entities: entities, playerLoc: playerLoc };
  },
  getTileType: function getTileType(player, entities, dungeonMap, curX, curY) {
    var entity = undefined;
    if (player.x === curX && player.y === curY) {
      entity = player;
    } else {
      entity = entities[this.getEntityName(curX, curY)];
    }
    return entity ? entity.type : dungeonMap[curY][curX];
  },
  calcPlayerDamage: function calcPlayerDamage(level, weaponId) {
    var playerBase = CONFIGS.playerBase;
    var weapons = CONFIGS.weapons;

    return playerBase.baseDamage + weapons[weaponId].damage + playerBase.damage * level;
  },
  calcPlayerMaxHealth: function calcPlayerMaxHealth(level) {
    var playerBase = CONFIGS.playerBase;

    return playerBase.baseHealth + playerBase.health * (level - 1);
  },
  calcPlayerMaxXP: function calcPlayerMaxXP(level) {
    var playerBase = CONFIGS.playerBase;

    return playerBase.xp * level;
  },
  getHealAmount: function getHealAmount(dungeonLevel) {
    return CONFIGS.healthBase * dungeonLevel;
  },
  getEnemyDamage: function getEnemyDamage(dungeonLevel) {
    return CONFIGS.enemyBase.damage * dungeonLevel;
  },
  getHealedHealth: function getHealedHealth(player, dungeonLevel) {
    var playerMaxHealth = this.calcPlayerMaxHealth(player.level);
    var newHealth = player.health + LOGICS.getHealAmount(dungeonLevel);
    if (newHealth > playerMaxHealth) {
      newHealth = playerMaxHealth;
    }
    return newHealth;
  },
  getEntityName: function getEntityName(x, y) {
    return x + '_' + y;
  },
  getRandomInt: function getRandomInt(min, max) {
    return ~ ~(Math.random() * (max - min) + min);
  },
  getDamageVariance: function getDamageVariance(damage) {
    return this.getRandomInt(damage - CONFIGS.damageVariance, damage + CONFIGS.damageVariance);
  },
  fight: function fight(player, enemy, dungeonLevel) {
    var playerHealth = player.health - this.getDamageVariance(this.getEnemyDamage(dungeonLevel));
    var enemyHealth = enemy.health - this.getDamageVariance(player.damage);
    var xp = -1;
    if (playerHealth <= 0) {
      return { gameOver: true, playerWon: false };
    }
    if (enemyHealth <= 0) {
      if (enemy.type === TILE_TYPE.boss) {
        return { gameOver: true, playerWon: true };
      } else {
        xp = player.xp - CONFIGS.enemyBase.xp * dungeonLevel;
      }
    }
    return { playerHealth: playerHealth, enemyHealth: enemyHealth, xp: xp };
  }
};

// reducers
var INITIAL_STATE = {
  player: {
    x: 0,
    y: 0,
    type: TILE_TYPE.player,
    health: CONFIGS.playerBase.baseHealth,
    weaponId: 0,
    damage: CONFIGS.playerBase.baseDamage + CONFIGS.weapons[0].damage,
    level: 1,
    xp: CONFIGS.playerBase.xp
  },
  entities: {},
  dungeon: {
    dungeonMap: [],
    level: 1,
    displayWidth: CONFIGS.dungeonDisplay.width,
    displayHeight: CONFIGS.dungeonDisplay.height,
    isDark: true
  }
};
var player = function player() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? INITIAL_STATE.player : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case Types.LEVEL_UP:
      var newLevel = state.level + 1;
      return _extends({}, state, {
        level: newLevel,
        xp: LOGICS.calcPlayerMaxXP(newLevel),
        health: LOGICS.calcPlayerMaxHealth(newLevel),
        damage: LOGICS.calcPlayerDamage(newLevel, state.weaponId)
      });
    case Types.SET_XP:
      return _extends({}, state, {
        xp: action.xp
      });
    case Types.UPGRADE_WEAPON:
      var newWeaponId = state.weaponId + 1;
      return _extends({}, state, {
        weaponId: newWeaponId,
        damage: LOGICS.calcPlayerDamage(state.level, newWeaponId)
      });
    case Types.MOVE:
      return _extends({}, state, {
        x: action.x,
        y: action.y
      });
    case Types.SET_PLAYER_HEALTH:
      return _extends({}, state, {
        health: action.health
      });
    case Types.RESET:
      return INITIAL_STATE.player;
    default:
      return state;
  }
};
var dungeon = function dungeon() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? INITIAL_STATE.dungeon : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case Types.SET_DUNGEON:
      return _extends({}, state, {
        dungeonMap: action.dungeonMap
      });
    case Types.SET_DUNGEON_LEVEL:
      return _extends({}, state, {
        level: action.level
      });
    case Types.TOGGLE_DARKNESS:
      return _extends({}, state, {
        isDark: !state.isDark
      });
    default:
      return state;
  }
};
var entities = function entities() {
  var _extends2, _extends3;

  var state = arguments.length <= 0 || arguments[0] === undefined ? INITIAL_STATE.entities : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case Types.SET_ENTITIES:
      return action.entities;
    case Types.REMOVE_ENTITY:
      return _extends({}, state, (_extends2 = {}, _extends2[action.entityName] = undefined, _extends2));
    case Types.SET_ENEMY_HEALTH:
      return _extends({}, state, (_extends3 = {}, _extends3[action.entityName] = _extends({}, state[action.entityName], {
        health: action.health
      }), _extends3));
    default:
      return state;
  }
};
var rootReducer = combineReducers({ dungeon: dungeon, player: player, entities: entities });

// dungeon renderer
function isOutsideOfMap(x, y, dungeonMap) {
  return x < 0 || x > dungeonMap[0].length - 1 || y < 0 || y > dungeonMap.length - 1;
}
function isOutsideOfSight(x, y, player, sightRange) {
  var xDelta = Math.abs(player.x - x);
  var yDelta = Math.abs(player.y - y);
  return xDelta > sightRange || yDelta > sightRange || // box range
  xDelta * xDelta + yDelta * yDelta >= sightRange * sightRange; // circle range
}
var DungeonRenderer = function DungeonRenderer(_ref4) {
  var dungeon = _ref4.dungeon;
  var player = _ref4.player;
  var entities = _ref4.entities;
  var sightRange = _ref4.sightRange;

  var grid = [];
  var dungeonMap = dungeon.dungeonMap;
  var displayWidth = dungeon.displayWidth;
  var displayHeight = dungeon.displayHeight;
  var isDark = dungeon.isDark;

  if (dungeonMap && dungeonMap.length > 0) {
    var startX = 0;
    var startY = 0;

    var endX = startX + displayWidth;
    var endY = startY + displayHeight;

    sightRange = sightRange || SIGHT_RANGE;

    for (var curY = startY; curY < endY; curY++) {
      var row = [];
      var tileType = undefined;
      for (var curX = startX; curX < endX; curX++) {
        if (isDark && isOutsideOfSight(curX, curY, player, sightRange)) {
          tileType = TILE_TYPE.dark;
        } else {
          if (isOutsideOfMap(curX, curY, dungeonMap)) {
            tileType = TILE_TYPE.wall;
          } else {
            tileType = LOGICS.getTileType(player, entities, dungeonMap, curX, curY);
          }
        }
        var tileClass = TILE_CLASS[tileType] ? ' ' + TILE_CLASS[tileType] : '';
        row.push(React.createElement('span', { key: curX + '_' + curY, className: 'tile' + tileClass }));
      }
      grid.push(row);
    }
  }

  return React.createElement(
    'div',
    { className: 'grid' },
    grid.map(function (row, rowId) {
      return React.createElement(
        'div',
        { key: rowId, className: 'row' },
        row
      );
    })
  );
};
DungeonRenderer.propTypes = {
  dungeon: PropTypes.object.isRequired,
  player: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired,
  sightRange: PropTypes.number
};

// status bar
var StatusBar = function StatusBar(_ref5) {
  var status = _ref5.status;

  return React.createElement(
    'ul',
    { className: 'statusBar' },
    Object.keys(status).map(function (fieldName) {
      return React.createElement(
        'li',
        { key: fieldName },
        fieldName,
        ': ',
        status[fieldName]
      );
    })
  );
};
StatusBar.propTypes = {
  status: PropTypes.object.isRequired
};

// dungeon crawlers

var ARROW_KEY = { L: 37, U: 38, R: 39, D: 40 };
var MOVE_STEP = (_MOVE_STEP = {}, _MOVE_STEP[ARROW_KEY.U] = { x: 0, y: -1 }, _MOVE_STEP[ARROW_KEY.D] = { x: 0, y: 1 }, _MOVE_STEP[ARROW_KEY.L] = { x: -1, y: 0 }, _MOVE_STEP[ARROW_KEY.R] = { x: 1, y: 0 }, _MOVE_STEP);

var notifier = humane.create({ baseCls: 'humane-bigbox', timeout: 1500 });
notifier.error = notifier.spawn({ addnCls: 'humane-bigbox-error' });
notifier.success = notifier.spawn({ addnCls: 'humane-bigbox-success' });

var DungeonCrawlerCmp = function (_Component) {
  _inherits(DungeonCrawlerCmp, _Component);

  function DungeonCrawlerCmp(props) {
    _classCallCheck(this, DungeonCrawlerCmp);

    var _this = _possibleConstructorReturn(this, _Component.call(this, props));

    _this.props.newDungeon(_this.props.dungeon);
    return _this;
  }

  DungeonCrawlerCmp.prototype.componentDidMount = function componentDidMount() {
    window.addEventListener('keydown', this._handleKeydown.bind(this));
  };

  DungeonCrawlerCmp.prototype.componentWillUnmount = function componentWillUnmount() {
    window.removeEventListener('keydown', this._handleKeydown.bind(this));
  };

  DungeonCrawlerCmp.prototype._handleKeydown = function _handleKeydown(e) {
    var _props = this.props;
    var player = _props.player;
    var dungeon = _props.dungeon;
    var entities = _props.entities;
    var handleMove = _props.handleMove;
    var newDungeon = _props.newDungeon;

    var moveStep = MOVE_STEP[e.keyCode];
    if (moveStep) {
      e.preventDefault();
      handleMove(player, dungeon, entities, moveStep, newDungeon);
    }
  };

  DungeonCrawlerCmp.prototype._getDungeonStatus = function _getDungeonStatus(player, dungeon) {
    return {
      'Health': player.health,
      'Weapon': CONFIGS.weapons[player.weaponId].name,
      'Attack': player.damage,
      'Level': player.level,
      'Next Level': player.xp,
      'Dungeon': dungeon.level
    };
  };

  DungeonCrawlerCmp.prototype.render = function render() {
    var _props2 = this.props;
    var player = _props2.player;
    var entities = _props2.entities;
    var dungeon = _props2.dungeon;

    var status = this._getDungeonStatus(player, dungeon);
    return React.createElement(
      'div',
      { className: 'dungeonCrawler' },
      React.createElement(
        'h1',
        { className: 'title' },
        'A Roguelike Dungeon Crawler'
      ),
      React.createElement(
        'p',
        null,
        'Kill the boss in dungeon ',
        CONFIGS.dungeon.maxLevel,
        '. Use arrow keys to move around and kill enemies.'
      ),
      React.createElement(
        'button',
        { onClick: this.props.toggleDarkness },
        'Toggle Darkness'
      ),
      React.createElement(StatusBar, { status: status }),
      React.createElement('br', null),
      React.createElement(DungeonRenderer, { dungeon: dungeon, player: player, entities: entities, sightRange: CONFIGS.sightRange })
    );
  };

  return DungeonCrawlerCmp;
}(Component);

DungeonCrawlerCmp.propTypes = {
  dungeon: PropTypes.object.isRequired,
  player: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired,
  toggleDarkness: PropTypes.func.isRequired,
  newDungeon: PropTypes.func.isRequired,
  handleMove: PropTypes.func.isRequired
};

var mapStateToProps = function mapStateToProps(state) {
  return {
    dungeon: state.dungeon,
    entities: state.entities,
    player: state.player
  };
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    toggleDarkness: function toggleDarkness() {
      dispatch(Actions.toggleDarkness());
    },
    newDungeon: function newDungeon(dungeon) {
      var _LOGICS$generateDunge = LOGICS.generateDungeon(dungeon.level + 1);

      var dungeonMap = _LOGICS$generateDunge.dungeonMap;
      var entities = _LOGICS$generateDunge.entities;
      var playerLoc = _LOGICS$generateDunge.playerLoc;

      dispatch(Actions.setDungeon(dungeonMap));
      dispatch(Actions.setEntities(entities));
      dispatch(Actions.move(playerLoc.x, playerLoc.y));
    },
    handleMove: function handleMove(player, dungeon, entities, step, newDungeon) {
      var newLoc = { x: player.x + step.x, y: player.y + step.y };
      var tileType = LOGICS.getTileType(player, entities, dungeon.dungeonMap, newLoc.x, newLoc.y);
      var entityName = LOGICS.getEntityName(newLoc.x, newLoc.y);
      switch (tileType) {
        case TILE_TYPE.boss:
        case TILE_TYPE.enemy:
          var result = LOGICS.fight(player, entities[entityName], dungeon.level);
          if (result.gameOver) {
            if (result.playerWon) {
              notifier.success(CONFIGS.winMessage);
            } else {
              notifier.error(CONFIGS.lostMessage);
            }
            dispatch(Actions.reset());
            dispatch(Actions.setDungeonLevel(1));
            newDungeon(dungeon);
          } else {
            if (result.enemyHealth <= 0) {
              dispatch(Actions.removeEntity(entityName));
              dispatch(Actions.move(newLoc.x, newLoc.y));
              if (result.xp === 0) {
                dispatch(Actions.levelUp());
              } else {
                dispatch(Actions.setXP(result.xp));
              }
            } else {
              dispatch(Actions.setEnemyHealth(entityName, result.enemyHealth));
            }
            if (result.xp !== 0) {
              dispatch(Actions.setPlayerHealth(result.playerHealth));
            }
          }
          break;
        case TILE_TYPE.weapon:
          dispatch(Actions.move(newLoc.x, newLoc.y));
          dispatch(Actions.upgradeWeapon());
          dispatch(Actions.removeEntity(entityName));
          break;
        case TILE_TYPE.health:
          var playerHealth = LOGICS.getHealedHealth(player, dungeon.level);
          dispatch(Actions.move(newLoc.x, newLoc.y));
          dispatch(Actions.setPlayerHealth(playerHealth));
          dispatch(Actions.removeEntity(entityName));
          break;
        case TILE_TYPE.room:
          dispatch(Actions.move(newLoc.x, newLoc.y));
          break;
        case TILE_TYPE.stair:
          newDungeon(dungeon);
          dispatch(Actions.setDungeonLevel(dungeon.level + 1));
          break;
      }
    }
  };
};

var DungeonCrawler = connect(mapStateToProps, mapDispatchToProps)(DungeonCrawlerCmp);

// app
var App = function App(_ref6) {
  var title = _ref6.title;
  return React.createElement(
    'div',
    { className: 'app' },
    React.createElement(DungeonCrawler, null)
  );
};

var store = createStore(rootReducer);
ReactDOM.render(React.createElement(
  Provider,
  { store: store },
  React.createElement(App, null)
), document.getElementById('root'));