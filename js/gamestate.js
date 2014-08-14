function setMode(newMode) {
    if (newMode == mode.sandbox) {
        EndTurnButton.innerHTML = "Redo";
        ResignButton.innerHTML = "Exit";
    } else {
        EndTurnButton.innerHTML = "End Turn";
        ResignButton.innerHTML = "Resign";
    }
    mode.current = newMode;
}

// Set the current phase to the given phase, display and update the appropriate
// HTML elements for the new phase, and handle any operations needed for phase
// transisions.
function setPhase(newPhase) {

    // remove new player status upon starting a game
    if (localStorage.newPlayer && (newPhase >= phase.playerToMove)) {
        localStorage.newPlayer = false;
    }

    // determine visibility of HTML elements
    setVisibility(NewPlayerMessage, localStorage.newPlayer == "true");
    setVisibility(SaveBoardForm, newPhase == phase.boardComplete);
    setVisibility(LoadBoardForm, (newPhase > phase.loading) && (newPhase <= phase.boardComplete) && (localStorage.boards != "[]"));
    setVisibility(LoadGameForm, (newPhase > phase.loading) && (newPhase <= phase.boardComplete) && (localStorage.games != "[]"));
    setVisibility(GameModeForm, (newPhase == phase.boardComplete) && (localStorage.boards != "[]"));
    setVisibility(ExchangeBoardsForm, newPhase == phase.exchangeBoards);
    setVisibility(ConfirmExchangeForm, newPhase == phase.confirmExchange);
    setVisibility(LoadOpponentForm, newPhase == phase.localSetup);
    setVisibility(TurnInterface, (newPhase >= phase.playerToMove));
    setVisibility(MoveCodeInputInterface, (mode.current == mode.raven) && (newPhase == phase.awaitingOpponentMove));
    setVisibility(MoveCodeOutputInterface, ((MoveCodeInputInterface.style.display != "none") && (gameHistory.length > 0)) ||
                ((mode.current == mode.raven) && (newPhase == phase.gameOver) && (gameHistory[gameHistory.length - 1].color == playerColor)));
    UndoButton.disabled = (gameHistory.length == 0) ||
                        ((mode.current != mode.sandbox) && (newPhase != phase.playerMoved) && (newPhase != phase.playerSecondMove));
    EndTurnButton.disabled = ((mode.current == mode.sandbox) && (undoneHistory.length == 0)) ||
                        ((mode.current != mode.sandbox) && (newPhase != phase.playerMoved) && (newPhase != phase.playerSecondMove));
    ResignButton.disabled = (mode.current == mode.raven) && (newPhase == phase.awaitingOpponentMove);
    setVisibility(RavenModeFirstMessage, (mode.current == mode.raven) && (gameHistory.length == 0) && (newPhase == phase.playerToMove));
    setVisibility(RavenModeSecondMessage, (mode.current == mode.raven) && (gameHistory.length == 0) && (newPhase == phase.awaitingOpponentMove));
    setVisibility(ExitGameInterface, (newPhase >= phase.playerToMove) && (newPhase < phase.gameOver));
    setVisibility(SaveGameInterface, false);
    setVisibility(ResignConfirmation, false);
    setVisibility(DeleteGameConfirmation, false);
    setVisibility(DeleteBoardConfirmation, false);
    setVisibility(SaveBoardMessage, false);
    setVisibility(SaveGameMessage, false);

    // update help text
    if (newPhase in instructions) {
        HelpText.innerHTML = instructions[newPhase];
    } else {
        HelpText.innerHTML = "";
    }

    // show terrain info during tile placement
    if (newPhase == phase.placeTiles) {
        setVisibility(MountainInfo, true);
        setVisibility(WaterInfo, true);
    }

    // keep bottomTileArrangement up to date and offer pieces during board setup
    if (newPhase == phase.placeKing) {
        if (phase.current == phase.placeTiles) {
            bottomTileArrangement = getTileArrangement();
        } else {
            arrangeTiles(bottomTileArrangement);
        }
        offerKing();
    } else if ((newPhase == phase.placePieces) && (phase.current == phase.placeKing)) {
        offerPieces();
    }

    // keep bottomPieceArrangement up to date
    if (newPhase == phase.boardComplete) {
        bottomPieceArrangement = getPieceArrangement();
    }

    // display the appropriate mode description
    if ((newPhase == phase.localSetup) || (newPhase == phase.exchangeBoards) || (newPhase == phase.confirmExchange)) {
        ModeDescriptionText.innerHTML = modeDescriptions[mode.current];
    } else {
        ModeDescriptionText.innerHTML = "";
    }

    // output raven mode codes
    if (newPhase == phase.exchangeBoards) {
        ChallengeCodeInput.value = "";
        ChallengeCodeOutput.value = encodeBoard(bottomTileArrangement, bottomPieceArrangement, playerRollCode);
        ChallengeCodeOutput.select();
    } else if (newPhase == phase.confirmExchange) {
        if (phase.current == phase.exchangeBoards) {
            opponentChallengeCode = ChallengeCodeInput.value;
        }
        ConfirmationCodeInput.value = "";
        ConfirmationCodeOutput.value = playerRollCode.toString(16);
        ConfirmationCodeOutput.select();
    } else if (MoveCodeOutputInterface.style.display != "none") {
        MoveCodeOutput.value = encodeLatestMove();
        MoveCodeOutput.select();
    }

    // display game over message
    if (newPhase == phase.gameOver) {
        var lastMove = gameHistory[gameHistory.length - 1];
        if (lastMove.color != (lastMove.x0 == 12)) {
            GameOverText.innerHTML = "<span style=\"color:white; background-color:black; font-size:20px\"><b>Victory Black!</b></span>";
        } else {
            GameOverText.innerHTML = "<span style=\"font-size:20px\"><b>Victory White!</b></span>";
        }
        setVisibility(GameOverInterface, true);
    } else {
        setVisibility(GameOverInterface, false);
    }

    // scroll history to the bottom
    ScrollDiv.scrollTop = ScrollDiv.scrollHeight;

    phase.current = newPhase;
    draw();
}


// Tiles

var tiles = [];
var kingsTile;

var kingSlots = new Array(3);
kingSlots[0] = {x: leftMargin + (2.5 * squareSize), y: topMargin + (5 * squareSize), tile: null};
kingSlots[1] = {x: leftMargin + (4.5 * squareSize), y: topMargin + (5 * squareSize), tile: null};
kingSlots[2] = {x: leftMargin + (6.5 * squareSize), y: topMargin + (5 * squareSize), tile: null};

//    left       right
//  0  1  2  |  0  1  2
//   3  4  5 | 3  4  5

var leftSlots = new Array(6);
leftSlots[0] = {x: leftMargin + (0.5 * squareSize), y: topMargin + (5 * squareSize), tile: null};
leftSlots[1] = {x: leftMargin + (2.5 * squareSize), y: topMargin + (5 * squareSize), tile: null};
leftSlots[2] = {x: leftMargin + (4.5 * squareSize), y: topMargin + (5 * squareSize), tile: null};
leftSlots[3] = {x: leftMargin + (1.5 * squareSize), y: topMargin + (7 * squareSize), tile: null};
leftSlots[4] = {x: leftMargin + (3.5 * squareSize), y: topMargin + (7 * squareSize), tile: null};
leftSlots[5] = {x: leftMargin + (5.5 * squareSize), y: topMargin + (7 * squareSize), tile: null};

var rightSlots = new Array(6);
rightSlots[0] = {x: leftMargin + (5 * squareSize), y: topMargin + (5 * squareSize), tile: null};
rightSlots[1] = {x: leftMargin + (7 * squareSize), y: topMargin + (5 * squareSize), tile: null};
rightSlots[2] = {x: leftMargin + (9 * squareSize), y: topMargin + (5 * squareSize), tile: null};
rightSlots[3] = {x: leftMargin + (4 * squareSize), y: topMargin + (7 * squareSize), tile: null};
rightSlots[4] = {x: leftMargin + (6 * squareSize), y: topMargin + (7 * squareSize), tile: null};
rightSlots[5] = {x: leftMargin + (8 * squareSize), y: topMargin + (7 * squareSize), tile: null};

// Initialize the tiles array and place the tiles on the divider screen.
function setUpTiles() {
    tiles = new Array(9);
    kingsTile = {id: 8, squares: null, rotated: false, x: Math.round(leftMargin + (4.5 * squareSize)),
                                                    y: Math.round(topMargin + (0.75 * squareSize)), slot: null};
    for (var i = 0; i < 8; ++i) {
        tiles[i] = {id: i, squares: new Array(8), rotated: false, x: 0, y: 0, slot: null};
        for (var j = 0; j < 8; ++j) {
            tiles[i].squares[j] = terType.open;
        }
    }
    tiles[8] = kingsTile;

    // give the tiles their terrain
    tiles[0].squares[0] = terType.mountain;
    tiles[0].squares[3] = terType.mountain;
    tiles[0].squares[5] = terType.mountain;
    tiles[1].squares[0] = terType.water;
    tiles[1].squares[1] = terType.water;
    tiles[1].squares[4] = terType.water;
    tiles[2].squares[0] = terType.mountain;
    tiles[2].squares[4] = terType.water;
    tiles[3].squares[1] = terType.water;
    tiles[3].squares[5] = terType.mountain;
    tiles[4].squares[0] = terType.mountain;
    tiles[5].squares[1] = terType.water;

    // position the tiles
    var y = topMargin + squareSize/6;
    var x = leftMargin + squareSize/4;
    for (var i = 0; i < 8; ++i) {
        tiles[i].x = Math.round(x);
        tiles[i].y = Math.round(y);
        tiles[i].side = ((x + (1.25 * squareSize)) < (kingsTile.x + (1.5 * squareSize)));
        x += 3 * squareSize;
        if (i == 3) {
            y += (13/6) * squareSize;
            x = leftMargin + squareSize/4;
        }
    }
}

// Determine whether all the tiles are placed in the appropriate slots.
function areTilesArranged() {
    if (kingsTile.slot == kingSlots[0]) {
        return ((leftSlots[0].tile != null) &&
                (leftSlots[3].tile != null) &&
                (rightSlots[0].tile != null) &&
                (rightSlots[1].tile != null) &&
                (rightSlots[2].tile != null) &&
                (rightSlots[3].tile != null) &&
                (rightSlots[4].tile != null) &&
                (rightSlots[5].tile != null));
    } else if (kingsTile.slot == kingSlots[1]) {
        return ((leftSlots[0].tile != null) &&
                (leftSlots[1].tile != null) &&
                (leftSlots[3].tile != null) &&
                (leftSlots[4].tile != null) &&
                (rightSlots[1].tile != null) &&
                (rightSlots[2].tile != null) &&
                (rightSlots[4].tile != null) &&
                (rightSlots[5].tile != null));
    } else if (kingsTile.slot == kingSlots[2]) {
        return ((leftSlots[0].tile != null) &&
                (leftSlots[1].tile != null) &&
                (leftSlots[2].tile != null) &&
                (leftSlots[3].tile != null) &&
                (leftSlots[4].tile != null) &&
                (leftSlots[5].tile != null) &&
                (rightSlots[2].tile != null) &&
                (rightSlots[5].tile != null));
    }
    return false;
}

// Set the board terrain from the tile in the given left slot.
function readTerrainLeftSlot(slot) {
    if (slot.tile != null) {
        var hex = hexAtPos(slot.x, slot.y);
        board[hexToIndex(hex.x, hex.y)].terrain = slot.tile.squares[0];
        board[hexToIndex(hex.x + 1, hex.y + 1)].terrain = slot.tile.squares[1];
        board[hexToIndex(hex.x + 1, hex.y)].terrain = slot.tile.squares[2];
        board[hexToIndex(hex.x + 2, hex.y + 1)].terrain = slot.tile.squares[3];
    }
}

// Set the board terrain from the tile in the given right slot.
function readTerrainRightSlot(slot) {
    if (slot.tile != null) {
        var hex = hexAtPos(slot.x + squareSize/2, slot.y);
        board[hexToIndex(hex.x, hex.y)].terrain = slot.tile.squares[4];
        board[hexToIndex(hex.x + 1, hex.y + 1)].terrain = slot.tile.squares[5];
        board[hexToIndex(hex.x, hex.y - 1)].terrain = slot.tile.squares[6];
        board[hexToIndex(hex.x + 1, hex.y)].terrain = slot.tile.squares[7];
    }
}

// Set the terrain on the bottom half of the board to the terrain on the tiles,
// assuming the tiles are properly arranged.
function readTerrainFromTiles() {
    for (var i = 50; i < 88; ++i) {
        board[i].terrain = terType.open;
    }
    for (var i = 0; i < 6; ++i) {
        readTerrainLeftSlot(leftSlots[i]);
    }
    for (var i = 0; i < 6; ++i) {
        readTerrainRightSlot(rightSlots[i]);
    }
}

// Return an object representing the current tile arrangement.
function getTileArrangement() {
    var arrangement = new Array(12);
    for (var i = 0; i < 6; ++i) {
        if (leftSlots[i].tile != null) {
            arrangement[i] = {tileId: leftSlots[i].tile.id, rotated: leftSlots[i].tile.rotated};
        } else {
            arrangement[i] = null;
        }
    }
    for (var i = 0; i < 6; ++i) {
        if (rightSlots[i].tile != null) {
            arrangement[i + 6] = {tileId: rightSlots[i].tile.id, rotated: rightSlots[i].tile.rotated};
        } else {
            arrangement[i + 6] = null;
        }
    }
    return arrangement;
}

// Arrange the tiles according the given tile arrangement object.
function arrangeTiles(arrangement) {
    clearSlots();
    setUpTiles();
    for (var i = 0; i < 6; ++i) {
        if (arrangement[i] != null) {
            var tile = tiles[arrangement[i].tileId];
            var slot = leftSlots[i];
            if (arrangement[i].rotated) {
                rotate(tile);
            }
            insertTile(tile, slot, false);
        }
    }
    for (var i = 0; i < 6; ++i) {
        if (arrangement[i + 6] != null) {
            var tile = tiles[arrangement[i + 6].tileId];
            var slot = rightSlots[i];
            if (arrangement[i + 6].rotated) {
                rotate(tile);
            }
            insertTile(tile, slot, false);
        }
    }
    if (arrangement[1] == null) {
        insertTile(kingsTile, kingSlots[0], false);
    } else if (arrangement[2] == null) {
        insertTile(kingsTile, kingSlots[1], false);
    } else {
        insertTile(kingsTile, kingSlots[2], false);
    }
    for (var i = 0; i < tiles.length; ++i) {
        if (tiles[i] != kingsTile) {
            tiles[i].side = ((tiles[i].x + (1.25 * squareSize)) < (kingsTile.x + (1.5 * squareSize)));
        }
    }
    bottomTileArrangement = arrangement;
    //readTerrainFromTiles();
}

// Set each slot's tile to null.
function clearSlots() {
    for (var i = 0; i < 3; ++i) {
        kingSlots[i].tile = null;
    }
    for (var i = 0; i < 6; ++i) {
        leftSlots[i].tile = null;
    }
    for (var i = 0; i < 6; ++i) {
        rightSlots[i].tile = null;
    }
}

// Rotate the squares on a tile.
function rotate(tile) {
    if (tile != kingsTile) {
        var newSquares = tile.squares.slice(0, 4).reverse();
        newSquares = newSquares.concat(tile.squares.slice(4, 8).reverse());
        tile.squares = newSquares;
        tile.rotated = !(tile.rotated);
    }
}

// Assaociate a tile with a slot. If reorder is true, send the tile to the
// front of the list, so it is drawn behind the others.
function insertTile(tile, slot, reorder) {
    tile.x = slot.x;
    tile.y = slot.y;
    slot.tile = tile;
    tile.slot = slot;
    if (reorder) {
        moveToFront(tile, tiles);
    }
}

// If the tile is close enough to a slot, put it in that slot and return true.
// Switch to a new phase if the tile's placement calls for it.
function matchSlot(tile) {
    var slots = null;
    if (tile == kingsTile) {
        slots = kingSlots;
    } else if ((tile.x + (1.25 * squareSize)) < (kingsTile.x + (1.5 * squareSize))) {
        slots = leftSlots;
    } else {
        slots = rightSlots;
    }
    for (var i = 0; i < slots.length; ++i) {
        var slot = slots[i];
        if (slot.tile == null) {
            if (posInBounds(tile.x + squareSize/2, tile.y + squareSize/2, slot.x, slot.y, squareSize, squareSize)) {
                insertTile(tile, slot, true);
                if (kingsTile.slot != null) {
                    if (areTilesArranged()) {
                        setPhase(phase.placeKing);
                    } else {
                        setPhase(phase.placeTiles);
                    }
                }
                return true;
            }
        }
    }
    tile.slot == null;
    if (phase.current == phase.placeKing) {
        setPhase(phase.placeTiles);
    }
    return false;
}


// Pieces

function offerKing() {
    playerPieces = new Array();
    playerPieces.push({type: pieceType.king, x: 4, y: 7, color: true});
    board[hexToIndex(4, 7)].piece = playerPieces[0];
    // kingPiece = playerPieces[0];
}

function offerPieces() {
    playerPieces.push({type: pieceType.rabble, x:1 , y:4, color: true});
    playerPieces.push({type: pieceType.rabble, x:2 , y:5, color: true});
    playerPieces.push({type: pieceType.rabble, x:3 , y:6, color: true});
    playerPieces.push({type: pieceType.rabble, x:4 , y:7, color: true});
    playerPieces.push({type: pieceType.rabble, x:5 , y:8, color: true});
    playerPieces.push({type: pieceType.rabble, x:6 , y:9, color: true});
    playerPieces.push({type: pieceType.spears, x:1 , y:3, color: true});
    playerPieces.push({type: pieceType.spears, x:2 , y:4, color: true});
    playerPieces.push({type: pieceType.spears, x:3 , y:5, color: true});
    playerPieces.push({type: pieceType.lightHorse, x:4 , y:6, color: true});
    playerPieces.push({type: pieceType.lightHorse, x:5 , y:7, color: true});
    playerPieces.push({type: pieceType.lightHorse, x:6 , y:8, color: true});
    playerPieces.push({type: pieceType.heavyHorse, x:7 , y:9, color: true});
    playerPieces.push({type: pieceType.heavyHorse, x:8 , y:10, color: true});
    playerPieces.push({type: pieceType.elephant, x:5 , y:6, color: true});
    playerPieces.push({type: pieceType.elephant, x:6 , y:7, color: true});
    playerPieces.push({type: pieceType.crossbows, x:2 , y:3, color: true});
    playerPieces.push({type: pieceType.crossbows, x:3 , y:4, color: true});
    playerPieces.push({type: pieceType.trebuchet, x:4 , y:5, color: true});
    playerPieces.push({type: pieceType.dragon, x:7 , y:10, color: true});
    playerPieces.push({type: pieceType.tower, x:7 , y:8, color: true});
    playerPieces.push({type: pieceType.tower, x:8 , y:9, color: true});
    for (var i = 0; i < playerPieces.length; ++i){
        var piece = playerPieces[i];
        board[hexToIndex(piece.x, piece.y)].piece = piece;
    }
}

// Return an array representing the number of pieces of each type on the
// bottom half of the board.
function countPieces() {
    var pieceCount = new Array(10);
    for (var i = 0; i < 10; ++i) {
        pieceCount[i] = 0;
    }
    for (var i = 50; i < 88; ++i) {
        if (board[i].piece != null) {
            ++pieceCount[board[i].piece.type];
        }
    }
    return pieceCount;
}

// Determine whether the pieces on the board are appropriately set up.
function arePiecesArranged() {
    var pieceCount = countPieces();
    for (var i = 0; i < 10; ++i) {
        if (pieceCount[i] != requiredPieceCount[i]) {
            return false;
        }
    }
    return true;
}

// Return an object representing the arrangement of the player's pieces.
function getPieceArrangement() {
    var arrangement = new Array(totalPieceCount);
    for (var i = 0; i < totalPieceCount; ++i) {
        arrangement[i] = {type: playerPieces[i].type, x: playerPieces[i].x, y: playerPieces[i].y};
    }
    return arrangement;
}

// Arrange the player's pieces according to the given piece arrangement object.
function arrangePieces(arrangement) {
    clearBoardOfPieces();
    playerPieces = new Array(totalPieceCount);
    for (var i = 0; i < totalPieceCount; ++i) {
        var piece = {type: arrangement[i].type, x: arrangement[i].x, y: arrangement[i].y, color: playerColor};
        playerPieces[i] = piece;
        board[hexToIndex(piece.x, piece.y)].piece = playerPieces[i];
    }
    bottomPieceArrangement = arrangement
}

// Removes the pieces from the board. Doesn't change the location of the
// pieces.
function clearBoardOfPieces() {
    for (var i = 50; i < 88; ++i) {
        board[i].piece = null;
    }
}

// Handle the player attempting to place a piece on a square during setup.
// Sets the phase when appropriate.
function placePiece(piece, x, y) {

    // handle placement of the king, which can only go on the king's square
    if (piece.type == pieceType.king) {
        var kingSquare = kingSlots.indexOf(kingsTile.slot);
        if ((x == 5 + (2 * kingSquare)) && (y == 2 + (2 * kingSquare))) {
            piece.x = x;
            piece.y = y;
            board[73 + (2 * kingSquare)].piece = piece;
            if (phase.current != phase.boardComplete) {
                setPhase(phase.placePieces);
            }
            readTerrainFromTiles();
        } else {
            for (var i = 0; i < 88; ++i) {
                board[i].piece = null;
            }
            setPhase(phase.placeKing);
        }

    } else if ((hexInBounds(x, y)) && (hexToIndex(x, y) >= 50)) {
        var square = board[hexToIndex(x, y)];
        if (square.terrain != terType.mountain) {

            // if there is already a piece here, swap the pieces
            if (square.piece != null) {
                if (square.piece.type == pieceType.king) {
                    return;
                }
                square.piece.x = piece.x;
                square.piece.y = piece.y;
            }

            board[hexToIndex(piece.x, piece.y)].piece = square.piece;
            piece.x = x;
            piece.y = y;
            square.piece = piece;
            if (arePiecesArranged()) {
                setPhase(phase.boardComplete);
            }
        }
    }
}

function randomizePieceArrangement() {
    clearBoardOfPieces();
    for (var i = 0; i < playerPieces.length; ++i) {
        var piece = playerPieces[i];
        if (piece.type == pieceType.king) {
            var kingSquare = kingSlots.indexOf(kingsTile.slot);
            piece.x = 5 + (2 * kingSquare);
            piece.y = 2 + (2 * kingSquare);
            board[73 + (2 * kingSquare)].piece = piece;
            break;
        }
    }
    for (var i = 0; i < playerPieces.length; ++i) {
        var piece = playerPieces[i];
        if (piece.type != pieceType.king) {
            var boardIndex;
            do {
                boardIndex = Math.floor(Math.random() * 38) + 50;
            } while ((board[boardIndex].piece != null) || (board[boardIndex].terrain == terType.mountain));
            var hex = indexToHex(boardIndex);
            piece.x = hex.x;
            piece.y = hex.y;
            board[boardIndex].piece = playerPieces[i];
        }
    }
    setPhase(phase.boardComplete);
    draw();
}


// Turns

// Set playerRollCode to a random roll code.
function rollInitiative() {
    playerRollCode = Math.floor(Math.random() * Math.pow(2, rollsize)).toString(16);
    while (playerRollCode.length < rollsize / 4) {
        playerRollCode = "0" + playerRollCode;
    }
}

// Determing whether the player has initiative based on his and his oppoent's
// rolls. Every role has an even chance versus a random roll. 
function determineInitiative() {
    var playerInitiativeRoll = parseInt(playerRollCode, 16);
    var opponentInitiativeRoll = parseInt(opponentRollCode, 16);
    var modSum = (playerInitiativeRoll + opponentInitiativeRoll) % Math.pow(2, rollsize);
    return Math.abs(modSum - playerInitiativeRoll) < Math.abs(modSum - opponentInitiativeRoll);
}

// Reverse control of the pieces.
function switchPlayer() {
    var originalPlayerPieces = playerPieces;
    playerPieces = opponentPieces;
    opponentPieces = originalPlayerPieces;
    playerColor = !playerColor;
}

// Set playerColor to the given color, and color all the pieces in playerPieces
// and opponentPieces accordingly.
function setPlayerColor(color) {
    playerColor = color;
    for (var i = 0; i < playerPieces.length; ++i) {
        playerPieces[i].color = color;
    }
    for (var i = 0; i < opponentPieces.length; ++i) {
        opponentPieces[i].color = !color;
    }
}

// determine whether two moves are the same.
function identicalMoves(move1, move2) {
    if (move1.capture) {
        if (!(move2.capture) ||
            (move1.capType != move2.capType) ||
            (move1.x2 != move2.x2) ||
            (move1.y2 != move2.y2)) {
            return false;
        }
    }
    return ((move1.color == move2.color) &&
            (move1.type == move2.type) &&
            (move1.x0 == move2.x0) &&
            (move1.y0 == move2.y0) &&
            (move1.x1 == move2.x1) &&
            (move1.y1 == move2.y1));
}

// Translate a decoded move, which only contains the start and end points, into
// a move object that can be passed to executeMove().
function reconstructDecodedMove(move) {
    if ((move.x0 == 12) || (move.x0 == -1)) {
        return {x0: 12, y0: 12, x1: 12, y1: 12, color: !playerColor};
    }
    var piece = getItemAtHex(opponentPieces, move.x0, move.y0);
    if (piece == null) {
        return null;
    }
    move.type = piece.type;
    move.color = !playerColor;
    var normalMoves = getMoves(piece);
    var captures = getCaptures(piece);
    if (containsHex(captures, move.x1, move.y1)) {
        var capturedPiece = getItemAtHex(captures, move.x1, move.y1).captured
        move.capture = true;
        move.capType = capturedPiece.type;
        move.x2 = capturedPiece.x;
        move.y2 = capturedPiece.y;
    } else if (containsHex(normalMoves, move.x1, move.y1)) {
        move.capture = false;
    } else {
        move = null;
    }
    return move;
}

// Update the board state, history, and phase according to the given move.
function executeMove(move) {

    //handle resignation
    if (move.x0 == 12) {
        gameHistory.push(move);
        updateLogs();
        setPhase(phase.gameOver);
        return;
    }

    //modify the board and pieces
    var pieces = (move.color == playerColor ? playerPieces : opponentPieces);
    var piece = getItemAtHex(pieces, move.x0, move.y0);
    if (move.capture) {
        var enemyPieces = (move.color == playerColor ? opponentPieces : playerPieces);
        var enemyPiece = getItemAtHex(enemyPieces, move.x2, move.y2);
        enemyPieces.splice(enemyPieces.indexOf(enemyPiece), 1);
        board[hexToIndex(move.x2, move.y2)].piece = null;
    }
    piece.x = move.x1;
    piece.y = move.y1;
    board[hexToIndex(move.x0, move.y0)].piece = null;
    board[hexToIndex(move.x1, move.y1)].piece = piece;

    //update history
    gameHistory.push(move);
    if (mode.current == mode.sandbox) {
        if ((undoneHistory.length != 0) && (identicalMoves(undoneHistory[0], move))) {
            undoneHistory.splice(0, 1);
        } else {
            undoneHistory = new Array();
        }
    }
    updateLogs();

    //animate
    if (mode.current != mode.setup) {
        animateMove(move);
    }

    updateKingThreats();

    //determine next phase
    if (mode.current == mode.sandbox) {
        setPhase(phase.playerToMove);
    } else if ((phase.current == phase.awaitingOpponentMove) && move.capture && (move.capType == pieceType.king)) {
        setPhase(phase.gameOver);
    } else if ((mode.current == mode.raven) && (move.color != playerColor)) {
        setPhase(phase.playerToMove);
    } else if (mode.current != mode.setup) {
        if ((phase.current == phase.playerToMove) &&
            doubleMovement[move.type] &&
            !(move.capture) &&
            (hexDistance(move.x0, move.y0, move.x1, move.y1) == 1)) {

            setPhase(phase.playerSecondMove);
        } else {
            setPhase(phase.playerMoved);
        }
    }
}

// Reverse the execution of the last move in gameHistory.
function undoLastMove() {
    var move = gameHistory.pop();
    var pieces = (playerColor == move.color ? playerPieces : opponentPieces);
    var piece = getItemAtHex(pieces, move.x1, move.y1);

    // revert move
    piece.x = move.x0;
    piece.y = move.y0;
    board[hexToIndex(move.x0, move.y0)].piece = piece;
    board[hexToIndex(move.x1, move.y1)].piece = null;
    if (move.capture) {
        var enemyPieces = (playerColor == move.color ? opponentPieces : playerPieces);
        var capturedPiece = {type: move.capType, x: move.x2 , y: move.y2, color: !(move.color)};
        enemyPieces.push(capturedPiece);
        board[hexToIndex(move.x2, move.y2)].piece = capturedPiece;
    }

    updateKingThreats();

    // determine phase and update history
    if (mode.current == mode.sandbox) {
        undoneHistory.splice(0, 0, move);
        setPhase(phase.playerToMove);
    } else if ((mode.current == mode.raven) && (move.color != playerColor)) {
        setPhase(phase.awaitingOpponentMove);
    } else {
        if ((gameHistory.length > 0) && (move.color == gameHistory[gameHistory.length - 1].color)) {
            setPhase(phase.playerSecondMove);
        } else {
            setPhase(phase.playerToMove);
        }
    }
    updateLogs();
}

// Reverse the coordinates of every move in gameHistory and undoneHistory.
function reverseHistory() {
    for (var i = 0; i < gameHistory.length; ++i) {
        var move = gameHistory[i];
        move.x0 = 11 - move.x0;
        move.y0 = 11 - move.y0;
        move.x1 = 11 - move.x1;
        move.y1 = 11 - move.y1;
        if (move.capture) {
            move.x2 = 11 - move.x2;
            move.y2 = 11 - move.y2;
        }
    }
    for (var i = 0; i < undoneHistory.length; ++i) {
        var move = undoneHistory[i];
        move.x0 = 11 - move.x0;
        move.y0 = 11 - move.y0;
        move.x1 = 11 - move.x1;
        move.y1 = 11 - move.y1;
        if (move.capture) {
            move.x2 = 11 - move.x2;
            move.y2 = 11 - move.y2;
        }
    }
}

// Rotate the board top-to-bottom.
function reverseBoard() {
    for (var i = 0; i < 44; ++i) {
        var squareOne = board[i];
        var squareTwo = board[87 - i];
        board[i] = squareTwo;
        board[87 - i] = squareOne;
    }
    for (var i = 0; i < playerPieces.length; ++i) {
        var piece = playerPieces[i];
        piece.x = 11 - piece.x;
        piece.y = 11 - piece.y;
    }
    for (var i = 0; i < opponentPieces.length; ++i) {
        var piece = opponentPieces[i];
        piece.x = 11 - piece.x;
        piece.y = 11 - piece.y;
    }

    newBottomTileArrangement = topTileArrangement;
    newBottomPieceArrangement = topPieceArrangement;

    topTileArrangement = bottomTileArrangement;
    topPieceArrangement = bottomPieceArrangement;

    bottomTileArrangement = newBottomTileArrangement;
    bottomPieceArrangement = newBottomPieceArrangement

    switchPlayer();
    topColor = !topColor;

    updateKingThreats();
}


// Setup and Game End

// Get everything off the board.
function wipeBoard() {
    for (var i = 0; i < 88; ++i) {
        board[i] = {piece: null, terrain: terType.open};
    }
    playerPieces = [];
    opponentPieces = [];
    playerColor = true;
    topColor = false;
    showMoves = [];
    showCaptures = [];
    gameHistory = [];
    undoneHistory = [];
    updateLogs();
    topTileArrangement = null;
    bottomTileArrangement = null;
    topPieceArrangement = null;
    bottomPieceArrangement = null;
    clearSlots();
}

// Return an object representing the current game state. The current position
// of the pieces is not recorded. Instead, each player's board setup and the
// game history are recorded.
function getGameState() {
    if (phase.current < phase.placeKing) {
        return null;
    }
    if (mode.current == mode.setup) {
        if (phase.current >= phase.placePieces) {
            bottomPieceArrangement = getPieceArrangement();
        } else {
            bottomPieceArrangement = null;
        }
    }
    var gameState = {
        mode: mode.current,
        phase: phase.current,
        topColor: topColor,
        topTileArrangement: topTileArrangement,
        bottomTileArrangement: bottomTileArrangement,
        topPieceArrangement: topPieceArrangement,
        bottomPieceArrangement: bottomPieceArrangement,
        gameHistory: gameHistory,
        undoneHistory: undoneHistory
    };
    if (mode.current == mode.raven) {
        gameState.playerRollCode = playerRollCode;
        gameState.opponentRollCode = opponentRollCode;
    }
    return gameState;
}

// Set the current game state according to the given game state object.
function restoreGameState(gameState) {

    if (gameState == null) {
        setPhase(phase.placeKingsTile);
        return;
    }

    if (gameState.mode == mode.raven) {
        playerRollCode = gameState.playerRollCode;
        opponentRollCode = gameState.opponentRollCode;
    }

    if (gameState.phase < phase.playerToMove) {

        topColor = gameState.topColor;
        playerColor = !topColor;

        if (gameState.bottomTileArrangement != null) {
            arrangeTiles(gameState.bottomTileArrangement);
            if (gameState.bottomPieceArrangement != null) {
                arrangePieces(gameState.bottomPieceArrangement);
            }
        }
        
    } else {

        topColor = !gameState.topColor;
        playerColor = !topColor;

        clearSlots();
        clearBoardOfPieces();
        arrangeTiles(gameState.topTileArrangement);
        readTerrainFromTiles();
        arrangePieces(gameState.topPieceArrangement);
        reverseBoard();
        arrangeTiles(gameState.bottomTileArrangement);
        readTerrainFromTiles();
        arrangePieces(gameState.bottomPieceArrangement);

        // play out the game according to the history
        for (moveCount = 0; moveCount < gameState.gameHistory.length; ++moveCount) {
            executeMove(gameState.gameHistory[moveCount]);
        }

        undoneHistory = gameState.undoneHistory;

    }

    setMode(gameState.mode);
    setPhase(gameState.phase);
    
    updateLogs();
}

// Forget the current game and return to the setup phases.
function leaveGame() {
    setMode(mode.setup);
    wipeBoard();
    setUpTiles();
    setPhase(phase.placeKingsTile);
}