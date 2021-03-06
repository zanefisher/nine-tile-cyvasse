// Return an array of all the in-bounds hexes adjacent to the given hex.
function adjacencies(x, y) {
    var adjacencies = new Array();
    if (hexInBounds(x + 1, y)) {
        adjacencies.push({x: x + 1, y: y})
    }
    if (hexInBounds(x + 1, y + 1)) {
        adjacencies.push({x: x + 1, y: y + 1})
    }
    if (hexInBounds(x, y + 1)) {
        adjacencies.push({x: x, y: y + 1})
    }
    if (hexInBounds(x - 1, y)) {
        adjacencies.push({x: x - 1, y: y})
    }
    if (hexInBounds(x - 1, y -1)) {
        adjacencies.push({x: x - 1, y: y - 1})
    }
    if (hexInBounds(x, y - 1)) {
        adjacencies.push({x: x, y: y - 1})
    }
    return adjacencies;
}

// Determine whether there is a straight line of length <= range, that is not
// blocked by a square that satisfies the given function (blocked(square, x, y)).
function straightPathTo(origin, target, range, blocked) {

    // rising diagonal
    if (origin.x == target.x) {
        if (Math.abs(origin.y - target.y) > range) {
            return false;
        }
        var x = origin.x
        for (var y = Math.min(origin.y, target.y) + 1; y <= Math.max(origin.y, target.y); ++y) {
            var square = Board[hexToIndex(x, y)];
            if ((square.piece == target) || (square.piece == origin)) {
                return true;
            } else if (blocked(square, x, y)) {
                return false;
            }
        }

    // falling diagonal
    } else if (origin.y == target.y) {
        if (Math.abs(origin.x - target.x) > range) {
            return false;
        }
        var y = origin.y
        for (var x = Math.min(origin.x, target.x) + 1; x <= Math.max(origin.x, target.x); ++x) {
            var square = Board[hexToIndex(x, y)];
            if ((square.piece == target) || (square.piece == origin)) {
                return true;
            } else if (blocked(square, x, y)) {
                return false;
            }
        }

    // horizontal
    } else if (origin.x - origin.y == target.x - target.y) {
        if (Math.abs(origin.y - target.y) > range) {
            return false;
        }
        var diff = origin.x - origin.y
        for (var y = Math.min(origin.y + 1, target.y + 1); y <= Math.max(origin.y, target.y); ++y) {
            var x = y + diff;
            var square = Board[hexToIndex(x, y)];
            if ((square.piece == target) || (square.piece == origin)) {
                return true;
            } else if (blocked(square, x, y)) {
                return false;
            }
        }
    }
    
    return false;
}

// Determine whether a piece has line of sight to a given square within the
// given range. Line of sight is blocked by mountains and opposing pieces. This
// is primarily to determine whether a piece is engaging another.
function lineOfSight(origin, target, range) {
    function blocked(square, x, y) {
        return ((square.terrain == TerType.mountain) ||
                ((square.piece != null) && (square.piece.color != origin.color)));
    }
    return straightPathTo(origin, target, range, blocked);
}

// Return a list of squares blocked by the given player's opponent's Spears.
function getSpearBlocks(player) {
    var blocks = new Array();
    var pieces = (player ? OpponentPieces : PlayerPieces);
    for (var i = 0; i < pieces.length; ++i) {
        var piece = pieces[i];
        if (piece.type == PieceType.spears) {
            if (piece.color == TopColor) {
                blocks.push({x: piece.x + 1, y: piece.y});
                blocks.push({x: piece.x, y: piece.y - 1});
            } else {
                blocks.push({x: piece.x - 1, y: piece.y});
                blocks.push({x: piece.x, y: piece.y + 1});
            }
        }
    }
    return blocks;
}

// Determine whether a piece can move to capture another piece within a given
// range of movement, without accounting for engagement. Captures are blocked
// by mountains, opposing pieces, and spears.
function lineOfAttack(origin, target, range) {
    var spearBlocks = getSpearBlocks(playerOwns(origin));
    function blocked(square, x, y) {
        return ((square.terrain == TerType.mountain) ||
                ((square.piece != null) && (square.piece.color != origin.color)) ||
                (containsHex(spearBlocks, x, y)));
    }
    return straightPathTo(origin, target, range, blocked);
}

// Determine whether a Dragon can capture a given piece, without accounting for
//  engagement. Dragons' captures are only blocked by Spears.
function lineOfFlight(origin, target, range) {
    var spearBlocks = getSpearBlocks(playerOwns(origin));
    function blocked(square, x, y) {
        return (containsHex(spearBlocks, x, y));
    }
    return straightPathTo(origin, target, range, blocked);
}

// Determine whether an Elephant can capture a given piece, without accounting
// for engagement. Elephants' captures are blocked by mountains, pieces of
// either color, and Spears.
function lineOfCharge(origin, target, range) {
    var spearBlocks = getSpearBlocks(playerOwns(origin));
    function blocked(square, x, y) {
        return ((square.terrain == TerType.mountain) ||
                (square.piece != null) ||
                (containsHex(spearBlocks, x, y)));
    }
    return straightPathTo(origin, target, range, blocked);
}

// Determine whether a Spears can engage or capture on a given location.
function lineOfSpear(origin, target) {
    if (origin.color == TopColor) {
        return (((target.x == origin.x + 1) && (target.y == origin.y)) ||
                ((target.x == origin.x) && (target.y == origin.y - 1)));
    } else {
        return (((target.x == origin.x - 1) && (target.y == origin.y)) ||
                ((target.x == origin.x) && (target.y == origin.y + 1)));
    }
}

// Return a list of opposing Towers adjacent to a given piece.
function getAdjacentEnemyTowers(piece) {
    var towers = [];
    var adj = adjacencies(piece.x, piece.y);
    for (var i = 0; i < adj.length; ++i) {
        var hex = adj[i];
        var square = Board[hexToIndex(hex.x, hex.y)];
        if ((square.piece != null) &&
                (square.piece.type == PieceType.tower) &&
                (square.piece.color != piece.color)) {
            towers.push(square.piece);
        }
    }
    return towers;
}

// Determine whether one piece is engaging another.
function engages(engager, engaged) {

    // pieces of the same color don't engage one another
    if (engager.color == engaged.color) {
        return false;
    }

    // pieces in water can't engage
    if (Board[hexToIndex(engager.x, engager.y)].terrain == TerType.water) {
        return false;
    }

    var range = PieceRange[engager.type];

    // pieces adjacent to opposing Towers can only engage adjacent towers
    var adjTowers = getAdjacentEnemyTowers(engager);
    if (adjTowers.length > 0) {
        if (engager.type == PieceType.spears) {
            return ((engaged.type == PieceType.tower) && lineOfSpear(engager, engaged));
        }
        return containsHex(adjTowers, engaged.x, engaged.y);
    }

    // Spears can only engage in front of them
    if (engager.type == PieceType.spears) {
        return lineOfSpear(engager, engaged, range);

    // Trebuchets can't engage adjacent pieces
    } else if ((engager.type == PieceType.trebuchet) && (distance(engager.x, engager.y, engaged.x, engaged.y) == 1)) {
        return false;

    // all other types of pieces follow the normal rules
    } else {
        return lineOfSight(engager, engaged, range);
    }
}

// Return a list of all the spaces where the given piece could engage an
// opposing piece, if one were there.
function getRangeMarkers(piece) {
    var markers = [];
    var range = PieceRange[piece.type];
    if (Board[hexToIndex(piece.x, piece.y)].terrain != TerType.water) {

        // check for adjacent Towers
        var adjTowers = getAdjacentEnemyTowers(piece);
        if (adjTowers.length > 0) {

            // ugly special case for Spears next to Towers
            if (piece.type == PieceType.spears) {
                var spearableTowers = [];
                for (var i = 0; i < adjTowers.length; ++i) {
                    if (lineOfSpear(piece, adjTowers[i])) {
                        spearableTowers.push(adjTowers[i]);
                    }
                }
                return spearableTowers;
            }

            return adjTowers;
        }

        // special case for spears
        if (piece.type == PieceType.spears) {
            if (piece.color == TopColor) {
                markers.push({x: piece.x + 1, y: piece.y});
                markers.push({x: piece.x, y: piece.y - 1});
            } else {
                markers.push({x: piece.x - 1, y: piece.y});
                markers.push({x: piece.x, y: piece.y + 1});
            }
            return markers;
        }

        for (var direction = 0; direction < 6; ++direction) {
            var pos = {x: piece.x, y: piece.y};
            for (var distance = 0; distance < range; ++distance) {
                var otherPiece = Board[hexToIndex(pos.x, pos.y)].piece;
                if ((otherPiece != null) && (otherPiece.color != piece.color)) {
                    break;
                }
                var nextPos = sumPos(pos, unitMoves[direction]);
                if ((!hexInBounds(nextPos.x, nextPos.y)) || (Board[hexToIndex(nextPos.x, nextPos.y)].terrain == TerType.mountain)) {
                    break;
                }
                pos = nextPos;
                if ((piece.type != PieceType.trebuchet) || (distance > 0)) {
                    markers.push(pos);
                }
            }
        }
    }
    return markers;
}

var engagers = new Array();

// Count how many pieces are engaging the given piece.
function getEngagement(piece) {
    var engagement = 0;
    engagers = new Array();
    if (playerOwns(piece)) {
        for (var i = 0; i < OpponentPieces.length; ++i) {
            var enemyPiece = OpponentPieces[i];
            if (engages(enemyPiece, piece)) {
                ++engagement;
                engagers.push(enemyPiece);
            }
        }
    } else {
        for (var i = 0; i < PlayerPieces.length; ++i) {
            var enemyPiece = PlayerPieces[i];
            if (engages(enemyPiece, piece)) {
                ++engagement;
                engagers.push(enemyPiece);
            }
        }
    }
    return engagement;
}

// Determine whether a piece is engaged enough to be captured.
function fullyEngaged(piece) {
    return getEngagement(piece) >= PieceArmor[piece.type];
}

// Return an array of possible captures for a piece that can move past pieces
// it captures.
function breachCaptures(piece, captures) {
    var range = PieceMovement[piece.type];
    var spearBlocks = getSpearBlocks(playerOwns(piece));
    for (var i = 0; i < captures.length; ++i) {
        var x = captures[i].x;
        var y = captures[i].y;
        if (containsHex(spearBlocks, x, y)) { continue; }
        var distance = hexDistance(piece.x, piece.y, x, y);
        var dx = (x - piece.x) / distance;
        var dy = (y - piece.y) / distance;
        for (var d = distance; d < range; ++d) {
            x += dx;
            y += dy;
            var square = Board[hexToIndex(x, y)];
            if (!hexInBounds(x, y) ||
                    (square.piece != null) ||
                    (square.terrain == TerType.mountain)) {
                break;
            }
            captures.push({x: x, y: y, captured: captures[i].captured});
            if (containsHex(spearBlocks, x, y)) { break; }
        }
    }
    return captures;
}

// Return an array of possible captures for a Trebuchet.
function rangedCaptures(piece, captures) {
    var rangedCaptures = new Array();
    if (Board[hexToIndex(piece.x, piece.y)].terrain == TerType.water) { return rangedCaptures; }
    for (var i = 0; i < captures.length; ++i) {
        var distance = hexDistance(piece.x, piece.y, captures[i].x, captures[i].y);
        if (distance > 1) {
            var x = piece.x - ((captures[i].x - piece.x) / distance);
            var y = piece.y - ((captures[i].y - piece.y) / distance);
            var square = Board[hexToIndex(x, y)];
            if ((hexInBounds(x, y)) && (square.piece == null) && (square.terrain != TerType.mountain)) {
                rangedCaptures.push({x: x, y: y, captured: captures[i].captured});
            }
        }
    }
    return rangedCaptures;
}

// Return an array of all the captures that can be made by a given piece. Each
// Capture is an object with three attributes: x, y, and captured. x and y
// indicate where the piece moves to, and captured refers to the piece being
// captured.
function getCaptures(piece) {

    if (Phase.current == Phase.playerSecondMove) {
        return new Array();
    }

    var captures = new Array();
    var range = PieceMovement[piece.type];
    var checkPath = lineOfAttack;
    var enemyPieces = (playerOwns(piece) ? OpponentPieces : PlayerPieces);

    if (piece.type == PieceType.crossbows) {
        return captures;
    } else if (piece.type == PieceType.spears) {
        checkPath = lineOfSpear;
    } else if (piece.type == PieceType.dragon) {
        checkPath = lineOfFlight;
    } else if (piece.type == PieceType.elephant) {
        checkPath = lineOfCharge;
        range = 2;
    } else if (piece.type == PieceType.trebuchet) {
        checkPath = lineOfSight;
        range = 4;
    }

    for (var i = 0; i < enemyPieces.length; ++i) {
        var enemyPiece = enemyPieces[i];
        if (fullyEngaged(enemyPiece) && checkPath(piece, enemyPiece, range)) {
            captures.push({x: enemyPiece.x, y: enemyPiece.y, captured: enemyPiece});
        }
    }

    if ((piece.type == PieceType.lightHorse) || (piece.type == PieceType.heavyHorse)) {
        captures = breachCaptures(piece, captures);
    } else if (piece.type == PieceType.trebuchet) {
        captures = rangedCaptures(piece, captures);
    } else if (piece.type == PieceType.king) {
        var adj = adjacencies(piece.x, piece.y);
        for (var i = 0; i < adj.length; ++i) {
            var square = Board[hexToIndex(adj[i].x, adj[i].y)];
            if ((square.piece != null) && (square.piece.type == PieceType.tower) && (square.piece.color == piece.color)) {
                var x = (2 * adj[i].x) - piece.x;
                var y = (2 * adj[i].y) - piece.y;
                var squareBeyond = Board[hexToIndex(x, y)];
                if ((hexInBounds(x, y)) && (squareBeyond.piece != null) &&
                    (squareBeyond.piece.color != piece.color) && (fullyEngaged(squareBeyond.piece))) {

                    captures.push({x: x, y: y, captured: squareBeyond.piece});
                }
            }
        }
    }
    return captures;
}

// Return an array of all possible non-capture moves by a hypothetical piece of
// the given location, color, and type, within the given distance.
function getMovesFrom(x, y, distance, type, color, moves) {
    var square = Board[hexToIndex(x, y)];
    var squareIsOpen = (square.piece == null) && (square.terrain != TerType.mountain);
    if ((squareIsOpen) && !(containsHex(moves, x, y))) {
        moves.push({x: x, y: y});
    }
    if (distance < PieceMovement[type]) {
        var spearBlocks = getSpearBlocks(color == PlayerColor);
        if (containsHex(spearBlocks, x, y)) {
            return moves;
        }
    }
    if ((distance != 0) && (squareIsOpen || ((square.piece != null) && (square.piece.color == color)) || (type == PieceType.dragon))) {
        var adj = adjacencies(x, y);
        for (var i = 0; i < adj.length; ++i) {
            moves = getMovesFrom(adj[i].x, adj[i].y, distance - 1, type, color, moves);
        }
    }
    return moves;
}

// Return an array of all possible non-capture moves by the given piece.
function getMoves(piece) {
    if ((Phase.current == Phase.playerSecondMove) && (playerOwns(piece))) {
        var firstMove = GameHistory[GameHistory.length - 1];
        if ((piece.type == firstMove.type) && ((piece.x != firstMove.x1) || (piece.y != firstMove.y1))) {
            return getMovesFrom(piece.x, piece.y, 1, piece.type, piece.color, new Array());
        } else {
            return new Array();
        }
    }

    var moves = getMovesFrom(piece.x, piece.y, PieceMovement[piece.type], piece.type, piece.color, new Array());

    // special case for Kings jumping Towers
    if (piece.type == PieceType.king) {
        var adj = adjacencies(piece.x, piece.y);
        for (var i = 0; i < adj.length; ++i) {
            var square = Board[hexToIndex(adj[i].x, adj[i].y)];
            if ((square.piece != null) && (square.piece.type == PieceType.tower) && (square.piece.color == piece.color)) {
                var x = (2 * adj[i].x) - piece.x;
                var y = (2 * adj[i].y) - piece.y;
                var squareBeyond = Board[hexToIndex(x, y)];
                if ((hexInBounds(x, y)) && (squareBeyond.piece == null) && (squareBeyond.terrain != TerType.mountain)) {
                    moves.push({x: x, y: y});
                }
            }
        }
    }

    return moves;
}

// Update KingThreats, which lists all pieces which can currently capture the
// player's king.
function updateKingThreats() {
    KingThreats = [];
    for (var i = 0; i < OpponentPieces.length; ++i) {
        var captures = getCaptures(OpponentPieces[i]);
        for (var j = 0; j < captures.length; ++j) {
            if (captures[j].captured.type == PieceType.king) {
                KingThreats.push({x: OpponentPieces[i].x, y: OpponentPieces[i].y});
            }
        }
    }
}