// Boards

function base4to16(base4string) {
    var base16string = "";
    var chunklength = 26;
    for (i = base4string.length; i > 0; i -= chunklength) {
        var start = Math.max(i - chunklength, 0);
        var end = Math.min(start + chunklength, i);
        var chunk = (parseInt(base4string.slice(start, end), 4)).toString(16);
        while (chunk.length < Math.ceil((end - start) / 2)) {
            chunk = "0" + chunk;
        }
        base16string = chunk + base16string;
    }
    return base16string;
}

function base16to4(base16string) {
    var base4string = "";
    var chunklength = 13;
    for (i = base16string.length; i > 0; i -= chunklength) {
        var start = Math.max(i - chunklength, 0);
        var end = Math.min(start + chunklength, i);
        var chunk = (parseInt(base16string.slice(start, end), 16)).toString(4);
        while (chunk.length < (end - start) * 2) {
            chunk = "0" + chunk;
        }
        base4string = chunk + base4string;   
    }
    return base4string;
}

function encodeTile(tile) {
    return (tile.tileId + (tile.rotated * 8)).toString(16);
}

function encodeTiles(tileArrangement) {
    var string = "";
    if (tileArrangement[1] == null) { //left
        string += encodeTile(tileArrangement[0])
                + encodeTile(tileArrangement[3])
                + encodeTile(tileArrangement[6])
                + encodeTile(tileArrangement[7])
                + encodeTile(tileArrangement[8])
                + encodeTile(tileArrangement[9])
                + encodeTile(tileArrangement[10])
                + encodeTile(tileArrangement[11]);
    } else if (tileArrangement[2] == null) { //middle
        string += encodeTile(tileArrangement[0])
                + encodeTile(tileArrangement[1])
                + encodeTile(tileArrangement[3])
                + encodeTile(tileArrangement[4])
                + encodeTile(tileArrangement[7])
                + encodeTile(tileArrangement[8])
                + encodeTile(tileArrangement[10])
                + encodeTile(tileArrangement[11]);
    } else { //right
        string += encodeTile(tileArrangement[0])
                + encodeTile(tileArrangement[1])
                + encodeTile(tileArrangement[2])
                + encodeTile(tileArrangement[3])
                + encodeTile(tileArrangement[4])
                + encodeTile(tileArrangement[5])
                + encodeTile(tileArrangement[8])
                + encodeTile(tileArrangement[11]);
    }
    return string;
}

function comparePieces(a, b) {
    return ((144 * a.type) + (12 * a.x) + a.y) - ((144 * b.type) + (12 * b.x) + b.y);
}

function encodePieces(pieceArrangement) {
    pieceArrangement = pieceArrangement.sort(comparePieces);
    var string = "";
    for (var i = 0; i < pieceArrangement.length; ++i) {
        string += pieceArrangement[i].x - pieceArrangement[i].y - 1;
        if (pieceArrangement[i].y < 4) {
            string += "0";
        }
        string += (pieceArrangement[i].y).toString(4);
    }
    return base4to16(string);
}

function vigenere(text, key, encrypt) {
    var string = "";
    var keyIndex = 0;
    for (var i = 0; i < text.length; ++i) {
        if (encrypt) {
            string += ((parseInt(text.charAt(i), 16) + parseInt(key.charAt(keyIndex), 16)) % 16).toString(16);
        } else {
            string += ((16 + parseInt(text.charAt(i), 16) - parseInt(key.charAt(keyIndex), 16)) % 16).toString(16);
        }
        keyIndex = (keyIndex + 1) % key.length;
    }
    return string;
}

function encodeBoard(tileArrangement, pieceArrangement, rollCode) {
    return vigenere(encodeTiles(tileArrangement) + encodePieces(pieceArrangement), rollCode, true);
}

function decodeTile(char) {
    var digit = parseInt(char, 16);
    return {rotated: digit >= 8, tileId: digit % 8};
}

function decodeTiles(text) {
    var tileArrangement = [null, null, null, null, null, null, null, null, null, null, null, null];
    switch (text.charAt(text.length - 1)) {
    case "2":
        tileArrangement[0] = decodeTile(text.charAt(0));
        tileArrangement[3] = decodeTile(text.charAt(1));
        tileArrangement[6] = decodeTile(text.charAt(2));
        tileArrangement[7] = decodeTile(text.charAt(3));
        tileArrangement[8] = decodeTile(text.charAt(4));
        tileArrangement[9] = decodeTile(text.charAt(5));
        tileArrangement[10] = decodeTile(text.charAt(6));
        tileArrangement[11] = decodeTile(text.charAt(7));
        break;
    case "4":
        tileArrangement[0] = decodeTile(text.charAt(0));
        tileArrangement[1] = decodeTile(text.charAt(1));
        tileArrangement[3] = decodeTile(text.charAt(2));
        tileArrangement[4] = decodeTile(text.charAt(3));
        tileArrangement[7] = decodeTile(text.charAt(4));
        tileArrangement[8] = decodeTile(text.charAt(5));
        tileArrangement[10] = decodeTile(text.charAt(6));
        tileArrangement[11] = decodeTile(text.charAt(7));
        break;
    case "6":
        tileArrangement[0] = decodeTile(text.charAt(0));
        tileArrangement[1] = decodeTile(text.charAt(1));
        tileArrangement[2] = decodeTile(text.charAt(2));
        tileArrangement[3] = decodeTile(text.charAt(3));
        tileArrangement[4] = decodeTile(text.charAt(4));
        tileArrangement[5] = decodeTile(text.charAt(5));
        tileArrangement[8] = decodeTile(text.charAt(6));
        tileArrangement[11] = decodeTile(text.charAt(7));
    }
    return tileArrangement;
}

function decodePieces(text) {
    text = base16to4(text.substr(8));
    text = text.substr(text.length - (3 * TotalPieceCount));
    var type = 0;
    var typeCount = 0;
    var pieces = [];
    while (type < RequiredPieceCount.length) {
        var posCode = text.substr(3 * pieces.length, 3);
        var y = parseInt(posCode.substr(1), 4);
        pieces[pieces.length] = {type: type, x: parseInt(posCode.charAt(0)) + y + 1, y: y};
        if (++typeCount == RequiredPieceCount[type]) {
            ++type;
            typeCount = 0;
        }
    }
    return pieces;
}

function decodeBoard(text, rollCode) {
    text = vigenere(text, rollCode, false);
    return {tileArrangement: decodeTiles(text), pieceArrangement: decodePieces(text)}
}


// Moves

function encodeTurn(turnCount) {
    return (turnCount < 16 ? "0" : "") + (turnCount % 256).toString(16);
}

function encodeMove(move, turnCode, rollCode) {
    var moveCode = vigenere(move.x0.toString(16) + move.y0.toString(16) + move.x1.toString(16) + move.y1.toString(16), rollCode, true);
    return vigenere(moveCode, turnCode, true);
}

function encodeDoubleMove(move1, move2, turnCode, rollCode) {
    var moveCode =  vigenere(move1.x0.toString(16) + move1.y0.toString(16) + move1.x1.toString(16) + move1.y1.toString(16) +
                    move2.x0.toString(16) + move2.y0.toString(16) + move2.x1.toString(16) + move2.y1.toString(16), rollCode, true);
    return vigenere(moveCode, turnCode, true);
}

function encodeLatestMove() {
    if ((GameHistory.length >= 2) && (GameHistory[GameHistory.length - 2].color == PlayerColor)) {
        return encodeDoubleMove(GameHistory[GameHistory.length - 2],
                                GameHistory[GameHistory.length - 1],
                                encodeTurn(GameHistory.length), PlayerRollCode);
    } else {
        return encodeMove(GameHistory[GameHistory.length - 1], encodeTurn(GameHistory.length), PlayerRollCode);
    }
}

function decodeMove(moveCode, turnCode, rollCode) {
    moveCode = vigenere(moveCode, rollCode, false);
    moveCode = vigenere(moveCode, turnCode, false);
    return {x0: 11 - parseInt(moveCode.charAt(0), 16), y0: 11 - parseInt(moveCode.charAt(1), 16),
            x1: 11 - parseInt(moveCode.charAt(2), 16), y1: 11 - parseInt(moveCode.charAt(3), 16)}
}

function decodeDoubleMove(moveCode, turnCode, rollCode) {
    moveCode = vigenere(moveCode, rollCode, false);
    moveCode = vigenere(moveCode, turnCode, false);
    return {move1: {x0: 11 - parseInt(moveCode.charAt(0), 16), y0: 11 - parseInt(moveCode.charAt(1), 16),
                    x1: 11 - parseInt(moveCode.charAt(2), 16), y1: 11 - parseInt(moveCode.charAt(3), 16)},
            move2: {x0: 11 - parseInt(moveCode.charAt(4), 16), y0: 11 - parseInt(moveCode.charAt(5), 16),
                    x1: 11 - parseInt(moveCode.charAt(6), 16), y1: 11 - parseInt(moveCode.charAt(7), 16)}}
}