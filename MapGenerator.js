//variables
//each boundary is either a wall, door or non existant
var openBound = 0;
var doorBound = 1;
var wallBound = 2;
//canvas size. I set it to my computer screen, but it may show up differently for different users.
var widthCanvas = 110;
//if you expand the height, the map builds much quicker, but often relies on you to use a scrollbar on the side to view entire map.
var heightCanvas = 80;
//a 'tile' is a single square or unit on the canvas. like tiles on a floor
var minTilesRoom = 4;
var maxTilesRoom = 10;
//I want 50 rooms per level. try 100, it takes 20 seconds to load, but it's fun. ;p
var quantRoomsCanvas = 50;
//create variables for adjacent coordinates when using functions {compass letters}
var n = {x: 0, y: 1};
var e = {x: 1, y: 0};
var s = {x: 0, y: -1};
var w = {x: -1, y: 0};
//create list of directions
var directions = [n,e,s,w];
//initialize map to return false until it is reassigned.
var map = null;
//while map is null, keep trying to build it. Once it is built successfully, return map to break loop.
while (!map) {
  //create blank map(this is in the loop so it can 'restart' the map every time it fails.)
	map = mapInit();
  //fill it with rooms. If this fails, it will return null or false to make loop start over.
	map = mapCreate(map);
}
//create variable to find canvas for adding things to it
var canvas = document.getElementById("map");
//display map
render(map, canvas);
// blank map
function mapInit() {
    //create blank grid to put map on. Use 3DArray to do this. Format: Array[x coordinate][y coordinate].
    var mapGrid = [];
		//for the length(widthCanvas) of a row create a placeholder.
    for (var x = 0; x < widthCanvas; x++) {
        //add each placeholder to mapGrid
        mapGrid[x] = [];
        //for each row in mapGrid, create a column
        for (var y = 0; y < heightCanvas; y++) {
            //initialize boundaries for each tile to avoid undefined errors later.
            mapGrid[x][y] = {
                //ID to differentiate between individual rooms. false means a room has not been created yet.
                roomNum: false,
                //ID for tiles within rooms
                tileNum: null,
                //boundaries of the room
                boundary: {}
            }
        }
    }
    //return blank map with grid set up
    return mapGrid;
}
//add rooms to map
function mapCreate(map) {
    // 'architect' is where it starts creating tiles
    var architect = {
        //start in middle of map.
        x: Math.floor(widthCanvas/2),
        //math.floor rounds down in the event of an uneven number being halved into a decimal
        y: Math.floor(heightCanvas/2)
    }
		//create shadows of architect to record preious locations.(this is so if he gets stuck, he can backtrack)
		var archShadow = [];
		// An array with all rooms and the number of tiles in each room
    var allRoomsQuantTiles = [];
    //for number of rooms defined in quantRoomsCanvas {create a room}
    for (var roomNum = 0; roomNum < quantRoomsCanvas; roomNum++) {
        //for each room, randomly generate number of tiles between min and max values set earlier
        var quantTiles = Math.floor((Math.random() * (maxTilesRoom + 1 - minTilesRoom)) + minTilesRoom);
        // list of tiles in current room
        var roomTiles = [];
        //for each tile expected in this room {crete a tile}
        for (var tileNum = 1; tileNum <= quantTiles; tileNum++) {
            //create a tile
            var tile = map[architect.x][architect.y];
            //add the new tile to list of tiles in this room
            roomTiles.push({
                //gets long coordinate
                x: architect.x,
                //get lateral coordinate
                y: architect.y
            });
            //which room it's in
            tile.roomNum = roomNum;
            //give individual tile IDs for each tile. Use this to keep track of how many tiles are in each room.
            tile.tileNum = tileNum;
            //shade will store architect coordinates before architect moves.
						archShadow.push(architect);
						//move 'architect' for creating next tile.
            architect = moveArchitect(map, architect);
            //if 'architect' can't create a new tile, look at shadows in room.
            if (!architect && tileNum>1) {
								//since last shadow made was of a failed coordinate, remove it.
								archShadow.slice(-1,1);
								//for each shadow in current room, check for empty boundaries to create another tile.
								for (var shadowTile = 1; shadowTile <= tileNum; shadowTile ++){
							  		//log frequency and try from another tile.
                		console.log("Architect can't build. Backtracking.");
										//make architect backtrack.[length-shadowTile] will keep looking back to previous shadows starting from most recent.
										findShadow = archShadow[archShadow.length-shadowTile];
										//move architect back one space to try building from a different tile.
										architect = moveArchitect(map, findShadow)
										//if architect is successful, break the loop
										if (architect){
												//break loop so loop doesn't overwrite successfully built tile.
												break;
										}
								}
						}
						//if architect is stuck and can't create a tile from backtracking
						if (!architect) {
								//log frequency and Start map over.
            		console.log("Architect is stuck. Starting over.");
            		//returnfalse so building can start over
            		return false;
            }
        }
        //loop through tiles in room to create walls on sides without unadjacent tiles
        for (var roomTile = 0; roomTile < roomTiles.length; roomTile++){
          //send 'map' so it can find the canvas and the current tile to run a check on it.
          createWalls(map, roomTiles[roomTile], roomNum, roomTiles);
        }
        //add the list of all tiles in this room to the list of rooms
        allRoomsQuantTiles[roomNum] = roomTiles;
        //if (not last room) Move 'architect' to a wall and add door for next room tp connect
        if (roomNum != quantRoomsCanvas-1) {
            //find blank tile to start next room
            architect = findBlank(map, roomTiles);
        }
    }
    //return created map
    return map;
}
// Move 'architect' to an available adjacent tile for creating another tile
function moveArchitect(map, architect) {
    //store coordinates of adjacent tiles
    var adjacents = [n,e,s,w];
    //randomize the order in which architect will check for available spaces to make tiles
    adjacents = shuffle(adjacents);
    //while loop which will keep 'pop'ing directions to try each one. if it runs out of directions, it will end without returning a valid direction
    while (direction = adjacents.pop()) {
        //new position to try
        newStart = {
            //add coordinates of direction{north, east, south or west} to current position to check for existing tiles or boundaries of canvas
            x: architect.x + direction.x,
            y: architect.y + direction.y
        };
				//check if current direction is out of bounds
        if (newStart.x < 0 || newStart.y < 0 || newStart.x >= widthCanvas || newStart.y >= heightCanvas) {
            //log frequency
            console.log("Direction Out of Bounds. Looking Elsewhere.");
            //if out of bounds, try a different direction
            continue;
				}
				//check if current direction is already designed.(roomNum will return false if not designed){if it is, pick a new direction}
				if (map[newStart.x][newStart.y].roomNum){continue}
				//if tile isn't created or out of bounds, it must be available. return the available coordinates.
				return newStart;
				}
		//if loop ends without returning, there isn't an available tile so return false to tell the architect to backtrack and look somewhere else
    return false;
}
//make walls for a room. (load map and room's coordinates)
function createWalls(map, currentTile, roomNum) {
    // if n(up) does NOT have door, check if it needs a wall
    if (map[currentTile.x][currentTile.y].boundary.n != doorBound) {
				//if n is out of bounds OR it's roomnumber doesn't match {make wall}
        if (currentTile.y === 0 || map[currentTile.x][currentTile.y-1].roomNum != roomNum) {
						//make wall
            map[currentTile.x][currentTile.y].boundary.n = wallBound;
				//if it's NOT a door and shouldn't be a wall, it's open
        } else {
						//make it 'open'
            map[currentTile.x][currentTile.y].boundary.n = openBound;
        }
    }
		// if e(right) does NOT have door, check if it needs a wall
    if (map[currentTile.x][currentTile.y].boundary.e != doorBound) {
			//if e is out of bounds OR it's roomnumber doesn't match {make wall}
        if (currentTile.x >= widthCanvas-1 || map[currentTile.x+1][currentTile.y].roomNum != roomNum) {
						//make wall
            map[currentTile.x][currentTile.y].boundary.e = wallBound;
				//if it's NOT a door and shouldn't be a wall, it's open
        } else {
						//make it 'open'
            map[currentTile.x][currentTile.y].boundary.e = openBound;
        }
    }
		// if s(down) does NOT have door, check if it needs a wall
    if (map[currentTile.x][currentTile.y].boundary.s != doorBound) {
			//if s is out of bounds OR it's roomnumber doesn't match {make wall}
        if (currentTile.y >= heightCanvas-1 || map[currentTile.x][currentTile.y+1].roomNum != roomNum) {
						//make wall
            map[currentTile.x][currentTile.y].boundary.s = wallBound;
				//if it's NOT a door and shouldn't be a wall, it's open
        } else {
						//make it 'open'
            map[currentTile.x][currentTile.y].boundary.s = openBound;
        }
    }
		// if w(left) does NOT have door, check if it needs a wall
    if (map[currentTile.x][currentTile.y].boundary.w != doorBound) {
			//if w is out of bounds OR it's roomnumber doesn't match {make wall}
        if (currentTile.x === 0 || map[currentTile.x-1][currentTile.y].roomNum != roomNum) {
						//make wall
            map[currentTile.x][currentTile.y].boundary.w = wallBound;
				//if it's NOT a door and shouldn't be a wall, it's open
        } else {
						//make it 'open'
            map[currentTile.x][currentTile.y].boundary.w = openBound;
        }
    }
}
// checks tiles for blank to start building on
function findBlank(map, tiles) {
		//randomize tiles to increase variations when building.
    tiles = shuffle(tiles);
		//loop through each tile until you run out.
		while (currentTile = tiles.pop()){
				//check if the current tile has an adjacent tile for the architect to begin working on.
			  if (newTile = moveArchitect(map, currentTile)) {
						//since there is an available tile to begin work, start by building a door to the new room
            buildDoor(map, currentTile, newTile);
						//return the coordinates to start on the new room.
            return newTile;
        }
    }
		//if the loop goes through all tiles without finding an available tile to build a new room, return false to start map over.
    return false;
}
// build door between two(adjacent) tiles.
function buildDoor(map, currentTile, newTile) {
		//get tile coordinates from map to change properties of tiles on mapgrid
    var current = map[currentTile.x][currentTile.y];
    var next = map[newTile.x][newTile.y];
		//if currentTile is below newTile
    if (currentTile.y > newTile.y) {
        //create door
        current.boundary.n = doorBound;
        next.boundary.s = doorBound;
		//if currentTile is above newTile
    } else if (currentTile.y < newTile.y) {
				//create door
        current.boundary.s = doorBound;
        next.boundary.n = doorBound;
		//if currentTile is to the right of newTile
    } else if (currentTile.x > newTile.x) {
				//create door
        current.boundary.w = doorBound;
        next.boundary.e = doorBound;
		//if currentTile is to the left of newTile
    } else if (currentTile.x < newTile.x) {
				//create door
        current.boundary.e = doorBound;
        next.boundary.w = doorBound;
    }
}
// Randomize lists
function shuffle(list) {
		//initialize countdown for while loop (negative while loops are usually the fastest performance)
  	var index = list.length;
		//count down from length of list
  	while ( --index ) {
				//pick random number within CURRENT RELEVANT index (each loop decreases maximum relevant index by one)
     		rand = Math.floor( Math.random() * ( index + 1 ) );
				//limo means the value will hang out and watch while it waits to go to it's destination (save CURRENT index value before it gets overwritten)
     		limbo = list[index];
				//overwrite the CURRENT index with the random index chosen from relevant indexes.
     		list[index] = list[rand];
				//replace the random index with the unused value from the original CURRENT index
     		list[rand] = limbo;
  	}
		//return the shuffled list
  	return list;
}
//display map
function render(mapGrid, canvas) {
		//change the size of the display ratio. (default ratio is 12:1)
    var displayRatio = 12;
		//get display size for canvas by multiplying size by ratio
    canvas.width = widthCanvas * displayRatio;
    canvas.height = heightCanvas * displayRatio;
		//get canvas context in 2d format
    var canvasCon = canvas.getContext("2d");
		// make canvas black
    canvasCon.fillStyle = "#000";
		//create canvas as rectangle with coordinates based on height and width parameters set earlier
    canvasCon.fillRect(0, 0, widthCanvas * displayRatio, heightCanvas * displayRatio);
		//set colors for boundaries (walls will be grey)
    var wallColor = "#666";
		//doors will be brown
    var doorColor = "#941";;
		//for each column, get the rows
    for (var x = 0; x < widthCanvas; x++) {
				//for each row, get the tiles
        for (var y = 0; y < heightCanvas; y++) {
						//if currentTile hasn't been created, skip it
            if (!mapGrid[x][y].roomNum) {
                //skip it
                continue;
            }
						//get dimensions of square to fill it in
            var xStart = x*displayRatio;
            var yStart = y*displayRatio;
          	//get roomNumber
            var roomNum = mapGrid[x][y].roomNum;
						//changrate devides the colorChange into 4 stages
						var changeRate = Math.floor(quantRoomsCanvas/4)
						//initialize the rgb color values
						var redChange = 0;
						//using rgb is easier to calculate changes than using hexadecimal calculations
						var greenChange = 0;
						var blueChange = 0;
						//for the last fourth of the rooms, reduce the blue to make them blend from purple to red.
						if (roomNum > changeRate*3){
								//default value will be red
								redChange = 255;
								//blue will decrease at a rate that will go from 100%(255) to 0%(0) by the time it hits the last room
								blueChange = 255 - Math.floor((255/changeRate)*(roomNum-(changeRate*3)));
						//if it's not the last fourth, but it is past the half way point, start adding red to change the blue to purple
						}else if(roomNum > changeRate*2){
								//blue is the default value
								blueChange = 255;
								//add red a rate equal to four times the rate of the room numbers so it will hit 100% red by the 3/4 mark.
								redChange = Math.floor((255/changeRate)*(roomNum-(changeRate*2)));
						//if it isn't the halfway point, but it is past the first quarter, reduce green to blend the colors to blue
						}else if(roomNum > changeRate){
								//the default color is blue
								blueChange = 255;
								//decrease the green from 255 - 0 by the time we hit the half mark
								greenChange = 255 - Math.floor((255/changeRate)*(roomNum-(changeRate)));
						//else, we must be in the first 25% of total rooms
						}else{
								//green is the starting color
								greenChange = 255;
								//start adding blue so it will blend the blue to cyan by the time we hit 25% of rooms
								blueChange = Math.floor((255/changeRate)*(roomNum));
						}
						//mapcolors will take the data from the colorChanges and plug it in for each roomnumber
						mapColors = "rgb(" + redChange + "," + greenChange + "," + blueChange + ")";
						//change the color to the calculated color
            canvasCon.fillStyle = mapColors;
						//fill the correct ammount of pixels at the coordinates for the current tile with the
            canvasCon.fillRect(xStart, yStart, displayRatio, displayRatio);
						//check north boundary to determine what color it should be
            if (mapGrid[x][y].boundary.n === wallBound) {
								//if it's a door, make it brown
                canvasCon.fillStyle = wallColor;
						//if it's 'nothing' or open, make it fit the scheme
            } else if (mapGrid[x][y].boundary.n === openBound) {
								//fill with roomColor
                canvasCon.fillStyle = mapColors;
						//it must be a door (leave the 'if' in there to catch errors when squares are blank)
            } else if (mapGrid[x][y].boundary.n === doorBound) {
								//door color is noticable on map
                canvasCon.fillStyle = doorColor;
            }
						//fill boarder with selected color
            canvasCon.fillRect(xStart+1,yStart,displayRatio-2, 1);
						//check south boundary to determine what color it should be
            if (mapGrid[x][y].boundary.s === wallBound) {
								//if it's a door, make it brown
                canvasCon.fillStyle = wallColor;
						//if it's 'nothing' or open, make it fit the scheme
            } else if (mapGrid[x][y].boundary.s === openBound) {
								//fill with roomColor
                canvasCon.fillStyle = mapColors;
						//it must be a door (leave the 'if' in there to catch errors when squares are blank)
            } else if (mapGrid[x][y].boundary.s === doorBound) {
								//door color is noticable on map
                canvasCon.fillStyle = doorColor;
            }
						//fill boarder with selected color
            canvasCon.fillRect(xStart+1,yStart+displayRatio-1,displayRatio-2, 1);
						//check east boundary to determine what color it should be
            if (mapGrid[x][y].boundary.e === wallBound) {
								//if it's a door, make it brown
                canvasCon.fillStyle = wallColor;
						//if it's 'nothing' or open, make it fit the scheme
            } else if (mapGrid[x][y].boundary.e === openBound) {
								//fill with roomColor
                canvasCon.fillStyle = mapColors;
						//it must be a door (leave the 'if' in there to catch errors when squares are blank)
            } else if (mapGrid[x][y].boundary.e === doorBound) {
								//door color is noticable on map
                canvasCon.fillStyle = doorColor;
            }
						//fill boarder with selected color
            canvasCon.fillRect(xStart+displayRatio-1,yStart+1,1, displayRatio - 2);
						//check west boundary to determine what color it should be
            if (mapGrid[x][y].boundary.w === wallBound) {
								//if it's a door, make it brown
                canvasCon.fillStyle = wallColor;
						//if it's 'nothing' or open, make it fit the scheme
            } else if (mapGrid[x][y].boundary.w === openBound) {
								//fill with roomColor
                canvasCon.fillStyle = mapColors;
						//it must be a door (leave the 'if' in there to catch errors when squares are blank)
            } else if (mapGrid[x][y].boundary.w === doorBound) {
								//door color is noticable on map
                canvasCon.fillStyle = doorColor;
            }
						//fill boarder with selected color
            canvasCon.fillRect(xStart,yStart+1,1, displayRatio - 2);
        }
    }
}
