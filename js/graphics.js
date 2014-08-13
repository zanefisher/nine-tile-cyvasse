// Draw the terrain squares for the terrain info fields.
function drawTerrainThumbails() {

    var left = 2;
    var right = MountainInfoCanvas.width - left;
    var top = 2;
    var bottom = MountainInfoCanvas.height - top;
    var width = right - left;
    var height = bottom - top;

    var mctx = MountainInfoCanvas.getContext("2d");
    mctx.clearRect(0, 0, MountainInfoCanvas.width, MountainInfoCanvas.height);
    mctx.beginPath();
    mctx.lineWidth = 2;
    mctx.strokeStyle = "#000000";
    mctx.fillStyle = "#FFFFFF";
    mctx.fillRect(left, top, width, height);
    mctx.rect(left, top, width, height);
    mctx.moveTo(left, top);
    mctx.lineTo(right, bottom);
    mctx.moveTo(right, top);
    mctx.lineTo(left, bottom);
    mctx.stroke();

    var wctx = WaterInfoCanvas.getContext("2d");
    wctx.clearRect(0, 0, WaterInfoCanvas.width, WaterInfoCanvas.height);
    wctx.beginPath();
    wctx.lineWidth = 2;
    wctx.strokeStyle = "#000000";
    wctx.fillStyle = "#C0C0C0";
    wctx.fillRect(left, top, width, height);
    wctx.rect(left, top, width, height);
    wctx.stroke();
}

// Animations

function animationCompletion(animation) {
    return (drawTime - animation.startTime) / (animation.endTime - animation.startTime);
}

function animateRotation(tile) {
    // This loop is just for fun.
    for (var i = 0; i < animatingTiles.length; ++i) {
        if (animatingTiles[i].id == tile.id) {
            if (animatingTiles[i].type == animationType.rotation) {
                animatingTiles[i].startTime += 200;
                animatingTiles[i].endTime += 200;
                return;
            } else {
                break;
            }
        }
    }
    var now = (new Date()).getTime();
    animatingTiles.push({id: tile.id, type: animationType.rotation, startTime: now, endTime: now + 200});
}

function animateFlip(tile) {
    var now = (new Date()).getTime();
    animatingTiles.push({id: tile.id, type: animationType.flip, startTime: now, endTime: now + 150});
}

function animateMove(move) {
    var now = (new Date()).getTime();
    var moveTime = 0;
    if ((mode.current != mode.sandbox) && (move.color != playerColor)) {
        moveTime = (200 * hexDistance(move.x0, move.y0, move.x1, move.y1));
        animatingPieces.unshift({piece: {type: move.type, color: move.color},
                                x0: move.x0, y0: move.y0, x: move.x1, y: move.y1,
                                startTime: now, endTime: now + moveTime});
    }
    if (move.capture) {
        var delay = Math.max(0, moveTime - 200);
        var drop = (move.color == topColor ? 6 : -6);
        animatingPieces.unshift({piece: {type: move.capType, color: !(move.color)},
                                x0: move.x2, y0: move.y2, x: move.x2 - drop, y: move.y2 + drop,
                                startTime: now + delay, endTime: now + delay + 1000});
    }
}

function animateScreen() {
    var now = (new Date()).getTime();
    screenAnimation = {startTime: now, endTime: now + 2000};
}

function updateAnimations() {
    for (var i = 0; i < animatingTiles.length; ++i) {
        if (animatingTiles[i].endTime <= drawTime) {
            animatingTiles.splice(i--, 1);
        }
    }
    for (var i = 0; i < animatingPieces.length; ++i) {
        if (animatingPieces[i].endTime <= drawTime) {
            animatingPieces.splice(i--, 1);
        }
    }
    for (var i = 0; i < tiles.length; ++i) {
        var tile = tiles[i];
        var side = ((tile.x + (1.25 * squareSize)) < (kingsTile.x + (1.5 * squareSize)));
        if (tile.side != side) {
            animateFlip(tile);
            tile.side = side;
        }
    }
    if ((screenAnimation != null) && (screenAnimation.endTime <= drawTime)) {
        screenAnimation = null;
    }
}


// Drawing

function drawSquare(x, y, terrain) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    if (terrain == terType.water) {
        ctx.fillStyle = "#C0C0C0";
    } else {
        ctx.fillStyle = "#FFFFFF";
    }
    ctx.fillRect(x, y, squareSize, squareSize);
    ctx.rect(x, y, squareSize, squareSize);
    if (terrain == terType.mountain) {
        ctx.moveTo(x,y);
        ctx.lineTo(x + squareSize, y + squareSize);
        ctx.moveTo(x + squareSize, y);
        ctx.lineTo(x, y + squareSize);
    }
    ctx.stroke();
}

function drawBoard() {
    for (var i = 0; i < 88; ++i) {
        var hex = indexToHex(i);
        var pos = hexPos(hex.x, hex.y);
        drawSquare(pos.x, pos.y, board[i].terrain);
    }
}

function drawXLabel(x, y, overHex) {
    if (x == overHex.x) {
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeText(XToChar(x), hexPosX(x, y) + squareSize/2, hexPosY(x, y) + squareSize/2 + 8);
        ctx.fillText(XToChar(x), hexPosX(x, y) + squareSize/2, hexPosY(x, y) + squareSize/2 + 8);
        ctx.fillStyle = "#000000";
    } else {
        ctx.fillText(XToChar(x), hexPosX(x, y) + squareSize/2, hexPosY(x, y) + squareSize/2 + 8);
    }
}

function drawYLabel(x, y, overHex) {
    if (y == overHex.y) {
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeText(y + 1, hexPosX(x, y) + squareSize/2, hexPosY(x, y) + squareSize/2 + 8);
        ctx.fillText(y + 1, hexPosX(x, y) + squareSize/2, hexPosY(x, y) + squareSize/2 + 8);
        ctx.fillStyle = "#000000";
    } else {
        ctx.fillText(y + 1, hexPosX(x, y) + squareSize/2, hexPosY(x, y) + squareSize/2 + 8);
    }
}

function drawCoordinates() {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.font = "20px sans-serif";
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    var overHex = hexAtPos(mouseX, mouseY);
    if (!hexInBounds(overHex.x, overHex.y)) {
        overHex = {x: -1, y: -1};
    }
    var x = -1;
    var y = -1;
    while (x < 4) {
        ++x;
        drawXLabel(x, y, overHex)
    }
    while (x < 11) {
        ++x;
        ++y;
        drawXLabel(x, y, overHex)
    }
    x = -1;
    y = -1;
    while (y < 4) {
        ++y;
        drawYLabel(x, y, overHex)
    }
    while (y < 11) {
        ++x;
        ++y;
        drawYLabel(x, y, overHex)
    }
    ctx.stroke();
}

function drawDividerScreen() {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#FFFFFF";
    var liftHeight =  0;
    if (screenAnimation != null) {
        liftHeight = animationCompletion(screenAnimation) * ((4.5 * squareSize) + topMargin);
    }
    ctx.rect(leftMargin, topMargin - liftHeight, squareSize * 12, squareSize * 4.5);
    ctx.fill();
    ctx.stroke();
}

function drawBaseBoard() {

    ctx.beginPath();
    ctx.fillStyle = "#F3F3F3";
    traceUnbuiltBoardBottom();
    ctx.fill();

    drawSlots();

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    traceUnbuiltBoardBottom();
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "#FFFFFF";
    var midline = topMargin + (4.5 * squareSize);
    for (var n = 0; n < 12; ++n) {
        ctx.rect(leftMargin + (n * squareSize), midline, squareSize, squareSize/2);
    }
    ctx.fill();
    ctx.stroke();
}

function traceUnbuiltBoardBottom() {
    var midline = topMargin + (4.5 * squareSize);
    var x = leftMargin + squareSize/2;
    var y = midline + squareSize/2;
    ctx.moveTo(x, y);
    for (var n = 0; n < 4; ++n) {
        y += squareSize;
        ctx.lineTo(x, y);
        x += squareSize/2;
        ctx.lineTo(x, y);
    }
    x = leftMargin + (10 * squareSize);
    ctx.lineTo(x, y);
    for (var n = 0; n < 4; ++n) {
        y -= squareSize;
        ctx.lineTo(x, y);
        x += squareSize/2;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(leftMargin + squareSize/2, midline + squareSize/2);
}

function drawSlots() {
    if (movingTile == kingsTile) {
        drawKingsTileSlots();
    } else if (kingSlots[0].tile != null) {
        drawHorzSlotDivider();
        drawLeftSlotDivider(leftMargin + (2.5 * squareSize));
        drawRightSlotDivider(leftMargin + (7.5 * squareSize));
        drawRightSlotDivider(leftMargin + (9.5 * squareSize));
    } else if (kingSlots[1].tile != null) {
        drawHorzSlotDivider();
        drawLeftSlotDivider(leftMargin + (2.5 * squareSize));
        drawLeftSlotDivider(leftMargin + (4.5 * squareSize));
        drawRightSlotDivider(leftMargin + (9.5 * squareSize));
    } else if (kingSlots[2].tile != null) {
        drawHorzSlotDivider();
        drawLeftSlotDivider(leftMargin + (2.5 * squareSize));
        drawLeftSlotDivider(leftMargin + (4.5 * squareSize));
        drawLeftSlotDivider(leftMargin + (6.5 * squareSize));
    } else {
        drawKingsTileSlots();
    }
}

function drawLeftSlotDivider(x) {
    ctx.beginPath();
    ctx.strokeStyle = "#C0C0C0";
    ctx.lineWidth = 2;
    var y = topMargin + (5 * squareSize);
    ctx.moveTo(x, y);
    for (var n = 0; n < 4; ++n) {
        y += squareSize;
        ctx.lineTo(x, y);
        x += squareSize/2;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawRightSlotDivider(x) {
    ctx.beginPath();
    ctx.strokeStyle = "#C0C0C0";
    ctx.lineWidth = 2;
    var y = topMargin + (5 * squareSize);
    ctx.moveTo(x, y);
    for (var n = 0; n < 4; ++n) {
        y += squareSize;
        ctx.lineTo(x, y);
        x -= squareSize/2;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawHorzSlotDivider() {
    ctx.beginPath();
    ctx.strokeStyle = "#C0C0C0";
    ctx.lineWidth = 2;
    var y = topMargin + (7 * squareSize);
    ctx.moveTo(leftMargin + (1.5 * squareSize), y);
    ctx.lineTo(leftMargin + (10.5 * squareSize), y);
    ctx.stroke();
}

function drawKingsTileSlots() {
    ctx.beginPath();
    ctx.strokeStyle = "#C0C0C0";
    ctx.lineWidth = 2;
    var x = leftMargin + (2.5 * squareSize);
    var y = topMargin + (5 * squareSize);
    ctx.moveTo(x, y);
    for (var n = 0; n < 3; ++n) {
        y += squareSize;
        ctx.lineTo(x, y);
        x += squareSize/2;
        ctx.lineTo(x, y);
    }
    for (var n = 0; n < 2; ++n) {
        x += squareSize/2;
        ctx.lineTo(x, y);
        y -= squareSize;
        ctx.lineTo(x, y);
        x += squareSize;
        ctx.lineTo(x, y);
        y += squareSize;
        ctx.lineTo(x, y);
        x += squareSize/2;
        ctx.lineTo(x, y);
    }
    for (var n = 0; n < 3; ++n) {
        x += squareSize/2;
        ctx.lineTo(x, y);
        y -= squareSize;
        ctx.lineTo(x, y);
    }
    x = leftMargin + (5 * squareSize);
    y = topMargin + (6 * squareSize);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + squareSize);
    x += 2 * squareSize;
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + squareSize);
    ctx.stroke();
    x = leftMargin + (4 * squareSize);
    y = topMargin + (7.5 * squareSize);
    for (var n = 0; n < 3; ++n) {
        ctx.moveTo(x + squareSize/6, y);
        ctx.arc(x, y, squareSize/6, 0, 2*Math.PI);
        x += 2 * squareSize;
    }
    ctx.stroke();
}

function drawKingsTile() {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#FFFFFF";
    var x = kingsTile.x;
    var y = kingsTile.y;
    for (var row = 3; row > 0; --row) {
        for (var n = 0; n < row; ++n) {
            ctx.rect(x + (n * squareSize), y, squareSize, squareSize);
            ctx.fillRect(x + (n * squareSize), y, squareSize, squareSize);
        }
        x += squareSize/2;
        y += squareSize;
    }
    y -= squareSize/2;
    ctx.moveTo(x + squareSize/6, y);
    ctx.arc(x, y, squareSize/6, 0, 2*Math.PI);
    ctx.stroke();
}

function drawTiles() {
    for (var i = 0; i < 9; ++i) {
        var tile = tiles[i];
        if (tile == kingsTile) {
            drawKingsTile();
        } else {
            var rotation = 0;
            var flip = 1;
            for (var j = 0; j < animatingTiles.length; ++j) {
                if (animatingTiles[j].id == tile.id) {
                    var animation = animatingTiles[j];
                    if (animation.type == animationType.rotation) {
                        rotation = Math.PI * (1 + animationCompletion(animation));
                    } else if (animation.type == animationType.flip) {
                        flip = (2 * animationCompletion(animation)) - 1;
                    }
                }
            }
            ctx.save();
            ctx.translate(tile.x + (1.25 * squareSize), tile.y + squareSize);
            ctx.rotate(rotation);
            ctx.scale(Math.abs(flip), 1);
            if (tile.side != (flip < 0)) {
                drawSquare(-1.25 * squareSize, -1 * squareSize, tile.squares[0]);
                drawSquare(-0.25 * squareSize, -1 * squareSize, tile.squares[1]);
                drawSquare(-0.75 * squareSize, 0, tile.squares[2]);
                drawSquare(0.25 * squareSize, 0, tile.squares[3]);
            } else {
                drawSquare(-0.75 * squareSize, -1 * squareSize, tile.squares[4]);
                drawSquare(0.25 * squareSize, -1 * squareSize, tile.squares[5]);
                drawSquare(-1.25 * squareSize, 0, tile.squares[6]);
                drawSquare(-0.25 * squareSize, 0, tile.squares[7]);
            }
            ctx.restore();
        }
    }
    if ((phase.current != phase.placeKingsTile) && (movingTile != null) && moved) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000000";
        var x = kingsTile.x + (1.5 * squareSize);
        for (var y = topMargin; y < topMargin + (9 * squareSize); y += squareSize/4) {
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + squareSize/8);
        }
        ctx.stroke();
    }
}

function drawPieceAt(piece, x, y, redCircle) {
    var radius = (2/5) * squareSize;
    var artIndex = piece.type + (piece.color * 10);
    if (squareSize == 50) {
        ctx.drawImage(pieceArt[artIndex], x - radius - 1, y - radius - 1);
    } else {
        ctx.drawImage(pieceArt[artIndex], x - radius, y - radius, 2 * radius, 2 * radius);
    }
    if (redCircle) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FF0000";
        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, 2*Math.PI);
        ctx.stroke();
    }
}

function drawPiece(piece) {
    if (piece == movingPiece) {
        drawPieceAt(piece, movingPieceX, movingPieceY, false);
    } else if (!containsHex(animatingPieces, piece.x, piece.y)) {
        var pos = hexPos(piece.x, piece.y);
        var redCircle = (mode.current != mode.sandbox) && containsHex(kingThreats, piece.x, piece.y)
        drawPieceAt(piece, pos.x + squareSize/2, pos.y + squareSize/2, redCircle);
    }
}

function drawAnimatingPieces() {
    for (var i = 0; i < animatingPieces.length; ++i) {
        var completion = animationCompletion(animatingPieces[i]);
        var origin = hexPos(animatingPieces[i].x0, animatingPieces[i].y0);
        var x = origin.x + squareSize/2;
        var y = origin.y + squareSize/2;
        if (completion > 0) {
            var target = hexPos(animatingPieces[i].x, animatingPieces[i].y);
            x += completion * (target.x - origin.x);
            y += completion * (target.y - origin.y);
        }
        drawPieceAt(animatingPieces[i].piece, x, y, false);
    }
}

var twiceRootThree = 2 * Math.sqrt(3);

function traceLeftArrowHead(x, y) {
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 2, y + twiceRootThree);
    ctx.lineTo(x + 2, y - twiceRootThree);
    ctx.lineTo(x - 4, y);
    ctx.closePath();
}

function traceRightArrowHead(x, y) {
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x - 2, y + twiceRootThree);
    ctx.lineTo(x - 2, y - twiceRootThree);
    ctx.lineTo(x + 4, y);
    ctx.closePath();
}

function drawEngagementLine(engager, engaged, red) {
    var engagerPos = hexPos(engager.x, engager.y);
    var engagedPos = hexPos(engaged.x, engaged.y);
    var dist = distance(engagerPos.x, engagerPos.y, engagedPos.x, engagedPos.y);
    var endPointX = engagedPos.x + squareSize/2 + ((2/5) * squareSize * (engagerPos.x - engagedPos.x) / dist);
    var endPointY = engagedPos.y + squareSize/2 + ((2/5) * squareSize * (engagerPos.y - engagedPos.y) / dist);

    var traceArrowHead;
    // if ((engagerPos.x + engagerPos.y > engagedPos.x + engagedPos.y) != (engagerPos.x - engagerPos.y == engagedPos.x - engagedPos.y)) {
    if ((engagerPos.x < engagedPos.x) != (engagerPos.y == engagedPos.y)) {
        traceArrowHead = traceLeftArrowHead;
    } else {
        traceArrowHead = traceRightArrowHead;
    }

    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.moveTo(engagerPos.x + squareSize/2, engagerPos.y + squareSize/2);
    ctx.lineTo(endPointX, endPointY);
    traceArrowHead(endPointX, endPointY);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = (red ? "#FF0000" : "#FFFFCC");
    ctx.fillStyle = ctx.strokeStyle;
    ctx.moveTo(engagerPos.x + squareSize/2, engagerPos.y + squareSize/2);
    ctx.lineTo(endPointX, endPointY);
    traceArrowHead(endPointX, endPointY);
    ctx.fill();
    ctx.stroke();
}

function drawRangeMarker(piece, marker) {
    var x = hexPosX(marker.x, marker.y) + squareSize/2;
    var y = hexPosY(marker.x, marker.y) + squareSize/2;
    if ((piece.x + piece.y > marker.x + marker.y) != (piece.x - piece.y == marker.x - marker.y)) {
        traceArrowHead = traceRightArrowHead;
    } else {
        traceArrowHead = traceLeftArrowHead;
    }
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    traceArrowHead(x, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#F0F0C0";
    ctx.fillStyle = "#F0F0C0";
    traceArrowHead(x, y);
    ctx.fill();
    ctx.stroke();
}

function drawEngagement() {
    var piece = pieceUnderMouse();

    if (piece != null) {
        var engagement = getEngagement(piece);
        var rangeMarkers = getRangeMarkers(piece);
        var armor = pieceArmor[piece.type];
        var red = engagement >= armor;

        //draw lines
        for (var i = 0; i < engagers.length; ++i) {
            drawEngagementLine(engagers[i], piece, red);
        }

        //draw engagers over lines
        for (var i = 0; i < engagers.length; ++i) {
            drawPiece(engagers[i]);
        }

        //draw range markers
        for (var i = 0; i < rangeMarkers.length; ++i) {
            drawRangeMarker(piece, rangeMarkers[i]);
        }

        //draw numbers
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.font = "bold 14px sans-serif"
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = (red ? "#FF0000" : "#F0F0C0");
        var text = engagement + "/" + armor;
        var x = hexPosX(piece.x, piece.y) + squareSize/2;
        var y = hexPosY(piece.x, piece.y) + squareSize;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.stroke();
    }
}

function drawMoveDot(x, y, color) {
    ctx.beginPath();
    //ctx.lineWidth = 1.5;
    //ctx.strokeStyle = "#000000";
    ctx.fillStyle = color;
    var xPos = hexPosX(x, y) + squareSize/2;
    var yPos = hexPosY(x, y) + squareSize/2;
    ctx.moveTo(xPos + squareSize/6, yPos);
    ctx.arc(xPos, yPos, squareSize/6, 0, 2*Math.PI);
    ctx.fill();
    //ctx.stroke();
}

function drawMoveOctagon(x, y, color) {
    ctx.beginPath();
    //ctx.lineWidth = 1.5;
    //ctx.strokeStyle = "#000000";
    ctx.fillStyle = color;
    var xPos = hexPosX(x, y) + squareSize/2;
    var yPos = hexPosY(x, y) + squareSize/2;
    // ctx.moveTo(xPos - squareSize/15, yPos - squareSize/6);
    // ctx.lineTo(xPos + squareSize/15, yPos - squareSize/6);
    // ctx.lineTo(xPos + squareSize/6, yPos - squareSize/15);
    // ctx.lineTo(xPos + squareSize/6, yPos + squareSize/15);
    // ctx.lineTo(xPos + squareSize/15, yPos + squareSize/6);
    // ctx.lineTo(xPos - squareSize/15, yPos + squareSize/6);
    // ctx.lineTo(xPos - squareSize/6, yPos + squareSize/15);
    // ctx.lineTo(xPos - squareSize/6, yPos - squareSize/15);
    // ctx.lineTo(xPos - squareSize/15, yPos - squareSize/6);

    ctx.moveTo(xPos - squareSize/12, yPos - squareSize/5);
    ctx.lineTo(xPos + squareSize/12, yPos - squareSize/5);
    ctx.lineTo(xPos + squareSize/5, yPos - squareSize/12);
    ctx.lineTo(xPos + squareSize/5, yPos + squareSize/12);
    ctx.lineTo(xPos + squareSize/12, yPos + squareSize/5);
    ctx.lineTo(xPos - squareSize/12, yPos + squareSize/5);
    ctx.lineTo(xPos - squareSize/5, yPos + squareSize/12);
    ctx.lineTo(xPos - squareSize/5, yPos - squareSize/12);
    ctx.lineTo(xPos - squareSize/12, yPos - squareSize/5);
    ctx.fill();
}

function drawMoves() {
    if ((showMoves != []) || (showCaptures != [])) {
        //var pieceColor = (movingPiece == null ? !playerColor : movingPiece.color);
        var spearblocks = getSpearBlocks(movingPiece != null);
        for (var i = 0; i < showMoves.length; ++i) {
            var hex = showMoves[i];
            if (!containsHex(showCaptures, hex.x, hex.y)) {
                if (containsHex(spearblocks, hex.x, hex.y)) {
                    drawMoveOctagon(hex.x, hex.y, "#0000FF");
                } else {
                    drawMoveDot(hex.x, hex.y, "#0000FF");
                }
            }
        }
        for (var i = 0; i < showCaptures.length; ++i) {
            hex = showCaptures[i];
            if (containsHex(spearblocks, hex.x, hex.y)) {
                drawMoveOctagon(hex.x, hex.y, "#FF0000");
            } else {
                drawMoveDot(hex.x, hex.y, "#FF0000");
            }
        }
    }
}

function draw() {
    drawTime = (new Date()).getTime();
    updateAnimations();
    ctx.clearRect(0, 0, Board.width, Board.height);
    switch (phase.current) {
    case phase.loading:
        break;
    case phase.placeKingsTile:
        drawBaseBoard();
        drawDividerScreen();
        drawKingsTile();
        break;
    case phase.placeTiles:
        drawBaseBoard();
        drawDividerScreen();
        drawTiles();
        break;
    case phase.placeKing:
        drawBaseBoard();
        drawDividerScreen();
        drawTiles();
        drawPiece(playerPieces[0]);
        break;
    case phase.placePieces:
    case phase.boardComplete:
    case phase.localSetup:
    case phase.exchangeBoards:
    case phase.confirmExchange:
        drawBoard();
        drawDividerScreen();
        drawTiles();
        for (var i = 0; i < playerPieces.length; ++i) {
            drawPiece(playerPieces[i]);
        }
        break;
    default:
        drawBoard();
        for (var i = 0; i < opponentPieces.length; ++i) {
            drawPiece(opponentPieces[i]);
        }
        for (var i = 0; i < playerPieces.length; ++i) {
            drawPiece(playerPieces[i]);
        }
        if (screenAnimation != null) {
            drawDividerScreen();
        } else {
            drawCoordinates();
            drawAnimatingPieces();
            drawMoves();
            if (mouseDown) {
                if (movingPiece != null) {
                    drawPiece(movingPiece);
                }
            } else {
                drawEngagement();
            }
        }
    }
}

function redrawCanvasWhenAnimated() {
    if ((animatingPieces.length > 0) ||
        (animatingTiles.length > 0) ||
        (screenAnimation != null)) {

        draw();
    }
}