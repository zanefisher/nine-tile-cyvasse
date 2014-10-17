function setMode(newMode) {
    if (newMode == Mode.sandbox) {
        EndTurnButton.innerHTML = "Redo";
        ResignButton.innerHTML = "Exit";
    } else {
        EndTurnButton.innerHTML = "End Turn";
        ResignButton.innerHTML = "Resign";
    }
    Mode.current = newMode;
}

// Set the current phase to the given phase, display and update the appropriate
// HTML elements for the new phase, and handle any operations needed for phase
// transisions.
function setPhase(newPhase) {

    // remove new player status upon starting a game
    if (localStorage.newPlayer && (newPhase >= Phase.playerToMove)) {
        localStorage.newPlayer = false;
    }

    if (Mode.current == Mode.raven) {
        if ((newPhase == Phase.exchangeBoards) || (newPhase == Phase.confirmExchange)) {
            ResignButton.innerHTML = "Exit";
        } else {
            ResignButton.innerHTML = "Resign";
        }
    }

    // determine visibility of HTML elements
    setVisibility(NewPlayerMessage, localStorage.newPlayer == "true");
    setVisibility(SaveBoardForm, newPhase == Phase.boardComplete);
    setVisibility(LoadBoardForm, (newPhase > Phase.loading) && (newPhase <= Phase.boardComplete) && (localStorage.boards != "[]"));
    setVisibility(LoadGameForm, (newPhase > Phase.loading) && (newPhase <= Phase.boardComplete) && (localStorage.games != "[]"));
    setVisibility(GameModeForm, (newPhase == Phase.boardComplete) && (localStorage.boards != "[]"));
    setVisibility(ExchangeBoardsForm, newPhase == Phase.exchangeBoards);
    setVisibility(ConfirmExchangeForm, newPhase == Phase.confirmExchange);
    setVisibility(LoadOpponentForm, newPhase == Phase.localSetup);
    setVisibility(TurnInterface, (newPhase >= Phase.playerToMove));
    setVisibility(MoveCodeInputInterface, (Mode.current == Mode.raven) && (newPhase == Phase.awaitingOpponentMove));
    setVisibility(MoveCodeOutputInterface, ((MoveCodeInputInterface.style.display != "none") && (GameHistory.length > 0)) ||
                ((Mode.current == Mode.raven) && (newPhase == Phase.gameOver) && (GameHistory[GameHistory.length - 1].color == PlayerColor)));
    UndoButton.disabled = (GameHistory.length == 0) ||
                        ((Mode.current != Mode.sandbox) && (newPhase != Phase.playerMoved) && (newPhase != Phase.playerSecondMove));
    EndTurnButton.disabled = ((Mode.current == Mode.sandbox) && (UndoneHistory.length == 0)) ||
                        ((Mode.current != Mode.sandbox) && (newPhase != Phase.playerMoved) && (newPhase != Phase.playerSecondMove));
    ResignButton.disabled = (Mode.current == Mode.raven) && (newPhase == Phase.awaitingOpponentMove);
    setVisibility(RavenModeFirstMessage, (Mode.current == Mode.raven) && (GameHistory.length == 0) && (newPhase == Phase.playerToMove));
    setVisibility(RavenModeSecondMessage, (Mode.current == Mode.raven) && (GameHistory.length == 0) && (newPhase == Phase.awaitingOpponentMove));
    setVisibility(ExitGameInterface, ((newPhase >= Phase.playerToMove) && (newPhase < Phase.gameOver)) || (newPhase == Phase.exchangeBoards) || (newPhase == Phase.confirmExchange));
    setVisibility(SaveGameInterface, false);
    setVisibility(ResignConfirmation, false);
    setVisibility(DeleteGameConfirmation, false);
    setVisibility(DeleteBoardConfirmation, false);
    setVisibility(SaveBoardMessage, false);
    setVisibility(SaveGameMessage, false);

    // update help text
    if (newPhase in Instructions) {
        HelpText.innerHTML = Instructions[newPhase];
    } else {
        HelpText.innerHTML = "";
    }

    // show terrain info during tile placement
    if (newPhase == Phase.placeTiles) {
        setVisibility(MountainInfo, true);
        setVisibility(WaterInfo, true);
    }

    // keep BottomTileArrangement up to date and offer pieces during board setup
    if (newPhase == Phase.placeKing) {
        if (Phase.current == Phase.placeTiles) {
            BottomTileArrangement = getTileArrangement();
        } else {
            arrangeTiles(BottomTileArrangement);
        }
        offerKing();
    } else if ((newPhase == Phase.placePieces) && (Phase.current == Phase.placeKing)) {
        BottomTileArrangement = getTileArrangement();
        offerPieces();
    }

    // keep BottomPieceArrangement up to date
    if (newPhase == Phase.boardComplete) {
        BottomPieceArrangement = getPieceArrangement();
    }

    // display the appropriate mode description
    if ((newPhase == Phase.localSetup) || (newPhase == Phase.exchangeBoards) || (newPhase == Phase.confirmExchange)) {
        ModeDescriptionText.innerHTML = ModeDescriptions[Mode.current];
    } else {
        ModeDescriptionText.innerHTML = "";
    }

    // output raven mode codes
    if (newPhase == Phase.exchangeBoards) {
        ChallengeCodeInput.value = "";
        ChallengeCodeOutput.value = encodeBoard(BottomTileArrangement, BottomPieceArrangement, PlayerRollCode);
        ChallengeCodeOutput.select();
    } else if (newPhase == Phase.confirmExchange) {
        if (Phase.current == Phase.exchangeBoards) {
            OpponentChallengeCode = ChallengeCodeInput.value;
        }
        ConfirmationCodeInput.value = "";
        ConfirmationCodeOutput.value = PlayerRollCode.toString(16);
        ConfirmationCodeOutput.select();
    } else if (MoveCodeOutputInterface.style.display != "none") {
        MoveCodeOutput.value = encodeLatestMove();
        MoveCodeOutput.select();
    }

    // display game over message
    if (newPhase == Phase.gameOver) {
        var lastMove = GameHistory[GameHistory.length - 1];
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

    Phase.current = newPhase;
    draw();
}


// Tiles

var tiles = [];
var kingsTile;

var kingSlots = new Array(3);
kingSlots[0] = {x: LeftMargin + (2.5 * SquareSize), y: TopMargin + (5 * SquareSize), tile: null};
kingSlots[1] = {x: LeftMargin + (4.5 * SquareSize), y: TopMargin + (5 * SquareSize), tile: null};
kingSlots[2] = {x: LeftMargin + (6.5 * SquareSize), y: TopMargin + (5 * SquareSize), tile: null};

//    left       right
//  0  1  2  |  0  1  2
//   3  4  5 | 3  4  5

var leftSlots = new Array(6);
leftSlots[0] = {x: LeftMargin + (0.5 * SquareSize), y: TopMargin + (5 * SquareSize), tile: null};
leftSlots[1] = {x: LeftMargin + (2.5 * SquareSize), y: TopMargin + (5 * SquareSize), tile: null};
leftSlots[2] = {x: LeftMargin + (4.5 * SquareSize), y: TopMargin + (5 * SquareSize), tile: null};
leftSlots[3] = {x: LeftMargin + (1.5 * SquareSize), y: TopMargin + (7 * SquareSize), tile: null};
leftSlots[4] = {x: LeftMargin + (3.5 * SquareSize), y: TopMargin + (7 * SquareSize), tile: null};
leftSlots[5] = {x: LeftMargin + (5.5 * SquareSize), y: TopMargin + (7 * SquareSize), tile: null};

var rightSlots = new Array(6);
rightSlots[0] = {x: LeftMargin + (5 * SquareSize), y: TopMargin + (5 * SquareSize), tile: null};
rightSlots[1] = {x: LeftMargin + (7 * SquareSize), y: TopMargin + (5 * SquareSize), tile: null};
rightSlots[2] = {x: LeftMargin + (9 * SquareSize), y: TopMargin + (5 * SquareSize), tile: null};
rightSlots[3] = {x: LeftMargin + (4 * SquareSize), y: TopMargin + (7 * SquareSize), tile: null};
rightSlots[4] = {x: LeftMargin + (6 * SquareSize), y: TopMargin + (7 * SquareSize), tile: null};
rightSlots[5] = {x: LeftMargin + (8 * SquareSize), y: TopMargin + (7 * SquareSize), tile: null};

// Initialize the tiles array and place the tiles on the divider screen.
function setUpTiles() {
    tiles = new Array(9);
    kingsTile = {id: 8, squares: null, rotated: false, x: Math.round(LeftMargin + (4.5 * SquareSize)),
                                                    y: Math.round(TopMargin + (0.75 * SquareSize)), slot: null};
    for (var i = 0; i < 8; ++i) {
        tiles[i] = {id: i, squares: new Array(8), rotated: false, x: 0, y: 0, slot: null};
        for (var j = 0; j < 8; ++j) {
            tiles[i].squares[j] = TerType.open;
        }
    }
    tiles[8] = kingsTile;

    // give the tiles their terrain
    tiles[0].squares[0] = TerType.mountain;
    tiles[0].squares[3] = TerType.mountain;
    tiles[0].squares[5] = TerType.mountain;
    tiles[1].squares[0] = TerType.water;
    tiles[1].squares[1] = TerType.water;
    tiles[1].squares[4] = TerType.water;
    tiles[2].squares[0] = TerType.mountain;
    tiles[2].squares[4] = TerType.water;
    tiles[3].squares[1] = TerType.water;
    tiles[3].squares[5] = TerType.mountain;
    tiles[4].squares[0] = TerType.mountain;
    tiles[5].squares[1] = TerType.water;

    // position the tiles
    var y = TopMargin + SquareSize/6;
    var x = LeftMargin + SquareSize/4;
    for (var i = 0; i < 8; ++i) {
        tiles[i].x = Math.round(x);
        tiles[i].y = Math.round(y);
        tiles[i].side = ((x + (1.25 * SquareSize)) < (kingsTile.x + (1.5 * SquareSize)));
        x += 3 * SquareSize;
        if (i == 3) {
            y += (13/6) * SquareSize;
            x = LeftMargin + SquareSize/4;
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
        Board[hexToIndex(hex.x, hex.y)].terrain = slot.tile.squares[0];
        Board[hexToIndex(hex.x + 1, hex.y + 1)].terrain = slot.tile.squares[1];
        Board[hexToIndex(hex.x + 1, hex.y)].terrain = slot.tile.squares[2];
        Board[hexToIndex(hex.x + 2, hex.y + 1)].terrain = slot.tile.squares[3];
    }
}

// Set the board terrain from the tile in the given right slot.
function readTerrainRightSlot(slot) {
    if (slot.tile != null) {
        var hex = hexAtPos(slot.x + SquareSize/2, slot.y);
        Board[hexToIndex(hex.x, hex.y)].terrain = slot.tile.squares[4];
        Board[hexToIndex(hex.x + 1, hex.y + 1)].terrain = slot.tile.squares[5];
        Board[hexToIndex(hex.x, hex.y - 1)].terrain = slot.tile.squares[6];
        Board[hexToIndex(hex.x + 1, hex.y)].terrain = slot.tile.squares[7];
    }
}

// Set the terrain on the bottom half of the board to the terrain on the tiles,
// assuming the tiles are properly arranged.
function readTerrainFromTiles() {
    for (var i = 50; i < 88; ++i) {
        Board[i].terrain = TerType.open;
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
            tiles[i].side = ((tiles[i].x + (1.25 * SquareSize)) < (kingsTile.x + (1.5 * SquareSize)));
        }
    }
    BottomTileArrangement = arrangement;
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
    } else if ((tile.x + (1.25 * SquareSize)) < (kingsTile.x + (1.5 * SquareSize))) {
        slots = leftSlots;
    } else {
        slots = rightSlots;
    }
    for (var i = 0; i < slots.length; ++i) {
        var slot = slots[i];
        if (slot.tile == null) {
            if (posInBounds(tile.x + SquareSize/2, tile.y + SquareSize/2, slot.x, slot.y, SquareSize, SquareSize)) {
                insertTile(tile, slot, true);
                if (kingsTile.slot != null) {
                    if (areTilesArranged()) {
                        setPhase(Phase.placeKing);
                    } else {
                        setPhase(Phase.placeTiles);
                    }
                }
                return true;
            }
        }
    }
    tile.slot == null;
    if (Phase.current == Phase.placeKing) {
        setPhase(Phase.placeTiles);
    }
    return false;
}


// Pieces

function offerKing() {
    PlayerPieces = new Array();
    PlayerPieces.push({type: PieceType.king, x: 4, y: 7, color: true});
    Board[hexToIndex(4, 7)].piece = PlayerPieces[0];
    // kingPiece = PlayerPieces[0];
}

function offerPieces() {
    PlayerPieces.push({type: PieceType.rabble, x:1 , y:4, color: true});
    PlayerPieces.push({type: PieceType.rabble, x:2 , y:5, color: true});
    PlayerPieces.push({type: PieceType.rabble, x:3 , y:6, color: true});
    PlayerPieces.push({type: PieceType.rabble, x:4 , y:7, color: true});
    PlayerPieces.push({type: PieceType.rabble, x:5 , y:8, color: true});
    PlayerPieces.push({type: PieceType.rabble, x:6 , y:9, color: true});
    PlayerPieces.push({type: PieceType.spears, x:1 , y:3, color: true});
    PlayerPieces.push({type: PieceType.spears, x:2 , y:4, color: true});
    PlayerPieces.push({type: PieceType.spears, x:3 , y:5, color: true});
    PlayerPieces.push({type: PieceType.lightHorse, x:4 , y:6, color: true});
    PlayerPieces.push({type: PieceType.lightHorse, x:5 , y:7, color: true});
    PlayerPieces.push({type: PieceType.lightHorse, x:6 , y:8, color: true});
    PlayerPieces.push({type: PieceType.heavyHorse, x:7 , y:9, color: true});
    PlayerPieces.push({type: PieceType.heavyHorse, x:8 , y:10, color: true});
    PlayerPieces.push({type: PieceType.elephant, x:5 , y:6, color: true});
    PlayerPieces.push({type: PieceType.elephant, x:6 , y:7, color: true});
    PlayerPieces.push({type: PieceType.crossbows, x:2 , y:3, color: true});
    PlayerPieces.push({type: PieceType.crossbows, x:3 , y:4, color: true});
    PlayerPieces.push({type: PieceType.trebuchet, x:4 , y:5, color: true});
    PlayerPieces.push({type: PieceType.dragon, x:7 , y:10, color: true});
    PlayerPieces.push({type: PieceType.tower, x:7 , y:8, color: true});
    PlayerPieces.push({type: PieceType.tower, x:8 , y:9, color: true});
    for (var i = 0; i < PlayerPieces.length; ++i){
        var piece = PlayerPieces[i];
        Board[hexToIndex(piece.x, piece.y)].piece = piece;
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
        if (Board[i].piece != null) {
            ++pieceCount[Board[i].piece.type];
        }
    }
    return pieceCount;
}

// Determine whether the pieces on the board are appropriately set up.
function arePiecesArranged() {
    var pieceCount = countPieces();
    for (var i = 0; i < 10; ++i) {
        if (pieceCount[i] != RequiredPieceCount[i]) {
            return false;
        }
    }
    return true;
}

// Return an object representing the arrangement of the player's pieces.
function getPieceArrangement() {
    var arrangement = new Array(TotalPieceCount);
    for (var i = 0; i < TotalPieceCount; ++i) {
        arrangement[i] = {type: PlayerPieces[i].type, x: PlayerPieces[i].x, y: PlayerPieces[i].y};
    }
    return arrangement;
}

// Arrange the player's pieces according to the given piece arrangement object.
function arrangePieces(arrangement) {
    clearBoardOfPieces();
    PlayerPieces = new Array(TotalPieceCount);
    for (var i = 0; i < TotalPieceCount; ++i) {
        var piece = {type: arrangement[i].type, x: arrangement[i].x, y: arrangement[i].y, color: PlayerColor};
        PlayerPieces[i] = piece;
        Board[hexToIndex(piece.x, piece.y)].piece = PlayerPieces[i];
    }
    BottomPieceArrangement = arrangement
}

// Removes the pieces from the board. Doesn't change the location of the
// pieces.
function clearBoardOfPieces() {
    for (var i = 50; i < 88; ++i) {
        Board[i].piece = null;
    }
}

// Handle the player attempting to place a piece on a square during setup.
// Sets the phase when appropriate.
function placePiece(piece, x, y) {

    // handle placement of the king, which can only go on the king's square
    if (piece.type == PieceType.king) {
        var kingSquare = kingSlots.indexOf(kingsTile.slot);
        if ((x == 5 + (2 * kingSquare)) && (y == 2 + (2 * kingSquare))) {
            piece.x = x;
            piece.y = y;
            Board[73 + (2 * kingSquare)].piece = piece;
            if (Phase.current != Phase.boardComplete) {
                setPhase(Phase.placePieces);
            }
            readTerrainFromTiles();
        } else {
            for (var i = 0; i < 88; ++i) {
                Board[i].piece = null;
            }
            setPhase(Phase.placeKing);
        }

    } else if ((hexInBounds(x, y)) && (hexToIndex(x, y) >= 50)) {
        var square = Board[hexToIndex(x, y)];
        if (square.terrain != TerType.mountain) {

            // if there is already a piece here, swap the pieces
            if (square.piece != null) {
                if (square.piece.type == PieceType.king) {
                    return;
                }
                square.piece.x = piece.x;
                square.piece.y = piece.y;
            }

            Board[hexToIndex(piece.x, piece.y)].piece = square.piece;
            piece.x = x;
            piece.y = y;
            square.piece = piece;
            if (arePiecesArranged()) {
                setPhase(Phase.boardComplete);
            }
        }
    }
}

function randomizePieceArrangement() {
    clearBoardOfPieces();
    for (var i = 0; i < PlayerPieces.length; ++i) {
        var piece = PlayerPieces[i];
        if (piece.type == PieceType.king) {
            var kingSquare = kingSlots.indexOf(kingsTile.slot);
            piece.x = 5 + (2 * kingSquare);
            piece.y = 2 + (2 * kingSquare);
            Board[73 + (2 * kingSquare)].piece = piece;
            break;
        }
    }
    for (var i = 0; i < PlayerPieces.length; ++i) {
        var piece = PlayerPieces[i];
        if (piece.type != PieceType.king) {
            var boardIndex;
            do {
                boardIndex = Math.floor(Math.random() * 38) + 50;
            } while ((Board[boardIndex].piece != null) || (Board[boardIndex].terrain == TerType.mountain));
            var hex = indexToHex(boardIndex);
            piece.x = hex.x;
            piece.y = hex.y;
            Board[boardIndex].piece = PlayerPieces[i];
        }
    }
    setPhase(Phase.boardComplete);
    draw();
}


// Turns

// Set PlayerRollCode to a random roll code.
function rollInitiative() {
    PlayerRollCode = Math.floor(Math.random() * Math.pow(2, RollSize)).toString(16);
    while (PlayerRollCode.length < RollSize / 4) {
        PlayerRollCode = "0" + PlayerRollCode;
    }
}

// Determing whether the player has initiative based on his and his oppoent's
// rolls. Every role has an even chance versus a random roll. 
function determineInitiative() {
    var playerInitiativeRoll = parseInt(PlayerRollCode, 16);
    var opponentInitiativeRoll = parseInt(OpponentRollCode, 16);
    var modSum = (playerInitiativeRoll + opponentInitiativeRoll) % Math.pow(2, RollSize);
    return Math.abs(modSum - playerInitiativeRoll) < Math.abs(modSum - opponentInitiativeRoll);
}

// Reverse control of the pieces.
function switchPlayer() {
    var originalPlayerPieces = PlayerPieces;
    PlayerPieces = OpponentPieces;
    OpponentPieces = originalPlayerPieces;
    PlayerColor = !PlayerColor;
}

// Set PlayerColor to the given color, and color all the pieces in PlayerPieces
// and OpponentPieces accordingly.
function setPlayerColor(color) {
    PlayerColor = color;
    for (var i = 0; i < PlayerPieces.length; ++i) {
        PlayerPieces[i].color = color;
    }
    for (var i = 0; i < OpponentPieces.length; ++i) {
        OpponentPieces[i].color = !color;
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
        return {x0: 12, y0: 12, x1: 12, y1: 12, color: !PlayerColor};
    }
    var piece = getItemAtHex(OpponentPieces, move.x0, move.y0);
    if (piece == null) {
        return null;
    }
    move.type = piece.type;
    move.color = !PlayerColor;
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

    // handle resignation
    if (move.x0 == 12) {
        GameHistory.push(move);
        updateLogs();
        setPhase(Phase.gameOver);
        return;
    }

    // modify the board and pieces
    var pieces = (move.color == PlayerColor ? PlayerPieces : OpponentPieces);
    var piece = getItemAtHex(pieces, move.x0, move.y0);
    if (move.capture) {
        var enemyPieces = (move.color == PlayerColor ? OpponentPieces : PlayerPieces);
        var enemyPiece = getItemAtHex(enemyPieces, move.x2, move.y2);
        enemyPieces.splice(enemyPieces.indexOf(enemyPiece), 1);
        Board[hexToIndex(move.x2, move.y2)].piece = null;
    }
    piece.x = move.x1;
    piece.y = move.y1;
    Board[hexToIndex(move.x0, move.y0)].piece = null;
    Board[hexToIndex(move.x1, move.y1)].piece = piece;

    // update history
    GameHistory.push(move);
    if (Mode.current == Mode.sandbox) {
        if ((UndoneHistory.length != 0) && (identicalMoves(UndoneHistory[0], move))) {
            UndoneHistory.splice(0, 1);
        } else {
            UndoneHistory = new Array();
        }
    }
    updateLogs();

    // animate
    if (Mode.current != Mode.setup) {
        animateMove(move);
    }

    updateKingThreats();

    // determine next phase
    if (Mode.current == Mode.sandbox) {
        setPhase(Phase.playerToMove);
    } else if ((Phase.current == Phase.awaitingOpponentMove) && move.capture && (move.capType == PieceType.king)) {
        setPhase(Phase.gameOver);
    } else if ((Mode.current == Mode.raven) && (move.color != PlayerColor)) {
        setPhase(Phase.playerToMove);
    } else if (Mode.current != Mode.setup) {
        if ((Phase.current == Phase.playerToMove) &&
            DoubleMovement[move.type] &&
            !(move.capture) &&
            (hexDistance(move.x0, move.y0, move.x1, move.y1) == 1)) {

            setPhase(Phase.playerSecondMove);
        } else {
            setPhase(Phase.playerMoved);
        }
    }
}

// Reverse the execution of the last move in GameHistory.
function undoLastMove() {
    var move = GameHistory.pop();
    var pieces = (PlayerColor == move.color ? PlayerPieces : OpponentPieces);
    var piece = getItemAtHex(pieces, move.x1, move.y1);

    // revert move
    piece.x = move.x0;
    piece.y = move.y0;
    Board[hexToIndex(move.x0, move.y0)].piece = piece;
    Board[hexToIndex(move.x1, move.y1)].piece = null;
    if (move.capture) {
        var enemyPieces = (PlayerColor == move.color ? OpponentPieces : PlayerPieces);
        var capturedPiece = {type: move.capType, x: move.x2 , y: move.y2, color: !(move.color)};
        enemyPieces.push(capturedPiece);
        Board[hexToIndex(move.x2, move.y2)].piece = capturedPiece;
    }

    updateKingThreats();

    // determine phase and update history
    if (Mode.current == Mode.sandbox) {
        UndoneHistory.splice(0, 0, move);
        setPhase(Phase.playerToMove);
    } else if ((Mode.current == Mode.raven) && (move.color != PlayerColor)) {
        setPhase(Phase.awaitingOpponentMove);
    } else {
        if ((GameHistory.length > 0) && (move.color == GameHistory[GameHistory.length - 1].color)) {
            setPhase(Phase.playerSecondMove);
        } else {
            setPhase(Phase.playerToMove);
        }
    }
    updateLogs();
}

// Reverse the coordinates of every move in GameHistory and UndoneHistory.
function reverseHistory() {
    for (var i = 0; i < GameHistory.length; ++i) {
        var move = GameHistory[i];
        move.x0 = 11 - move.x0;
        move.y0 = 11 - move.y0;
        move.x1 = 11 - move.x1;
        move.y1 = 11 - move.y1;
        if (move.capture) {
            move.x2 = 11 - move.x2;
            move.y2 = 11 - move.y2;
        }
    }
    for (var i = 0; i < UndoneHistory.length; ++i) {
        var move = UndoneHistory[i];
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
        var squareOne = Board[i];
        var squareTwo = Board[87 - i];
        Board[i] = squareTwo;
        Board[87 - i] = squareOne;
    }
    for (var i = 0; i < PlayerPieces.length; ++i) {
        var piece = PlayerPieces[i];
        piece.x = 11 - piece.x;
        piece.y = 11 - piece.y;
    }
    for (var i = 0; i < OpponentPieces.length; ++i) {
        var piece = OpponentPieces[i];
        piece.x = 11 - piece.x;
        piece.y = 11 - piece.y;
    }

    newBottomTileArrangement = TopTileArrangement;
    newBottomPieceArrangement = TopPieceArrangement;

    TopTileArrangement = BottomTileArrangement;
    TopPieceArrangement = BottomPieceArrangement;

    BottomTileArrangement = newBottomTileArrangement;
    BottomPieceArrangement = newBottomPieceArrangement

    switchPlayer();
    TopColor = !TopColor;

    updateKingThreats();
}


// Setup and Game End

// Get everything off the board.
function wipeBoard() {
    for (var i = 0; i < 88; ++i) {
        Board[i] = {piece: null, terrain: TerType.open};
    }
    PlayerPieces = [];
    OpponentPieces = [];
    PlayerColor = true;
    TopColor = false;
    ShowMoves = [];
    ShowCaptures = [];
    GameHistory = [];
    UndoneHistory = [];
    updateLogs();
    TopTileArrangement = null;
    BottomTileArrangement = null;
    TopPieceArrangement = null;
    BottomPieceArrangement = null;
    clearSlots();
}

// Return an object representing the current game state. The current position
// of the pieces is not recorded. Instead, each player's board setup and the
// game history are recorded.
function getGameState() {
    if (Phase.current < Phase.placeKing) {
        return null;
    }
    if (Mode.current == Mode.setup) {
        if (Phase.current >= Phase.placePieces) {
            BottomPieceArrangement = getPieceArrangement();
        } else {
            BottomPieceArrangement = null;
        }
    }
    var gameState = {
        Mode: Mode.current,
        Phase: Phase.current,
        TopColor: TopColor,
        TopTileArrangement: TopTileArrangement,
        BottomTileArrangement: BottomTileArrangement,
        TopPieceArrangement: TopPieceArrangement,
        BottomPieceArrangement: BottomPieceArrangement,
        GameHistory: GameHistory,
        UndoneHistory: UndoneHistory
    };
    if (Mode.current == Mode.raven) {
        gameState.PlayerRollCode = PlayerRollCode;
        gameState.OpponentRollCode = OpponentRollCode;
    }
    return gameState;
}

// Set the current game state according to the given game state object.
function restoreGameState(gameState) {

    if (gameState == null) {
        setPhase(Phase.placeKingsTile);
        return;
    }

    if (gameState.Mode == Mode.raven) {
        PlayerRollCode = gameState.PlayerRollCode;
        OpponentRollCode = gameState.OpponentRollCode;
    }

    if (gameState.Phase < Phase.playerToMove) {

        TopColor = gameState.TopColor;
        PlayerColor = !TopColor;

        if (gameState.BottomTileArrangement != null) {
            arrangeTiles(gameState.BottomTileArrangement);
            if (gameState.BottomPieceArrangement != null) {
                arrangePieces(gameState.BottomPieceArrangement);
            }
        }
        
    } else {

        TopColor = !gameState.TopColor;
        PlayerColor = !TopColor;

        clearSlots();
        clearBoardOfPieces();
        arrangeTiles(gameState.TopTileArrangement);
        readTerrainFromTiles();
        arrangePieces(gameState.TopPieceArrangement);
        reverseBoard();
        arrangeTiles(gameState.BottomTileArrangement);
        readTerrainFromTiles();
        arrangePieces(gameState.BottomPieceArrangement);

        // play out the game according to the history
        for (moveCount = 0; moveCount < gameState.GameHistory.length; ++moveCount) {
            executeMove(gameState.GameHistory[moveCount]);
        }

        UndoneHistory = gameState.UndoneHistory;

    }

    setMode(gameState.Mode);
    setPhase(gameState.Phase);
    
    updateLogs();
}

// Forget the current game and return to the setup phases.
function leaveGame() {
    setMode(Mode.setup);
    wipeBoard();
    setUpTiles();
    setPhase(Phase.placeKingsTile);
}