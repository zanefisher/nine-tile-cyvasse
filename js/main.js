// Initialize local storage, save/load interface, new player message.

if (localStorage.games == undefined) {
    localStorage.games = "[]";
} else {
    var games = JSON.parse(localStorage.games);
    if (games.length > 0) {
        for (var i = 0; i < games.length; ++i) {
            LoadGameSelect.innerHTML += "<option>" + games[i].name + "</option>";
        }
    }
}

if (localStorage.boards == undefined) {
    localStorage.boards = "[]";
} else {
    var boards = JSON.parse(localStorage.boards);
    if (boards.length > 0) {
        for (var i = 0; i < boards.length; ++i) {
            LoadBoardSelect.innerHTML += "<option>" + boards[i].name + "</option>";
            OpponentSelect.innerHTML += "<option>" + boards[i].name + "</option>";
        }
    }
}

if (localStorage.newPlayer == undefined) {
    localStorage.newPlayer = true;
}


// Ensure art is loaded.

var artLoaded = 0;

function beginIfArtLoaded() {
    if (++artLoaded == pieceArt.length) {
        begin();
    }
}

for (var i = 0; i < pieceArt.length; ++i) {
    var image = pieceArt[i];
    if (image.complete && (image.naturalWidth > 0))  {
        ++artLoaded;
    } else {
        pieceArt[i].onload = beginIfArtLoaded;
    }
}
if (artLoaded == pieceArt.length) {
    begin();
} else {
    setPhase(phase.loading);
}


// Begin.

function begin() {
    if (localStorage.autosave == undefined) {
        setUpTiles();
        setMode(mode.setup);
        setPhase(phase.placeKingsTile);
    } else {
        restoreGameState(JSON.parse(localStorage.autosave));
        localStorage.removeItem("autosave");
    }
    drawTerrainThumbails();
    draw();
    setInterval(redrawCanvasWhenAnimated, redrawInterval);
}


// Autosave

window.addEventListener("beforeunload", function(event) {
    if (phase.current >= phase.placeKing) {
        localStorage.autosave = JSON.stringify(getGameState());
    }
});