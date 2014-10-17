// Draw the terrain squares for the terrain info fields.
function drawTerrainThumbails() {

    var left = 2;
    var right = MountainInfoCanvas.width - left;
    var top = 2;
    var bottom = MountainInfoCanvas.height - top;
    var width = right - left;
    var height = bottom - top;

    var mCtx = MountainInfoCanvas.getContext("2d");
    mCtx.clearRect(0, 0, MountainInfoCanvas.width, MountainInfoCanvas.height);
    mCtx.beginPath();
    mCtx.lineWidth = 2;
    mCtx.strokeStyle = "#000000";
    mCtx.fillStyle = "#FFFFFF";
    mCtx.fillRect(left, top, width, height);
    mCtx.rect(left, top, width, height);
    mCtx.moveTo(left, top);
    mCtx.lineTo(right, bottom);
    mCtx.moveTo(right, top);
    mCtx.lineTo(left, bottom);
    mCtx.stroke();

    var wCtx = WaterInfoCanvas.getContext("2d");
    wCtx.clearRect(0, 0, WaterInfoCanvas.width, WaterInfoCanvas.height);
    wCtx.beginPath();
    wCtx.lineWidth = 2;
    wCtx.strokeStyle = "#000000";
    wCtx.fillStyle = "#C0C0C0";
    wCtx.fillRect(left, top, width, height);
    wCtx.rect(left, top, width, height);
    wCtx.stroke();
}

// Animations

function animationCompletion(animation) {
    return (DrawTime - animation.startTime) / (animation.endTime - animation.startTime);
}

function animateRotation(tile) {
    // This loop is just for fun.
    for (var i = 0; i < AnimatingTiles.length; ++i) {
        if (AnimatingTiles[i].id == tile.id) {
            if (AnimatingTiles[i].type == AnimationType.rotation) {
                AnimatingTiles[i].startTime += 200;
                AnimatingTiles[i].endTime += 200;
                return;
            } else {
                break;
            }
        }
    }
    var now = (new Date()).getTime();
    AnimatingTiles.push({id: tile.id, type: AnimationType.rotation, startTime: now, endTime: now + 200});
}

function animateFlip(tile) {
    var now = (new Date()).getTime();
    AnimatingTiles.push({id: tile.id, type: AnimationType.flip, startTime: now, endTime: now + 150});
}

function animateMove(move) {
    var now = (new Date()).getTime();
    var moveTime = 0;
    if ((Mode.current != Mode.sandbox) && (move.color != PlayerColor)) {
        moveTime = (200 * hexDistance(move.x0, move.y0, move.x1, move.y1));
        AnimatingPieces.unshift({piece: {type: move.type, color: move.color},
                                x0: move.x0, y0: move.y0, x: move.x1, y: move.y1,
                                startTime: now, endTime: now + moveTime});
    }
    if (move.capture) {
        var delay = Math.max(0, moveTime - 200);
        var drop = (move.color == TopColor ? 6 : -6);
        AnimatingPieces.unshift({piece: {type: move.capType, color: !(move.color)},
                                x0: move.x2, y0: move.y2, x: move.x2 - drop, y: move.y2 + drop,
                                startTime: now + delay, endTime: now + delay + 1000});
    }
}

function animateScreen() {
    var now = (new Date()).getTime();
    ScreenAnimation = {startTime: now, endTime: now + 2000};
}

function updateAnimations() {
    for (var i = 0; i < AnimatingTiles.length; ++i) {
        if (AnimatingTiles[i].endTime <= DrawTime) {
            AnimatingTiles.splice(i--, 1);
        }
    }
    for (var i = 0; i < AnimatingPieces.length; ++i) {
        if (AnimatingPieces[i].endTime <= DrawTime) {
            AnimatingPieces.splice(i--, 1);
        }
    }
    for (var i = 0; i < tiles.length; ++i) {
        var tile = tiles[i];
        var side = ((tile.x + (1.25 * SquareSize)) < (kingsTile.x + (1.5 * SquareSize)));
        if (tile.side != side) {
            animateFlip(tile);
            tile.side = side;
        }
    }
    if ((ScreenAnimation != null) && (ScreenAnimation.endTime <= DrawTime)) {
        ScreenAnimation = null;
    }
}


// Drawing

function drawSquare(x, y, terrain) {
    Ctx.beginPath();
    Ctx.lineWidth = 2;
    Ctx.strokeStyle = "#000000";
    if (terrain == TerType.water) {
        Ctx.fillStyle = "#C0C0C0";
    } else {
        Ctx.fillStyle = "#FFFFFF";
    }
    Ctx.fillRect(x, y, SquareSize, SquareSize);
    Ctx.rect(x, y, SquareSize, SquareSize);
    if (terrain == TerType.mountain) {
        Ctx.moveTo(x,y);
        Ctx.lineTo(x + SquareSize, y + SquareSize);
        Ctx.moveTo(x + SquareSize, y);
        Ctx.lineTo(x, y + SquareSize);
    }
    Ctx.stroke();
}

function drawBoard() {
    for (var i = 0; i < 88; ++i) {
        var hex = indexToHex(i);
        var pos = hexPos(hex.x, hex.y);
        drawSquare(pos.x, pos.y, Board[i].terrain);
    }
}

function drawXLabel(x, y, overHex) {
    if (x == overHex.x) {
        Ctx.fillStyle = "#FFFFFF";
        Ctx.strokeText(XToChar(x), hexPosX(x, y) + SquareSize/2, hexPosY(x, y) + SquareSize/2 + 8);
        Ctx.fillText(XToChar(x), hexPosX(x, y) + SquareSize/2, hexPosY(x, y) + SquareSize/2 + 8);
        Ctx.fillStyle = "#000000";
    } else {
        Ctx.fillText(XToChar(x), hexPosX(x, y) + SquareSize/2, hexPosY(x, y) + SquareSize/2 + 8);
    }
}

function drawYLabel(x, y, overHex) {
    if (y == overHex.y) {
        Ctx.fillStyle = "#FFFFFF";
        Ctx.strokeText(y + 1, hexPosX(x, y) + SquareSize/2, hexPosY(x, y) + SquareSize/2 + 8);
        Ctx.fillText(y + 1, hexPosX(x, y) + SquareSize/2, hexPosY(x, y) + SquareSize/2 + 8);
        Ctx.fillStyle = "#000000";
    } else {
        Ctx.fillText(y + 1, hexPosX(x, y) + SquareSize/2, hexPosY(x, y) + SquareSize/2 + 8);
    }
}

function drawCoordinates() {
    Ctx.beginPath();
    Ctx.lineWidth = 3;
    Ctx.font = "20px sans-serif";
    Ctx.strokeStyle = "#000000";
    Ctx.fillStyle = "#000000";
    Ctx.textAlign = "center";
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
    Ctx.stroke();
}

function drawDividerScreen() {
    Ctx.beginPath();
    Ctx.lineWidth = 2;
    Ctx.strokeStyle = "#000000";
    Ctx.fillStyle = "#FFFFFF";
    var liftHeight =  0;
    if (ScreenAnimation != null) {
        liftHeight = animationCompletion(ScreenAnimation) * ((4.5 * SquareSize) + TopMargin);
    }
    Ctx.rect(LeftMargin, TopMargin - liftHeight, SquareSize * 12, SquareSize * 4.5);
    Ctx.fill();
    Ctx.stroke();
}

function drawBaseBoard() {

    Ctx.beginPath();
    Ctx.fillStyle = "#F3F3F3";
    traceUnbuiltBoardBottom();
    Ctx.fill();

    drawSlots();

    Ctx.beginPath();
    Ctx.lineWidth = 2;
    Ctx.strokeStyle = "#000000";
    traceUnbuiltBoardBottom();
    Ctx.stroke();

    Ctx.beginPath();
    Ctx.fillStyle = "#FFFFFF";
    var midline = TopMargin + (4.5 * SquareSize);
    for (var n = 0; n < 12; ++n) {
        Ctx.rect(LeftMargin + (n * SquareSize), midline, SquareSize, SquareSize/2);
    }
    Ctx.fill();
    Ctx.stroke();
}

function traceUnbuiltBoardBottom() {
    var midline = TopMargin + (4.5 * SquareSize);
    var x = LeftMargin + SquareSize/2;
    var y = midline + SquareSize/2;
    Ctx.moveTo(x, y);
    for (var n = 0; n < 4; ++n) {
        y += SquareSize;
        Ctx.lineTo(x, y);
        x += SquareSize/2;
        Ctx.lineTo(x, y);
    }
    x = LeftMargin + (10 * SquareSize);
    Ctx.lineTo(x, y);
    for (var n = 0; n < 4; ++n) {
        y -= SquareSize;
        Ctx.lineTo(x, y);
        x += SquareSize/2;
        Ctx.lineTo(x, y);
    }
    Ctx.lineTo(LeftMargin + SquareSize/2, midline + SquareSize/2);
}

function drawSlots() {
    if (movingTile == kingsTile) {
        drawKingsTileSlots();
    } else if (kingSlots[0].tile != null) {
        drawHorzSlotDivider();
        drawLeftSlotDivider(LeftMargin + (2.5 * SquareSize));
        drawRightSlotDivider(LeftMargin + (7.5 * SquareSize));
        drawRightSlotDivider(LeftMargin + (9.5 * SquareSize));
    } else if (kingSlots[1].tile != null) {
        drawHorzSlotDivider();
        drawLeftSlotDivider(LeftMargin + (2.5 * SquareSize));
        drawLeftSlotDivider(LeftMargin + (4.5 * SquareSize));
        drawRightSlotDivider(LeftMargin + (9.5 * SquareSize));
    } else if (kingSlots[2].tile != null) {
        drawHorzSlotDivider();
        drawLeftSlotDivider(LeftMargin + (2.5 * SquareSize));
        drawLeftSlotDivider(LeftMargin + (4.5 * SquareSize));
        drawLeftSlotDivider(LeftMargin + (6.5 * SquareSize));
    } else {
        drawKingsTileSlots();
    }
}

function drawLeftSlotDivider(x) {
    Ctx.beginPath();
    Ctx.strokeStyle = "#C0C0C0";
    Ctx.lineWidth = 2;
    var y = TopMargin + (5 * SquareSize);
    Ctx.moveTo(x, y);
    for (var n = 0; n < 4; ++n) {
        y += SquareSize;
        Ctx.lineTo(x, y);
        x += SquareSize/2;
        Ctx.lineTo(x, y);
    }
    Ctx.stroke();
}

function drawRightSlotDivider(x) {
    Ctx.beginPath();
    Ctx.strokeStyle = "#C0C0C0";
    Ctx.lineWidth = 2;
    var y = TopMargin + (5 * SquareSize);
    Ctx.moveTo(x, y);
    for (var n = 0; n < 4; ++n) {
        y += SquareSize;
        Ctx.lineTo(x, y);
        x -= SquareSize/2;
        Ctx.lineTo(x, y);
    }
    Ctx.stroke();
}

function drawHorzSlotDivider() {
    Ctx.beginPath();
    Ctx.strokeStyle = "#C0C0C0";
    Ctx.lineWidth = 2;
    var y = TopMargin + (7 * SquareSize);
    Ctx.moveTo(LeftMargin + (1.5 * SquareSize), y);
    Ctx.lineTo(LeftMargin + (10.5 * SquareSize), y);
    Ctx.stroke();
}

function drawKingsTileSlots() {
    Ctx.beginPath();
    Ctx.strokeStyle = "#C0C0C0";
    Ctx.lineWidth = 2;
    var x = LeftMargin + (2.5 * SquareSize);
    var y = TopMargin + (5 * SquareSize);
    Ctx.moveTo(x, y);
    for (var n = 0; n < 3; ++n) {
        y += SquareSize;
        Ctx.lineTo(x, y);
        x += SquareSize/2;
        Ctx.lineTo(x, y);
    }
    for (var n = 0; n < 2; ++n) {
        x += SquareSize/2;
        Ctx.lineTo(x, y);
        y -= SquareSize;
        Ctx.lineTo(x, y);
        x += SquareSize;
        Ctx.lineTo(x, y);
        y += SquareSize;
        Ctx.lineTo(x, y);
        x += SquareSize/2;
        Ctx.lineTo(x, y);
    }
    for (var n = 0; n < 3; ++n) {
        x += SquareSize/2;
        Ctx.lineTo(x, y);
        y -= SquareSize;
        Ctx.lineTo(x, y);
    }
    x = LeftMargin + (5 * SquareSize);
    y = TopMargin + (6 * SquareSize);
    Ctx.moveTo(x, y);
    Ctx.lineTo(x, y + SquareSize);
    x += 2 * SquareSize;
    Ctx.moveTo(x, y);
    Ctx.lineTo(x, y + SquareSize);
    Ctx.stroke();
    x = LeftMargin + (4 * SquareSize);
    y = TopMargin + (7.5 * SquareSize);
    for (var n = 0; n < 3; ++n) {
        Ctx.moveTo(x + SquareSize/6, y);
        Ctx.arc(x, y, SquareSize/6, 0, 2*Math.PI);
        x += 2 * SquareSize;
    }
    Ctx.stroke();
}

function drawKingsTile() {
    Ctx.beginPath();
    Ctx.lineWidth = 2;
    Ctx.strokeStyle = "#000000";
    Ctx.fillStyle = "#FFFFFF";
    var x = kingsTile.x;
    var y = kingsTile.y;
    for (var row = 3; row > 0; --row) {
        for (var n = 0; n < row; ++n) {
            Ctx.rect(x + (n * SquareSize), y, SquareSize, SquareSize);
            Ctx.fillRect(x + (n * SquareSize), y, SquareSize, SquareSize);
        }
        x += SquareSize/2;
        y += SquareSize;
    }
    y -= SquareSize/2;
    Ctx.moveTo(x + SquareSize/6, y);
    Ctx.arc(x, y, SquareSize/6, 0, 2*Math.PI);
    Ctx.stroke();
}

function drawTiles() {
    for (var i = 0; i < 9; ++i) {
        var tile = tiles[i];
        if (tile == kingsTile) {
            drawKingsTile();
        } else {
            var rotation = 0;
            var flip = 1;
            for (var j = 0; j < AnimatingTiles.length; ++j) {
                if (AnimatingTiles[j].id == tile.id) {
                    var animation = AnimatingTiles[j];
                    if (animation.type == AnimationType.rotation) {
                        rotation = Math.PI * (1 + animationCompletion(animation));
                    } else if (animation.type == AnimationType.flip) {
                        flip = (2 * animationCompletion(animation)) - 1;
                    }
                }
            }
            Ctx.save();
            Ctx.translate(tile.x + (1.25 * SquareSize), tile.y + SquareSize);
            Ctx.rotate(rotation);
            Ctx.scale(Math.abs(flip), 1);
            if (tile.side != (flip < 0)) {
                drawSquare(-1.25 * SquareSize, -1 * SquareSize, tile.squares[0]);
                drawSquare(-0.25 * SquareSize, -1 * SquareSize, tile.squares[1]);
                drawSquare(-0.75 * SquareSize, 0, tile.squares[2]);
                drawSquare(0.25 * SquareSize, 0, tile.squares[3]);
            } else {
                drawSquare(-0.75 * SquareSize, -1 * SquareSize, tile.squares[4]);
                drawSquare(0.25 * SquareSize, -1 * SquareSize, tile.squares[5]);
                drawSquare(-1.25 * SquareSize, 0, tile.squares[6]);
                drawSquare(-0.25 * SquareSize, 0, tile.squares[7]);
            }
            Ctx.restore();
        }
    }
    if ((Phase.current != Phase.placeKingsTile) && (movingTile != null) && moved) {
        Ctx.beginPath();
        Ctx.lineWidth = 2;
        Ctx.strokeStyle = "#000000";
        var x = kingsTile.x + (1.5 * SquareSize);
        for (var y = TopMargin; y < TopMargin + (9 * SquareSize); y += SquareSize/4) {
            Ctx.moveTo(x, y);
            Ctx.lineTo(x, y + SquareSize/8);
        }
        Ctx.stroke();
    }
}

function drawPieceAt(piece, x, y, redCircle) {
    var radius = (2/5) * SquareSize;
    var artIndex = piece.type + (piece.color * 10);
    if (SquareSize == 50) {
        Ctx.drawImage(PieceArt[artIndex], x - radius - 1, y - radius - 1);
    } else {
        Ctx.drawImage(PieceArt[artIndex], x - radius, y - radius, 2 * radius, 2 * radius);
    }
    if (redCircle) {
        Ctx.beginPath();
        Ctx.lineWidth = 2;
        Ctx.strokeStyle = "#FF0000";
        Ctx.moveTo(x + radius, y);
        Ctx.arc(x, y, radius, 0, 2*Math.PI);
        Ctx.stroke();
    }
}

function drawPiece(piece) {
    if (piece == movingPiece) {
        drawPieceAt(piece, movingPieceX, movingPieceY, false);
    } else if (!containsHex(AnimatingPieces, piece.x, piece.y)) {
        var pos = hexPos(piece.x, piece.y);
        var redCircle = (Mode.current != Mode.sandbox) && containsHex(KingThreats, piece.x, piece.y)
        drawPieceAt(piece, pos.x + SquareSize/2, pos.y + SquareSize/2, redCircle);
    }
}

function drawAnimatingPieces() {
    for (var i = 0; i < AnimatingPieces.length; ++i) {
        var completion = animationCompletion(AnimatingPieces[i]);
        var origin = hexPos(AnimatingPieces[i].x0, AnimatingPieces[i].y0);
        var x = origin.x + SquareSize/2;
        var y = origin.y + SquareSize/2;
        if (completion > 0) {
            var target = hexPos(AnimatingPieces[i].x, AnimatingPieces[i].y);
            x += completion * (target.x - origin.x);
            y += completion * (target.y - origin.y);
        }
        drawPieceAt(AnimatingPieces[i].piece, x, y, false);
    }
}

var twiceRootThree = 2 * Math.sqrt(3);

function traceLeftArrowHead(x, y) {
    Ctx.moveTo(x - 4, y);
    Ctx.lineTo(x + 2, y + twiceRootThree);
    Ctx.lineTo(x + 2, y - twiceRootThree);
    Ctx.lineTo(x - 4, y);
    Ctx.closePath();
}

function traceRightArrowHead(x, y) {
    Ctx.moveTo(x + 4, y);
    Ctx.lineTo(x - 2, y + twiceRootThree);
    Ctx.lineTo(x - 2, y - twiceRootThree);
    Ctx.lineTo(x + 4, y);
    Ctx.closePath();
}

function drawEngagementLine(engager, engaged, red) {
    var engagerPos = hexPos(engager.x, engager.y);
    var engagedPos = hexPos(engaged.x, engaged.y);
    var dist = distance(engagerPos.x, engagerPos.y, engagedPos.x, engagedPos.y);
    var endPointX = engagedPos.x + SquareSize/2 + ((2/5) * SquareSize * (engagerPos.x - engagedPos.x) / dist);
    var endPointY = engagedPos.y + SquareSize/2 + ((2/5) * SquareSize * (engagerPos.y - engagedPos.y) / dist);

    var traceArrowHead;
    // if ((engagerPos.x + engagerPos.y > engagedPos.x + engagedPos.y) != (engagerPos.x - engagerPos.y == engagedPos.x - engagedPos.y)) {
    if ((engagerPos.x < engagedPos.x) != (engagerPos.y == engagedPos.y)) {
        traceArrowHead = traceLeftArrowHead;
    } else {
        traceArrowHead = traceRightArrowHead;
    }

    Ctx.beginPath();
    Ctx.lineWidth = 4;
    Ctx.strokeStyle = "#000000";
    Ctx.moveTo(engagerPos.x + SquareSize/2, engagerPos.y + SquareSize/2);
    Ctx.lineTo(endPointX, endPointY);
    traceArrowHead(endPointX, endPointY);
    Ctx.stroke();

    Ctx.beginPath();
    Ctx.lineWidth = 2;
    Ctx.strokeStyle = (red ? "#FF0000" : "#FFFFCC");
    Ctx.fillStyle = Ctx.strokeStyle;
    Ctx.moveTo(engagerPos.x + SquareSize/2, engagerPos.y + SquareSize/2);
    Ctx.lineTo(endPointX, endPointY);
    traceArrowHead(endPointX, endPointY);
    Ctx.fill();
    Ctx.stroke();
}

function drawRangeMarker(piece, marker) {
    var x = hexPosX(marker.x, marker.y) + SquareSize/2;
    var y = hexPosY(marker.x, marker.y) + SquareSize/2;
    if ((piece.x + piece.y > marker.x + marker.y) != (piece.x - piece.y == marker.x - marker.y)) {
        traceArrowHead = traceRightArrowHead;
    } else {
        traceArrowHead = traceLeftArrowHead;
    }
    Ctx.beginPath();
    Ctx.lineWidth = 4;
    Ctx.strokeStyle = "#000000";
    traceArrowHead(x, y);
    Ctx.stroke();

    Ctx.beginPath();
    Ctx.lineWidth = 2;
    Ctx.strokeStyle = "#F0F0C0";
    Ctx.fillStyle = "#F0F0C0";
    traceArrowHead(x, y);
    Ctx.fill();
    Ctx.stroke();
}

function drawEngagement() {
    var piece = pieceUnderMouse();

    if (piece != null) {
        var engagement = getEngagement(piece);
        var rangeMarkers = getRangeMarkers(piece);
        var armor = PieceArmor[piece.type];
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
        Ctx.beginPath();
        Ctx.lineWidth = 3;
        Ctx.font = "bold 14px sans-serif"
        Ctx.textAlign = "center";
        Ctx.strokeStyle = "#000000";
        Ctx.fillStyle = (red ? "#FF0000" : "#F0F0C0");
        var text = engagement + "/" + armor;
        var x = hexPosX(piece.x, piece.y) + SquareSize/2;
        var y = hexPosY(piece.x, piece.y) + SquareSize;
        Ctx.strokeText(text, x, y);
        Ctx.fillText(text, x, y);
        Ctx.stroke();
    }
}

function drawMoveDot(x, y, color) {
    Ctx.beginPath();
    //Ctx.lineWidth = 1.5;
    //Ctx.strokeStyle = "#000000";
    Ctx.fillStyle = color;
    var xPos = hexPosX(x, y) + SquareSize/2;
    var yPos = hexPosY(x, y) + SquareSize/2;
    Ctx.moveTo(xPos + SquareSize/6, yPos);
    Ctx.arc(xPos, yPos, SquareSize/6, 0, 2*Math.PI);
    Ctx.fill();
    //Ctx.stroke();
}

function drawMoveOctagon(x, y, color) {
    Ctx.beginPath();
    //Ctx.lineWidth = 1.5;
    //Ctx.strokeStyle = "#000000";
    Ctx.fillStyle = color;
    var xPos = hexPosX(x, y) + SquareSize/2;
    var yPos = hexPosY(x, y) + SquareSize/2;
    // Ctx.moveTo(xPos - SquareSize/15, yPos - SquareSize/6);
    // Ctx.lineTo(xPos + SquareSize/15, yPos - SquareSize/6);
    // Ctx.lineTo(xPos + SquareSize/6, yPos - SquareSize/15);
    // Ctx.lineTo(xPos + SquareSize/6, yPos + SquareSize/15);
    // Ctx.lineTo(xPos + SquareSize/15, yPos + SquareSize/6);
    // Ctx.lineTo(xPos - SquareSize/15, yPos + SquareSize/6);
    // Ctx.lineTo(xPos - SquareSize/6, yPos + SquareSize/15);
    // Ctx.lineTo(xPos - SquareSize/6, yPos - SquareSize/15);
    // Ctx.lineTo(xPos - SquareSize/15, yPos - SquareSize/6);

    Ctx.moveTo(xPos - SquareSize/12, yPos - SquareSize/5);
    Ctx.lineTo(xPos + SquareSize/12, yPos - SquareSize/5);
    Ctx.lineTo(xPos + SquareSize/5, yPos - SquareSize/12);
    Ctx.lineTo(xPos + SquareSize/5, yPos + SquareSize/12);
    Ctx.lineTo(xPos + SquareSize/12, yPos + SquareSize/5);
    Ctx.lineTo(xPos - SquareSize/12, yPos + SquareSize/5);
    Ctx.lineTo(xPos - SquareSize/5, yPos + SquareSize/12);
    Ctx.lineTo(xPos - SquareSize/5, yPos - SquareSize/12);
    Ctx.lineTo(xPos - SquareSize/12, yPos - SquareSize/5);
    Ctx.fill();
}

function drawMoves() {
    if ((ShowMoves != []) || (ShowCaptures != [])) {
        //var pieceColor = (movingPiece == null ? !PlayerColor : movingPiece.color);
        var spearblocks = getSpearBlocks(movingPiece != null);
        for (var i = 0; i < ShowMoves.length; ++i) {
            var hex = ShowMoves[i];
            if (!containsHex(ShowCaptures, hex.x, hex.y)) {
                if (containsHex(spearblocks, hex.x, hex.y)) {
                    drawMoveOctagon(hex.x, hex.y, "#0000FF");
                } else {
                    drawMoveDot(hex.x, hex.y, "#0000FF");
                }
            }
        }
        for (var i = 0; i < ShowCaptures.length; ++i) {
            hex = ShowCaptures[i];
            if (containsHex(spearblocks, hex.x, hex.y)) {
                drawMoveOctagon(hex.x, hex.y, "#FF0000");
            } else {
                drawMoveDot(hex.x, hex.y, "#FF0000");
            }
        }
    }
}

function draw() {
    DrawTime = (new Date()).getTime();
    updateAnimations();
    Ctx.clearRect(0, 0, BoardCanvas.width, BoardCanvas.height);
    switch (Phase.current) {
    case Phase.loading:
        break;
    case Phase.placeKingsTile:
        drawBaseBoard();
        drawDividerScreen();
        drawKingsTile();
        break;
    case Phase.placeTiles:
        drawBaseBoard();
        drawDividerScreen();
        drawTiles();
        break;
    case Phase.placeKing:
        drawBaseBoard();
        drawDividerScreen();
        drawTiles();
        drawPiece(PlayerPieces[0]);
        break;
    case Phase.placePieces:
    case Phase.boardComplete:
    case Phase.localSetup:
    case Phase.exchangeBoards:
    case Phase.confirmExchange:
        drawBoard();
        drawDividerScreen();
        drawTiles();
        for (var i = 0; i < PlayerPieces.length; ++i) {
            drawPiece(PlayerPieces[i]);
        }
        break;
    default:
        drawBoard();
        for (var i = 0; i < OpponentPieces.length; ++i) {
            drawPiece(OpponentPieces[i]);
        }
        for (var i = 0; i < PlayerPieces.length; ++i) {
            drawPiece(PlayerPieces[i]);
        }
        if (ScreenAnimation != null) {
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
    if ((AnimatingPieces.length > 0) ||
        (AnimatingTiles.length > 0) ||
        (ScreenAnimation != null)) {

        draw();
    }
}