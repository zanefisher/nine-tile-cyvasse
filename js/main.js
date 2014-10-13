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
    if (++artLoaded == PieceArt.length) {
        begin();
    }
}

for (var i = 0; i < PieceArt.length; ++i) {
    var image = PieceArt[i];
    if (image.complete && (image.naturalWidth > 0))  {
        ++artLoaded;
    } else {
        PieceArt[i].onload = beginIfArtLoaded;
    }
}
if (artLoaded == PieceArt.length) {
    begin();
} else {
    setPhase(Phase.loading);
}


// Begin.

function begin() {
    if (localStorage.autosave == undefined) {
        setUpTiles();
        setMode(Mode.setup);
        setPhase(Phase.placeKingsTile);
    } else {
        restoreGameState(JSON.parse(localStorage.autosave));
        localStorage.removeItem("autosave");
    }
    drawTerrainThumbails();
    draw();
    setInterval(redrawCanvasWhenAnimated, RedrawInterval);
}


// Autosave

window.addEventListener("beforeunload", function(event) {
    if (Phase.current >= Phase.placeKing) {
        localStorage.autosave = JSON.stringify(getGameState());
    }
});