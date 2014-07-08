// Art Assets

var pieceArt = new Array(20);
pieceArt[0] = document.getElementById("WRabble");
pieceArt[1] = document.getElementById("WSpears");
pieceArt[2] = document.getElementById("WLightHorse");
pieceArt[3] = document.getElementById("WHeavyHorse");
pieceArt[4] = document.getElementById("WElephant");
pieceArt[5] = document.getElementById("WCrossbows");
pieceArt[6] = document.getElementById("WTrebuchet");
pieceArt[7] = document.getElementById("WDragon");
pieceArt[8] = document.getElementById("WTower");
pieceArt[9] = document.getElementById("WKing");
pieceArt[10] = document.getElementById("BRabble");
pieceArt[11] = document.getElementById("BSpears");
pieceArt[12] = document.getElementById("BLightHorse");
pieceArt[13] = document.getElementById("BHeavyHorse");
pieceArt[14] = document.getElementById("BElephant");
pieceArt[15] = document.getElementById("BCrossbows");
pieceArt[16] = document.getElementById("BTrebuchet");
pieceArt[17] = document.getElementById("BDragon");
pieceArt[18] = document.getElementById("BTower");
pieceArt[19] = document.getElementById("BKing");


// Graphics

var ctx = Board.getContext("2d");
var squareSize = 50; // in pixels
var leftMargin = squareSize/2;
var topMargin = squareSize;
var drawTime = (new Date()).getTime(); // last time the board was drawn
var redrawInterval = 15; // in milliseconds
var lastPieceUnderMouse = null;
var kingThreats = []; // all pieces that can capture the player's king


// Animations

var animationType = {translation: 0, rotation: 1, flipLeft: 2, flipRight: 3};
var animatingTiles = [];
var animatingPieces = [];


// Rules Variables

var terType = {open: 0, water: 1, mountain: 2};

var pieceType = {rabble: 0, spears: 1, lightHorse: 2, heavyHorse: 3,
        elephant: 4, crossbows: 5, trebuchet: 6, dragon: 7, tower: 8, king: 9};

var requiredPieceCount =    [6, 3, 3, 2, 2, 2, 1, 1, 2, 1];

var totalPieceCount = requiredPieceCount.reduce(function(a, b) { return a + b });

var pieceArmor =            [1, 1, 1, 2, 2, 0, 0, 2, 2, 1];
var pieceMovement =         [1, 1, 3, 2, 1, 2, 1, 4, 0, 1];
var pieceRange =            [1, 1, 1, 1, 2, 3, 4, 2, 1, 1];
var doubleMovement =        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// var doubleMovement =     [1, 1, 1, 1, 0, 1, 0, 0, 0, 0];


// Game State

var mode = {current: 0, setup: 0, raven: 1, hotseat: 2, sandbox: 3};

var phase = {current: 0, loading: 0, placeKingsTile: 1, placeTiles: 2, placeKing: 3, placePieces: 4, boardComplete: 5, localSetup: 6,
            exchangeBoards: 7, confirmExchange: 8, playerToMove: 9, playerSecondMove: 10, playerMoved: 11, awaitingOpponentMove: 12,
            gameOver: 13};

var board = new Array(88);
for (var i = 0; i < 88; ++i) {
    board[i] = {piece: null, terrain: terType.open};
}

var playerPieces = [];
var opponentPieces = [];

var playerColor = true;
//var firstPlayerColor = true;
var topColor = false;

var showMoves = [];
var showCaptures = [];

var gameHistory = [];
var undoneHistory = [];

var topTileArrangement = null;
var bottomTileArrangement = null;

var topPieceArrangement = null;
var bottomPieceArrangement = null;

// Each player in a raven match has a roll code, which is a random hex-coded
// number used to determine who goes first and to identify move and challenge
// codes sent by the same player.
var rollsize = 32; // Number of bits. Must be a multiple of 4. Max seems to be around 32.
var playerRollCode;
var opponentRollCode;
var opponentChallengeCode;


// Help Text

var pieceText = new Array(10);
pieceText[0] = "<b>RABBLE</b><br>You may move 2 Rabble in the same turn, without capturing.";
pieceText[1] = "<b>SPEARS</b><br>Can only capture and engage forwards.<br>Stops opponent's movement in the two squares directly in front of it.";
pieceText[2] = "<b>LIGHT HORSE</b><br>Moves 3 squares. Can move past pieces it captures.";
pieceText[3] = "<b>HEAVY HORSE</b><br>Heavy. Moves 2 squares. Can move past pieces it captures.";
pieceText[4] = "<b>ELEPHANT</b><br>Heavy. Engagement range 2 squares.<br>Can move 2 squares to capture, but can't move through other pieces.";
pieceText[5] = "<b>CROSSBOWS</b><br>Unarmored. Moves 2 squares. Engagement range 3 squares.<br>Can't capture.";
pieceText[6] = "<b>TREBUCHET</b><br>Unarmored. Engagement range 4 squares (minimum 2).<br>Captures pieces it's engaging by moving in the opposite direction.";
pieceText[7] = "<b>DRAGON</b><br>Heavy. Moves 4 squares. Engagement range 2 squares.<br>Can move over mountains and opponent's pieces.";
pieceText[8] = "<b>TOWER</b><br>Heavy. Can't move. When a piece is adjacent to an opposing Tower,<br>it can only engage that Tower.";
pieceText[9] = "<b>KING</b><br>Can move to the other side of a Tower of the same color.";

var instructions = [];
instructions[phase.loading] = "Loading...";
instructions[phase.placeKingsTile] = "<b>Setup Instructions</b><br><br>Before the game begins, you must build your side of the board.<br><br>Start by dragging the tile to one of the three indicated positions.<br><br>The circle on the tile is where your King will go.";
instructions[phase.placeTiles] = "<b>Setup Instructions</b><br><br>Use the rest of the tiles to fill in the lower half of board.<br><br>Click a tile to rotate it 180 degrees.<br><br>Some tiles have different squares on the reverse side. Drag a tile to the other side of the dotted line to flip it over.";
instructions[phase.placeKing] = "<b>Setup Instructions</b><br><br>When you're finished arranging the tiles, move your King onto the square marked with a circle.";
instructions[phase.placePieces] = "<b>Setup Instructions</b><br><br>Now place the rest of your pieces.<br><br>Removing the King will reset all pieces and allow you to rearrange the tiles.<br><br>If you like, you can start with a <button onclick=\"randomizePieceArrangement()\">Random Arrangement</button>.";
instructions[phase.playerSecondMove] = "You may move a second piece of the same type (one square only, without capturing).";

var modeDescriptions = [];
modeDescriptions[mode.setup] = "";
modeDescriptions[mode.raven] = "<b>Play by Raven</b><br><br>This mode allows you to play against an opponent via text codes representing each move.<br><br>";
modeDescriptions[mode.hotseat] = "<b>Hotseat</b><br><br>This mode allows two people to play in the same browser window.<br><br>";
modeDescriptions[mode.sandbox] = "<b>Sandbox</b><br><br>This mode allows for experimentation. Movement rules are enforced, but turns are not.<br><br>";

var displayedPiece = null;


// Misc Utilities

// Determine whether an array contains an entry with the given x and y.
function containsHex(array, x, y) {
    for (var i = 0; i < array.length; ++i) {
        if ((array[i].x == x) && (array[i].y == y)) {
            return true;
        }
    }
    return false;
}

// Get the first element in an array with the given x and y.
function getItemAtHex(array, x, y) {
    for (var i = 0; i < array.length; ++i) {
        if ((array[i].x == x) && (array[i].y == y)) {
            return array[i];
        }
    }
    return null;
}

// Determine whether a piece is of the player's color.
function playerOwns(piece) {
    return piece.color == playerColor;
}

// Move an item to the front of a list.
function moveToFront(item, list) {
    list.splice(list.indexOf(item), 1);
    list.unshift(item);
}

// Move an item to the back of a list.
function moveToBack(item, list) {
    list.splice(list.indexOf(item), 1);
    list.push(item);
}