var mouseX = 0;
var mouseY = 0;
var mouseDown = false;
var movingTile = null;
var movingPiece = null;
var movingPieceX = 0;
var movingPieceY = 0;
var grabX = 0;
var grabY = 0;
var moved = false;

var showMoves = [];
var showCaptures = [];

var lastFrame = (new Date()).getTime();

// Determine which tile, if any, is under the cursor.
function tileUnderMouse() {
    for (var i = tiles.length - 1; i >= 0; --i) {
        var tile = tiles[i];
        if (tile == kingsTile) {
            if (posInBounds(mouseX, mouseY, tile.x, tile.y, 3 * squareSize, squareSize) ||
                posInBounds(mouseX, mouseY, tile.x + squareSize/2, tile.y + squareSize , 2 * squareSize, squareSize) ||
                posInBounds(mouseX, mouseY, tile.x + squareSize, tile.y + (2 * squareSize), 1 * squareSize, squareSize)) {
                return tiles[i];
            }
        } else if (phase.current > phase.placeKingsTile) {
            if (posInBounds(mouseX, mouseY, tile.x, tile.y, 2.5 * squareSize, 2 * squareSize)) {
                return tiles[i];
            }
        }
    }
    return null;
}

// Determine which piece, if any, is under the cursor.
function pieceUnderMouse() {
    var hex = hexAtPos(mouseX, mouseY);
    if (hexInBounds(hex.x, hex.y)) {
        var piece = board[hexToIndex(hex.x, hex.y)].piece;
        if (piece != null) {
            var centerX = hexPosX(hex.x, hex.y) + squareSize/2;
            var centerY = hexPosY(hex.x, hex.y) + squareSize/2;
            if (distance(mouseX, mouseY, centerX, centerY) <= (2/5) * squareSize) {
                return piece;
            }
        }
    }
    return null;
}

Board.onmousemove = function(event) {
    mouseX = (event.clientX + document.body.scrollLeft) - (Table.offsetLeft + CanvasCell.offsetLeft + Board.offsetLeft);
    mouseY = (event.clientY + document.body.scrollTop) - (Table.offsetTop + CanvasCell.offsetTop + Board.offsetTop);

    // dragging
    if (mouseDown) {
        if (movingPiece != null) {
            movingPieceX = mouseX - grabX;
            movingPieceY = mouseY - grabY;
        } else if (movingTile != null) {
            movingTile.x = mouseX - grabX;
            movingTile.y = mouseY - grabY;
        }

    // mousing over pieces
    } else {
        var piece = pieceUnderMouse();
        var tile = tileUnderMouse();
        if ((piece != null) || ((tile != null) && (phase.current <= phase.placeKing))) {
            Board.style.cursor = "pointer";
        } else {
            Board.style.cursor = "default";
        }
        if (piece != displayedPiece) {
            showPieceInfo(piece);
            draw();
        }
    }

    // mousing over terrain
    if (phase.current >= phase.placeKing) {
        showTerrainInfo(hexAtPos(mouseX, mouseY));
    }

    if (((new Date()).getTime() - drawTime) > redrawInterval) {
        draw();
    }
    moved = true;
};

// If the player's wanton dragging of can be interpreted as a legal move,
// return an object representing that move.
function interpretMove(piece, x, y) {
    var normalMoves = getMoves(piece);
    var captures = getCaptures(piece);
    var move = {x0: piece.x, y0: piece.y, x1: x, y1: y, capture: false, color: piece.color, type: piece.type};
    if (containsHex(captures, x, y)) {
        move.capture = true;
        var captured = getItemAtHex(captures, x, y).captured;
        move.capType = captured.type;
        move.x2 = captured.x;
        move.y2 = captured.y;
    } else if (!containsHex(normalMoves, x, y)) {
        return null;
    }
    return move;
}

Board.onmouseup = function() {
    mouseDown = false;

    // dropping a piece
    if (movingPiece != null) {
        var hex = hexAtPos(movingPieceX, movingPieceY);
        if ((phase.current == phase.playerToMove) || (phase.current == phase.playerSecondMove)) {
            var move = interpretMove(movingPiece, hex.x, hex.y);
            if (move != null) {
                executeMove(move);
            }
        } else if (phase.current <= phase.boardComplete) {
            placePiece(movingPiece, hex.x, hex.y);
        }
        movingPiece = null;
        if (pieceUnderMouse() != null) {
            Board.style.cursor = "pointer";
        } else {
            Board.style.cursor = "default";
        }

    // dropping a tile
    } else if (movingTile != null) {
        if (!moved) {
            rotate(movingTile);
            animateRotation(movingTile);
        } else {
            if (movingTile.slot != null) {
                movingTile.slot.tile = null;
                movingTile.slot = null;
            }
            matchSlot(movingTile);
        }
        movingTile = null;
        Board.style.cursor = "pointer";
    }
    
    showMoves = [];
    showCaptures = [];
    draw();
};

Board.onmousedown = function(event) {
    mouseDown = true;
    var x = mouseX;
    var y = mouseY;
    var piece = pieceUnderMouse();
    var tile = null;
    if (phase.current < phase.placePieces) {
        tile = tileUnderMouse();
    }
    if (piece != null) {
        if ((playerOwns(piece) || mode.current == mode.sandbox) && ((phase.current == phase.placeKing && piece.type == pieceType.king) ||
                                                                    (phase.current == phase.placePieces) ||
                                                                    (phase.current == phase.boardComplete) ||
                                                                    (phase.current == phase.playerToMove) ||
                                                                    (phase.current == phase.playerSecondMove))) {
            movingPiece = piece;
            movingPieceX = hexPosX(piece.x, piece.y) + squareSize/2;
            movingPieceY = hexPosY(piece.x, piece.y) + squareSize/2;
            grabX = x - movingPieceX;
            grabY = y - movingPieceY;
            moveToBack(piece, (playerOwns(piece) ? playerPieces : opponentPieces));
            Board.style.cursor = "none";
        }
        if (phase.current >= phase.playerToMove) { 
            showMoves = getMoves(piece);
            showCaptures = getCaptures(piece);
        }
    } else if (tile != null) {
        movingTile = tile;
        grabX = x - tile.x;
        grabY = y - tile.y;
        moveToBack(tile, tiles);
        moved = false;
        Board.style.cursor = "none";
    }
    draw();
    event.preventDefault();
};