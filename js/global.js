// Art Assets

var PieceArt = new Array(20);
PieceArt[0] = document.getElementById("WRabble");
PieceArt[1] = document.getElementById("WSpears");
PieceArt[2] = document.getElementById("WLightHorse");
PieceArt[3] = document.getElementById("WHeavyHorse");
PieceArt[4] = document.getElementById("WElephant");
PieceArt[5] = document.getElementById("WCrossbows");
PieceArt[6] = document.getElementById("WTrebuchet");
PieceArt[7] = document.getElementById("WDragon");
PieceArt[8] = document.getElementById("WTower");
PieceArt[9] = document.getElementById("WKing");
PieceArt[10] = document.getElementById("BRabble");
PieceArt[11] = document.getElementById("BSpears");
PieceArt[12] = document.getElementById("BLightHorse");
PieceArt[13] = document.getElementById("BHeavyHorse");
PieceArt[14] = document.getElementById("BElephant");
PieceArt[15] = document.getElementById("BCrossbows");
PieceArt[16] = document.getElementById("BTrebuchet");
PieceArt[17] = document.getElementById("BDragon");
PieceArt[18] = document.getElementById("BTower");
PieceArt[19] = document.getElementById("BKing");


// Graphics

var Ctx = BoardCanvas.getContext("2d");
var SquareSize = 50; // in pixels
var LeftMargin = SquareSize/2;
var TopMargin = SquareSize;
var DrawTime = (new Date()).getTime(); // last time the board was drawn
var RedrawInterval = 15; // in milliseconds
var LastPieceUnderMouse = null;
var KingThreats = []; // all pieces that can capture the player's king


// Animations

var AnimationType = {translation: 0, rotation: 1, flipLeft: 2, flipRight: 3};
var AnimatingTiles = [];
var AnimatingPieces = [];
var ScreenAnimation = null;


// Rules Variables

var TerType = {open: 0, water: 1, mountain: 2};

var PieceType = {rabble: 0, spears: 1, lightHorse: 2, heavyHorse: 3,
        elephant: 4, crossbows: 5, trebuchet: 6, dragon: 7, tower: 8, king: 9};

var RequiredPieceCount =    [6, 3, 3, 2, 2, 2, 1, 1, 2, 1];

var TotalPieceCount = RequiredPieceCount.reduce(function(a, b) { return a + b });

var PieceArmor =            [1, 1, 1, 2, 2, 0, 0, 2, 2, 1];
var PieceMovement =         [1, 1, 3, 2, 1, 2, 1, 4, 0, 1];
var PieceRange =            [1, 1, 1, 1, 2, 3, 4, 2, 1, 1];
var DoubleMovement =        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// var DoubleMovement =     [1, 1, 1, 1, 0, 1, 0, 0, 0, 0];


// Game State

var Mode = {current: 0, setup: 0, raven: 1, hotseat: 2, sandbox: 3};

var Phase = {current: 0, loading: 0, placeKingsTile: 1, placeTiles: 2, placeKing: 3, placePieces: 4, boardComplete: 5, localSetup: 6,
            exchangeBoards: 7, confirmExchange: 8, playerToMove: 9, playerSecondMove: 10, playerMoved: 11, awaitingOpponentMove: 12,
            gameOver: 13};

var Board = new Array(88);
for (var i = 0; i < 88; ++i) {
    Board[i] = {piece: null, terrain: TerType.open};
}

var PlayerPieces = [];
var OpponentPieces = [];

var PlayerColor = true;
//var firstPlayerColor = true;
var TopColor = false;

var ShowMoves = [];
var ShowCaptures = [];

var GameHistory = [];
var UndoneHistory = [];

var TopTileArrangement = null;
var BottomTileArrangement = null;

var TopPieceArrangement = null;
var BottomPieceArrangement = null;

// Each player in a raven match has a roll code, which is a random hex-coded
// number used to determine who goes first and to identify move and challenge
// codes sent by the same player.
var RollSize = 32; // Number of bits. Must be a multiple of 4. Max seems to be around 32.
var PlayerRollCode;
var OpponentRollCode;
var OpponentChallengeCode;


// Help Text

var PieceText = new Array(10);
PieceText[0] = "<b>RABBLE</b><br>You may move 2 Rabble in the same turn, without capturing.";
PieceText[1] = "<b>SPEARS</b><br>Can only capture and engage forwards.<br>Stops opponent's movement in the two squares directly in front of it.";
PieceText[2] = "<b>LIGHT HORSE</b><br>Moves 3 squares. Can move past pieces it captures.";
PieceText[3] = "<b>HEAVY HORSE</b><br>Heavy. Moves 2 squares. Can move past pieces it captures.";
PieceText[4] = "<b>ELEPHANT</b><br>Heavy. Engagement range 2 squares.<br>Can move 2 squares to capture, but can't move through other pieces.";
PieceText[5] = "<b>CROSSBOWS</b><br>Unarmored. Moves 2 squares. Engagement range 3 squares.<br>Can't capture.";
PieceText[6] = "<b>TREBUCHET</b><br>Unarmored. Engagement range 4 squares (minimum 2).<br>Captures pieces it's engaging by moving in the opposite direction.";
PieceText[7] = "<b>DRAGON</b><br>Heavy. Moves 4 squares. Engagement range 2 squares.<br>Can move over mountains and opponent's pieces.";
PieceText[8] = "<b>TOWER</b><br>Heavy. Can't move. When a piece is adjacent to an opposing Tower,<br>it can only engage that Tower.";
PieceText[9] = "<b>KING</b><br>Can move to the other side of a Tower of the same color.";

var Instructions = [];
Instructions[Phase.loading] = "Loading...";
Instructions[Phase.placeKingsTile] = "<b>Setup Instructions</b><br><br>Before the game begins, you must build your side of the board.<br><br>Start by dragging the tile to one of the three indicated positions.<br><br>The circle on the tile is where your King will go.";
Instructions[Phase.placeTiles] = "<b>Setup Instructions</b><br><br>Use the rest of the tiles to fill in the lower half of board.<br><br>Click a tile to rotate it 180 degrees.<br><br>Some tiles have different squares on the reverse side. Drag a tile to the other side of the dotted line to flip it over.";
Instructions[Phase.placeKing] = "<b>Setup Instructions</b><br><br>When you're finished arranging the tiles, move your King onto the square marked with a circle.";
Instructions[Phase.placePieces] = "<b>Setup Instructions</b><br><br>Now place the rest of your pieces.<br><br>Removing the King will reset all pieces and allow you to rearrange the tiles.<br><br>If you like, you can start with a <button onclick=\"randomizePieceArrangement()\">Random Arrangement</button>.";
Instructions[Phase.playerSecondMove] = "You may move a second piece of the same type (one square only, without capturing).";

var ModeDescriptions = [];
ModeDescriptions[Mode.setup] = "";
ModeDescriptions[Mode.raven] = "<b>Play by Raven</b><br><br>This mode allows you to play against an opponent via text codes representing each move.<br><br>";
ModeDescriptions[Mode.hotseat] = "<b>Hotseat</b><br><br>This mode allows two people to play in the same browser window.<br><br>";
ModeDescriptions[Mode.sandbox] = "<b>Sandbox</b><br><br>This mode allows for experimentation. Movement rules are enforced, but turns are not.<br><br>";

var DisplayedPiece = null;


// Misc Utilities

// Set the visibility of an HTML element.
function setVisibility(element, visibile) {
    element.style.display = (visibile ? "inline" : "none");
}

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
    return piece.color == PlayerColor;
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