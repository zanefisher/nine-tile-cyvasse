// Display the info of the given piece in the PieceInfo element.
function showPieceInfo(piece) {
    displayedPiece = piece;
    if (piece == null) {
        PieceInfo.hidden = true;
    } else {
        PieceInfoImage.src = pieceArt[piece.type + (10 * piece.color)].src;
        PieceInfoText.innerHTML = pieceText[piece.type];
        PieceInfo.hidden = false;
    }
}

// Display the info of the given terrain type in the PieceInfo element.
function showTerrainInfo(hex) {
    if (hexInBounds(hex.x, hex.y)) {
        var terrain = board[hexToIndex(hex.x, hex.y)].terrain;
        if (terrain == terType.mountain) {
            MountainInfo.hidden = false;
            WaterInfo.hidden = true;
            return;
        } else if (terrain == terType.water) {
            MountainInfo.hidden = true;
            WaterInfo.hidden = false;
            return;
        }
    }
    MountainInfo.hidden = true;
    WaterInfo.hidden = true;
}


// Save and Load Boards

SaveBoardButton.onclick = function() {
    var name = SaveBoardName.value;
    if (areTilesArranged() && arePiecesArranged() && (name != "")) {
        var boards = JSON.parse(localStorage.boards);
        boards.push({name: name, tiles: getTileArrangement(), pieces: getPieceArrangement()});
        localStorage.boards = JSON.stringify(boards);
        LoadBoardSelect.innerHTML += "<option>" + name + "</option>";
        OpponentSelect.innerHTML += "<option>" + name + "</option>";
        SaveBoardName.value = "";
        LoadBoardForm.hidden = false;
        setPhase(phase.current); // to show the forms that require a save to exist
        SaveBoardMessage.innerHTML = name + " saved.";
    } else {
        SaveBoardMessage.innerHTML = "Failed to save board.";
    }
    SaveBoardMessage.hidden = false;
};

LoadBoardButton.onclick = function() {
    for (var i = 0; i < 38; ++i) {
        board[i].piece = null;
    }
    var savedBoard = JSON.parse(localStorage.boards)[LoadBoardSelect.selectedIndex];
    arrangeTiles(savedBoard.tiles);
    readTerrainFromTiles();
    arrangePieces(savedBoard.pieces);
    setPhase(phase.boardComplete);
    draw();
};

DeleteBoardButton.onclick = function() {
    DeleteBoardText.innerHTML = "Are you sure you want to delete " + LoadBoardSelect.value + "?";
    LoadBoardForm.hidden = true;
    DeleteBoardConfirmation.hidden = false;
};

ConfirmDeleteBoardButton.onclick = function() {
    var index = LoadBoardSelect.selectedIndex;
    var boards = JSON.parse(localStorage.boards);
    boards.splice(index, 1);
    localStorage.boards = JSON.stringify(boards);
    LoadBoardSelect.remove(index);
    OpponentSelect.remove(index);
    setPhase(phase.current); // to hide the forms that require a save to exist
};

CancelDeleteBoardButton.onclick = function() {
    DeleteBoardConfirmation.hidden = true;
    LoadBoardForm.hidden = false;
}

// Set up the opponent's side of the board.
function arrangeOpponent(tileArrangement, pieceArrangement) {
    reverseBoard();
    arrangeTiles(tileArrangement);
    arrangePieces(pieceArrangement);
    readTerrainFromTiles();
    reverseBoard();
    draw();
}

LoadOpponentButton.onclick = function() {
    var index = OpponentSelect.selectedIndex;
    var board = (JSON.parse(localStorage.boards))[index];
    arrangeOpponent(board.tiles, board.pieces);
    setPhase(phase.playerToMove);
    draw();
};

ConfirmExchangeDoneButton.onclick = function() {
    opponentRollCode = ConfirmationCodeInput.value;
    var opponentBoard = decodeBoard(opponentChallengeCode, opponentRollCode);
    if (determineInitiative()) {
        setPlayerColor(false);
        topColor = true;
        setPhase(phase.playerToMove);
    } else {
        setPlayerColor(true);
        topColor = false;
        arrangeOpponent(opponentBoard.tileArrangement, opponentBoard.pieceArrangement);
        setPhase(phase.awaitingOpponentMove);
    }
    arrangeOpponent(opponentBoard.tileArrangement, opponentBoard.pieceArrangement);
    draw();
};


// Turn Interface

// Convert an integer to a character.
function XToChar(x) {
    return String.fromCharCode(65 + x);
}

// Convert a piece type to a string of its name.
function pieceTypeToString(type) {
    switch(type) {
    case pieceType.rabble:
        return "Rabble";
    case pieceType.spears:
        return "Spears";
    case pieceType.lightHorse:
        return "Light Horse";
    case pieceType.heavyHorse:
        return "Heavy Horse";
    case pieceType.elephant:
        return "Elephant";
    case pieceType.crossbows:
        return "Crossbows";
    case pieceType.trebuchet:
        return "Trebuchet";
    case pieceType.dragon:
        return "Dragon";
    case pieceType.tower:
        return "Tower";
    case pieceType.king:
        return "King";
    }
    return "????";
}

// Generate a string representing the given move.
function moveToString(move) {
    if (move.x0 == 12) {
        if (move.color) {
            return "Black resigns.";
        } else {
            return "White resigns.";
        }
    }
    var string = "";
    string += pieceTypeToString(move.type) + " ";
    string += XToChar(move.x0) + (move.y0 + 1) + " to " + XToChar(move.x1) + (move.y1 + 1);
    if (move.capture) {
        string += " (" + pieceTypeToString(move.capType) + " " + XToChar(move.x2) + (move.y2 + 1) + ")";
    }
    return string;
}

var turnCount;

// Update the given html element (log) to list an array of moves (history).
function updateLog(log, history) {
    log.start = turnCount;
    var newLogText = "";
    for (var i = 0; i < history.length; ++i) {
        if (i != 0) {
            if (history[i].color == history[i - 1].color) {
                newLogText += "<br>" + moveToString(history[i]);
                continue;
            } else {
                newLogText += "</span></li>";
            }
        }
        if (history[i].color) {
            newLogText += "<li style=\"padding:1px; margin-left:2em\"><span style=\"color:white; background-color:black\">";
        } else {
            newLogText += "<li style=\"padding:1px; margin-left:2em\"><span>";
        }
        newLogText += moveToString(history[i]);
        ++turnCount;
    }
    newLogText += "</span></li>";
    log.innerHTML = newLogText;
    ScrollDiv.scrollTop = ScrollDiv.scrollHeight;
}


// Update GameLog and UndoneLog to reflect gameHistory and undoneHistory
// respectively.
function updateLogs() {
    turnCount = 1;
    updateLog(GameLog, gameHistory);
    updateLog(UndoneLog, undoneHistory);
    TurnInterface.scrollTop = TurnInterface.scrollHeight;
}

EndTurnButton.onclick = function() {
    switch(mode.current) {
    case mode.hotseat:
        if ((gameHistory[gameHistory.length - 1].capture) && (gameHistory[gameHistory.length - 1].capType == pieceType.king)) {
            updateLogs();
            setPhase(phase.gameOver);
        } else {
            reverseBoard();
            reverseHistory();
            updateLogs();
            setPhase(phase.playerToMove);
        }
        draw();
        break;
    case mode.sandbox:
        executeMove(undoneHistory[0]);
        updateLogs();
        if ((gameHistory[gameHistory.length - 1].capture) && (gameHistory[gameHistory.length - 1].capType == pieceType.king)) {
            setPhase(phase.gameOver);
        } else {
            setPhase(phase.playerToMove);
        }
        draw();
        break;
    case mode.raven:
        updateLogs();
        setPhase(phase.awaitingOpponentMove);
        draw();
        break;
    }
};

UndoButton.onclick = function() {
    var move = gameHistory.pop();
    //if (gameHistory.length == 0) { UndoButton.disabled = true; }
    var pieces = (playerColor == move.color ? playerPieces : opponentPieces);
    var piece = getItemAtHex(pieces, move.x1, move.y1);
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
    if (mode.current == mode.sandbox) {
        undoneHistory.splice(0, 0, move);
        //EndTurnButton.disabled = false;
        setPhase(phase.playerToMove);
    } else {
        if ((gameHistory.length > 0) && (move.color == gameHistory[gameHistory.length - 1].color)) {
            setPhase(phase.playerSecondMove);
        } else {
            setPhase(phase.playerToMove);
        }
    }
    updateLogs();
    updateKingThreats();
    draw();
};

MoveCodeDoneButton.onclick = function() {
    var moveCode = MoveCodeInput.value;
    MoveCodeInput.value = "";
    if (moveCode.length == 4) {
        var move = reconstructDecodedMove(decodeMove(moveCode, encodeTurn(gameHistory.length + 1), opponentRollCode));
        if (move != null) {
            executeMove(move);
        }
    } else if (moveCode.length == 8) {
        var moves = decodeDoubleMove(moveCode, encodeTurn(gameHistory.length + 2), opponentRollCode);
        var move1 = reconstructDecodedMove(moves.move1);
        var move2 = reconstructDecodedMove(moves.move2);
        if ((move1 != null) && (move2 != null)) {
            executeMove(move1);
            executeMove(move2);
        }
    }
    updateLogs();
    draw();
};


// Save, Load, and Resign Games

SaveAndExitGameButton.onclick = function() {
    SaveGameName.value = "";
    ExitGameInterface.hidden = true;
    SaveGameInterface.hidden = false;
};

SaveGameButton.onclick = function() {
    var name = SaveGameName.value;
    if (name == "") {
        return;
    }
    var savedGames = JSON.parse(localStorage.games);
    if (savedGames[name] != undefined) {
        SaveGameMessage.innerHTML = "That name is already in use.";
        SaveGameMessage.hidden = false;
    } else {
        var gameState = getGameState();
        gameState.name = name;
        savedGames.push(gameState);
        localStorage.games = JSON.stringify(savedGames);
        LoadGameSelect.innerHTML += "<option>" + name + "</option>";
        leaveGame();
    }
};

CancelSaveGameButton.onclick = function() {
    SaveGameInterface.hidden = true;
    ExitGameInterface.hidden = false;
    SaveGameName.value = "";
};

LoadGameButton.onclick = function() {
    var savedGame = JSON.parse(localStorage.games)[LoadGameSelect.selectedIndex];
    restoreGameState(savedGame);
    draw();
};

DeleteGameButton.onclick = function() {
    DeleteGameText.innerHTML = "Are you sure you want to delete " + LoadGameSelect.value + "?";
    LoadGameForm.hidden = true;
    DeleteGameConfirmation.hidden = false;
};

ConfirmDeleteGameButton.onclick = function() {
    var index = LoadGameSelect.selectedIndex;
    var games = JSON.parse(localStorage.games);
    games.splice(index, 1);
    localStorage.games = JSON.stringify(games);
    LoadGameSelect.remove(index);
    setPhase(phase.current); // to hide the forms that require a save to exist
};

CancelDeleteGameButton.onclick = function() {
    DeleteGameConfirmation.hidden = true;
    LoadGameForm.hidden = false;
};

ResignButton.onclick = function() {
    if (mode.current == mode.sandbox) {
        leaveGame();
    } else {
        ExitGameInterface.hidden = true;
        ResignConfirmation.hidden = false;
    }
}

ConfirmResignButton.onclick = function() {
    executeMove({x0: 12, y0: 12, x1: 12, y1: 12, color: playerColor});
};

CancelResignButton.onclick = function() {
    ResignConfirmation.hidden = true;
    ExitGameInterface.hidden = false;
};

GameOverExitButton.onclick = function() {
    leaveGame();
};

GameOverSandboxButton.onclick = function() {
    if (gameHistory[gameHistory.length - 1].x0 == 12) {
        gameHistory.pop();
    }
    setMode(mode.sandbox);
    setPhase(phase.playerToMove);
};


// Game Modes

HotseatButton.onclick = function() {
    setMode(mode.hotseat);
    setPhase(phase.localSetup);
};

SandboxButton.onclick = function() {
    setMode(mode.sandbox);
    setPhase(phase.localSetup);
};

RavenButton.onclick = function() {
    setMode(mode.raven);
    setPhase(phase.exchangeBoards);
};

ExchangeBoardsDoneButton.onclick = function() {
    setPhase(phase.confirmExchange);
};

LoadOpponentBackButton.onclick = function() {
    setPhase(phase.boardComplete);
};

ExchangeBoardsBackButton.onclick = function() {
    setPhase(phase.boardComplete);
};

ConfirmExchangeBackButton.onclick = function() {
    setPhase(phase.boardComplete);
};