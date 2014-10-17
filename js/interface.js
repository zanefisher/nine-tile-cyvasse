// Display the info of the given piece in the PieceInfo element.
function showPieceInfo(piece) {
    DisplayedPiece = piece;
    if (piece == null) {
        setVisibility(PieceInfo, false);
    } else {
        PieceInfoImage.src = PieceArt[piece.type + (10 * piece.color)].src;
        PieceInfoText.innerHTML = PieceText[piece.type];
        setVisibility(PieceInfo, true);
    }
}

// Display the info of the given terrain type in the PieceInfo element.
function showTerrainInfo(hex) {
    if (hexInBounds(hex.x, hex.y)) {
        var terrain = Board[hexToIndex(hex.x, hex.y)].terrain;
        if (terrain == TerType.mountain) {
            setVisibility(MountainInfo, true);
            setVisibility(WaterInfo, false);
            return;
        } else if (terrain == TerType.water) {
            setVisibility(MountainInfo, false);
            setVisibility(WaterInfo, true);
            return;
        }
    }
    setVisibility(MountainInfo, false);
    setVisibility(WaterInfo, false);
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
        setVisibility(LoadBoardForm, true);
        setPhase(Phase.current); // to show the forms that require a save to exist
        SaveBoardMessage.innerHTML = name + " saved.";
    } else {
        SaveBoardMessage.innerHTML = "Failed to save board.";
    }
    setVisibility(SaveBoardMessage, true);
};

LoadBoardButton.onclick = function() {
    for (var i = 0; i < 38; ++i) {
        Board[i].piece = null;
    }
    var savedBoard = JSON.parse(localStorage.boards)[LoadBoardSelect.selectedIndex];
    arrangeTiles(savedBoard.tiles);
    readTerrainFromTiles();
    arrangePieces(savedBoard.pieces);
    setPhase(Phase.boardComplete);
    draw();
};

DeleteBoardButton.onclick = function() {
    DeleteBoardText.innerHTML = "Are you sure you want to delete " + LoadBoardSelect.value + "?";
    setVisibility(LoadBoardForm, false);
    setVisibility(DeleteBoardConfirmation, true);
};

ConfirmDeleteBoardButton.onclick = function() {
    var index = LoadBoardSelect.selectedIndex;
    var boards = JSON.parse(localStorage.boards);
    boards.splice(index, 1);
    localStorage.boards = JSON.stringify(boards);
    LoadBoardSelect.remove(index);
    OpponentSelect.remove(index);
    setPhase(Phase.current); // to hide the forms that require a save to exist
};

CancelDeleteBoardButton.onclick = function() {
    setVisibility(DeleteBoardConfirmation, false);
    setVisibility(LoadBoardForm, true);
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
    var opponentBoard = (JSON.parse(localStorage.boards))[index];
    arrangeOpponent(opponentBoard.tiles, opponentBoard.pieces);
    animateScreen();
    setPhase(Phase.playerToMove);
};

ConfirmExchangeDoneButton.onclick = function() {
    OpponentRollCode = ConfirmationCodeInput.value;
    var opponentBoard = decodeBoard(OpponentChallengeCode, OpponentRollCode);
    if (determineInitiative()) {
        setPlayerColor(false);
        TopColor = true;
        setPhase(Phase.playerToMove);
    } else {
        setPlayerColor(true);
        TopColor = false;
        setPhase(Phase.awaitingOpponentMove);
    }
    animateScreen();
    arrangeOpponent(opponentBoard.tileArrangement, opponentBoard.pieceArrangement);
    draw();
};


// Turn Interface

// Convert an integer to a character.
function XToChar(x) {
    return String.fromCharCode(65 + x);
}

// Convert a piece type to a string of its name.
function PieceTypeToString(type) {
    switch(type) {
    case PieceType.rabble:
        return "Rabble";
    case PieceType.spears:
        return "Spears";
    case PieceType.lightHorse:
        return "Light Horse";
    case PieceType.heavyHorse:
        return "Heavy Horse";
    case PieceType.elephant:
        return "Elephant";
    case PieceType.crossbows:
        return "Crossbows";
    case PieceType.trebuchet:
        return "Trebuchet";
    case PieceType.dragon:
        return "Dragon";
    case PieceType.tower:
        return "Tower";
    case PieceType.king:
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
    string += PieceTypeToString(move.type) + " ";
    string += XToChar(move.x0) + (move.y0 + 1) + " to " + XToChar(move.x1) + (move.y1 + 1);
    if (move.capture) {
        string += " (" + PieceTypeToString(move.capType) + " " + XToChar(move.x2) + (move.y2 + 1) + ")";
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


// Update GameLog and UndoneLog to reflect GameHistory and UndoneHistory
// respectively.
function updateLogs() {
    turnCount = 1;
    updateLog(GameLog, GameHistory);
    updateLog(UndoneLog, UndoneHistory);
    TurnInterface.scrollTop = TurnInterface.scrollHeight;
}

EndTurnButton.onclick = function() {
    switch(Mode.current) {
    case Mode.hotseat:
        if ((GameHistory[GameHistory.length - 1].capture) && (GameHistory[GameHistory.length - 1].capType == PieceType.king)) {
            setPhase(Phase.gameOver);
        } else {
            reverseBoard();
            reverseHistory();
            updateLogs();
            setPhase(Phase.playerToMove);
        }
        draw();
        break;
    case Mode.sandbox:
        executeMove(UndoneHistory[0]);
        updateLogs();
        setPhase(Phase.playerToMove);
        break;
    case Mode.raven:
        updateLogs();
        if ((GameHistory[GameHistory.length - 1].capture) && (GameHistory[GameHistory.length - 1].capType == PieceType.king)) {
            setPhase(Phase.gameOver);
        } else {
            setPhase(Phase.awaitingOpponentMove);
        }
        draw();
        break;
    }
};

UndoButton.onclick = function() {
    undoLastMove();
};

MoveCodeDoneButton.onclick = function() {
    var moveCode = MoveCodeInput.value;
    MoveCodeInput.value = "";
    if (moveCode.length == 4) {
        var move = reconstructDecodedMove(decodeMove(moveCode, encodeTurn(GameHistory.length + 1), OpponentRollCode));
        if (move != null) {
            executeMove(move);
        }
    } else if (moveCode.length == 8) {
        var moves = decodeDoubleMove(moveCode, encodeTurn(GameHistory.length + 2), OpponentRollCode);
        var move1 = reconstructDecodedMove(moves.move1);
        if (move1 != null) {
            executeMove(move1);
            var move2 = reconstructDecodedMove(moves.move2);
            if (move2 == null) {
                undoLastMove();
            } else {
                executeMove(move2);
            }
        }
    }
};


// Save, Load, and Resign Games

SaveAndExitGameButton.onclick = function() {
    SaveGameName.value = "";
    setVisibility(ExitGameInterface, false);
    setVisibility(SaveGameInterface, true);
};

SaveGameButton.onclick = function() {
    var name = SaveGameName.value;
    if (name == "") {
        return;
    }
    var savedGames = JSON.parse(localStorage.games);
    if (savedGames[name] != undefined) {
        SaveGameMessage.innerHTML = "That name is already in use.";
        setVisibility(SaveGameMessage, true);
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
    setVisibility(SaveGameInterface, false);
    setVisibility(ExitGameInterface, true);
    SaveGameName.value = "";
};

LoadGameButton.onclick = function() {
    var savedGame = JSON.parse(localStorage.games)[LoadGameSelect.selectedIndex];
    restoreGameState(savedGame);
};

DeleteGameButton.onclick = function() {
    DeleteGameText.innerHTML = "Are you sure you want to delete " + LoadGameSelect.value + "?";
    setVisibility(LoadGameForm, false);
    setVisibility(DeleteGameConfirmation, true);
};

ConfirmDeleteGameButton.onclick = function() {
    var index = LoadGameSelect.selectedIndex;
    var games = JSON.parse(localStorage.games);
    games.splice(index, 1);
    localStorage.games = JSON.stringify(games);
    LoadGameSelect.remove(index);
    setPhase(Phase.current); // to hide the forms that require a save to exist
};

CancelDeleteGameButton.onclick = function() {
    setVisibility(DeleteGameConfirmation, false);
    setVisibility(LoadGameForm, true);
};

ResignButton.onclick = function() {
    if ((Phase.current == Phase.exchangeBoards) || (Phase.current == Phase.confirmExchange)) {
        setMode(Mode.setup);
        setPhase(Phase.boardComplete);
    } else if (Mode.current == Mode.sandbox) {
        leaveGame();
    } else {
        setVisibility(ExitGameInterface, false);
        setVisibility(ResignConfirmation, true);
    }
}

ConfirmResignButton.onclick = function() {
    executeMove({x0: 12, y0: 12, x1: 12, y1: 12, color: PlayerColor});
};

CancelResignButton.onclick = function() {
    setVisibility(ResignConfirmation, false);
    setVisibility(ExitGameInterface, true);
};

GameOverExitButton.onclick = function() {
    leaveGame();
};

GameOverSandboxButton.onclick = function() {
    if (GameHistory[GameHistory.length - 1].x0 == 12) {
        GameHistory.pop();
    }
    setMode(Mode.sandbox);
    setPhase(Phase.playerToMove);
};


// Game Modes

HotseatButton.onclick = function() {
    setMode(Mode.hotseat);
    setPhase(Phase.localSetup);
};

SandboxButton.onclick = function() {
    setMode(Mode.sandbox);
    setPhase(Phase.localSetup);
};

RavenButton.onclick = function() {
    rollInitiative();
    setMode(Mode.raven);
    setPhase(Phase.exchangeBoards);
};

ExchangeBoardsDoneButton.onclick = function() {
    setPhase(Phase.confirmExchange);
};

LoadOpponentBackButton.onclick = function() {
    setMode(Mode.setup);
    setPhase(Phase.boardComplete);
};