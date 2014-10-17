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

var lastFrame = (new Date()).getTime();

// Determine which tile, if any, is under the cursor.
function tileUnderMouse() {
    for (var i = tiles.length - 1; i >= 0; --i) {
        var tile = tiles[i];
        if (tile == kingsTile) {
            if (posInBounds(mouseX, mouseY, tile.x, tile.y, 3 * SquareSize, SquareSize) ||
                posInBounds(mouseX, mouseY, tile.x + SquareSize/2, tile.y + SquareSize , 2 * SquareSize, SquareSize) ||
                posInBounds(mouseX, mouseY, tile.x + SquareSize, tile.y + (2 * SquareSize), 1 * SquareSize, SquareSize)) {
                return tiles[i];
            }
        } else if (Phase.current > Phase.placeKingsTile) {
            if (posInBounds(mouseX, mouseY, tile.x, tile.y, 2.5 * SquareSize, 2 * SquareSize)) {
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
        var piece = Board[hexToIndex(hex.x, hex.y)].piece;
        if (piece != null) {
            var centerX = hexPosX(hex.x, hex.y) + SquareSize/2;
            var centerY = hexPosY(hex.x, hex.y) + SquareSize/2;
            if (distance(mouseX, mouseY, centerX, centerY) <= (2/5) * SquareSize) {
                return piece;
            }
        }
    }
    return null;
}

BoardCanvas.onmousemove = function(event) {
    mouseX = (event.clientX + document.body.scrollLeft) - (Table.offsetLeft + CanvasCell.offsetLeft + this.offsetLeft);
    mouseY = (event.clientY + document.body.scrollTop) - (Table.offsetTop + CanvasCell.offsetTop + this.offsetTop);

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
        if ((piece != null) || ((tile != null) && (Phase.current <= Phase.placeKing))) {
            this.style.cursor = "pointer";
        } else {
            this.style.cursor = "default";
        }
        if (piece != DisplayedPiece) {
            showPieceInfo(piece);
            draw();
        }
    }

    // mousing over terrain
    if (Phase.current >= Phase.placeKing) {
        showTerrainInfo(hexAtPos(mouseX, mouseY));
    }

    if (((new Date()).getTime() - DrawTime) > RedrawInterval) {
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

BoardCanvas.onmouseup = function() {
    mouseDown = false;

    // dropping a piece
    if (movingPiece != null) {
        var hex = hexAtPos(movingPieceX, movingPieceY);
        if ((Phase.current == Phase.playerToMove) || (Phase.current == Phase.playerSecondMove)) {
            var move = interpretMove(movingPiece, hex.x, hex.y);
            if (move != null) {
                executeMove(move);
            }
        } else if (Phase.current <= Phase.boardComplete) {
            placePiece(movingPiece, hex.x, hex.y);
        }
        movingPiece = null;
        if (pieceUnderMouse() != null) {
            this.style.cursor = "pointer";
        } else {
            this.style.cursor = "default";
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
        this.style.cursor = "pointer";
    }
    
    ShowMoves = [];
    ShowCaptures = [];
    draw();
};

BoardCanvas.onmousedown = function(event) {
    mouseDown = true;
    var x = mouseX;
    var y = mouseY;
    var piece = pieceUnderMouse();
    var tile = null;
    if (Phase.current < Phase.placePieces) {
        tile = tileUnderMouse();
    }
    if (piece != null) {
        if ((playerOwns(piece) || Mode.current == Mode.sandbox) && ((Phase.current == Phase.placeKing && piece.type == PieceType.king) ||
                                                                    (Phase.current == Phase.placePieces) ||
                                                                    (Phase.current == Phase.boardComplete) ||
                                                                    (Phase.current == Phase.playerToMove) ||
                                                                    (Phase.current == Phase.playerSecondMove))) {
            movingPiece = piece;
            movingPieceX = hexPosX(piece.x, piece.y) + SquareSize/2;
            movingPieceY = hexPosY(piece.x, piece.y) + SquareSize/2;
            grabX = x - movingPieceX;
            grabY = y - movingPieceY;
            moveToBack(piece, (playerOwns(piece) ? PlayerPieces : OpponentPieces));
            this.style.cursor = "none";
        }
        if (Phase.current >= Phase.playerToMove) { 
            ShowMoves = getMoves(piece);
            ShowCaptures = getCaptures(piece);
        }
    } else if (tile != null) {
        movingTile = tile;
        grabX = x - tile.x;
        grabY = y - tile.y;
        moveToBack(tile, tiles);
        moved = false;
        this.style.cursor = "none";
    }
    draw();
    event.preventDefault();
};