// Every one-space step on the hex coordinate system.
var unitMoves = [{x: 1, y: 1},
                {x: 1, y: 0},
                {x: 0, y: -1},
                {x: -1, y: -1},
                {x: -1, y: 0},
                {x: 0, y: 1}];

// Sum of the x and y values of two objects.
function sumPos(left, right) {
    return {x: left.x + right.x, y: left.y + right.y};
}

// Difference of the x and y values of two objects.
function diffPos(left, right) {
    return {x: left.x - right.x, y: left.y - right.y};
}

// Determine whether the given hex coordinate exists on the board.
function hexInBounds(x, y) {
    return (Math.abs(x - y) < 5) &&
        (x >= 0) &&
        (x < 12) &&
        (y >= 0) &&
        (y < 12);
}

// Determine the X position (left side) of a square at the given hex
// coordinates.
function hexPosX(x, y) {
    return ((x + y) * (SquareSize / 2)) + LeftMargin;
}

// Determine the Y position (top) of a square at the given hex coordinates.
function hexPosY(x, y) {
    return ((4 - (y - x)) * SquareSize) + TopMargin;
}

// Determine the position (top left corner) of a square at the given hex
// coordinates.
function hexPos(x, y) {
    return {x: ((x + y) * (SquareSize / 2)) + LeftMargin,
            y: ((4 - (y - x)) * SquareSize) + TopMargin};
}

// Determine the hex that the given canvas location is within.
function hexAtPos(x, y) {
    var tileY = Math.floor((y - TopMargin) / SquareSize);
    var offset = (4 - tileY) * (SquareSize/2);
    var tileX = Math.floor(((x - offset) - LeftMargin) / SquareSize);
    return {x: tileX, y: tileX + (4 - tileY)};
}

// Convert hex coordinates to an index on the board array.
function hexToIndex(x, y) {
    switch(x - y + 4) {
    case 0:
        return x - 0;
    case 1:
        return x + 8;
    case 2:
        return x + 17;
    case 3:
        return x + 27;
    case 4:
        return x + 38;
    case 5:
        return x + 49;
    case 6:
        return x + 59;
    case 7:
        return x + 68;
    case 8:
        return x + 76;
    }
}

// Convert an index on the board array to hex coordinates.
function indexToHex(i) {
    var hex = {x: -1, y: -1};
    if ((i >= 0) && (i < 8)) {
        hex.x = i;
        hex.y = i + 4;
    } else if (i < 17) {
        hex.x = i - 8;
        hex.y = i - 5;
    } else if (i < 27) {
        hex.x = i - 17;
        hex.y = i - 15;
    } else if (i < 38) {
        hex.x = i - 27;
        hex.y = i - 26;
    } else if (i < 50) {
        hex.x = i - 38;
        hex.y = i - 38;
    } else if (i < 61) {
        hex.x = i - 49;
        hex.y = i - 50;
    } else if (i < 71) {
        hex.x = i - 59;
        hex.y = i - 61;
    } else if (i < 80) {
        hex.x = i - 68;
        hex.y = i - 71;
    } else if (i < 88) {
        hex.x = i - 76;
        hex.y = i - 80;
    }
    return hex;
}

// Determine whether the point (x, y) is within the given rectangle.
function posInBounds(x, y, boundX, boundY, width, height) {
    return (x > boundX) && (x < boundX + width) && (y > boundY) && (y < boundY + height);
}

// Distance between two points on a 2d plane
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

// Distance between two hex coordinates
function hexDistance(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    if ((dx * dy) > 0) {
        return (Math.abs(dx + dy) + Math.abs(dx - dy)) / 2;
    } else {
        return Math.abs(dx - dy);
    }
}