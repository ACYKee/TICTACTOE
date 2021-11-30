/////////////////////////////////
/// GLOBAL VARS
/////////////////////////////////

let playerNumber = null; // 1 or 2, the number of the player
let numPlayers = null; //number of players currently in the game
let bothPlayersOnline = false; //true if two players connected
let gameBoard = null; // when valid it looks ["", "", "", "", "", "", "", "", ""]
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBElA1rpoer7MwwGH9wFqiZUUgMaAO25e0",
    authDomain: "tictactoemulti-ed9d9.firebaseapp.com",
    databaseURL: "https://tictactoemulti-ed9d9-default-rtdb.firebaseio.com",
    projectId: "tictactoemulti-ed9d9",
    storageBucket: "tictactoemulti-ed9d9.appspot.com",
    messagingSenderId: "719314567999",
    appId: "1:719314567999:web:2f2b2e197c9f396e5b898a"
  };

////////////////////////////////////////
/// SETUP, including join and leave game
////////////////////////////////////////

 firebase.initializeApp(firebaseConfig);
 
 //data references to db and listeners
  const numPlayersDB = firebase.database().ref('numPlayers');
  numPlayersDB.on('value', function(data){
	  numPlayers = data.val();
	  console.log("Enter: numPlayersDB.on(" + numPlayers + ")");
	  updateGame();
  });
  
  const gameBoardDB = firebase.database().ref("gameBoard");
  gameBoardDB.on('value', function(data){
	  gameBoard = data.val();
	  console.log("Enter: gameBoardDB.on(" + gameBoard + ")");
	  updateGame();
  });
  
  //get our player number (1 for "X", 2 for "O") and set up new game
  //if we are the 2nd player
   numPlayersDB.once('value', function(data){
	  numPlayers = data.val();
	  console.log("Enter: numPlayersDB.once(" + numPlayers + ")");
  
  
  //if we are the 1st player to join
  if(numPlayers == 0){
	  playerNumber = 1;
	  numPlayersDB.set(1);
  }
  //if we are the 2nd player to join
  else if(numPlayers == 1){
	  playerNumber = 2;
	  numPlayersDB.set(2);
	  
	  //initialize board in firebase to empty
	  gameBoardDB.set(["", "", "", "", "", "", "", "", ""]);
	  
  }
  
  //if game is already full
  else if( numPlayers == 2){
	  showLightBox("Game is full");
  }
  
  //otherwise
  else { 
	  showLightBox("An error has occured");
  }
  
  });
  
  
  //when window is closed update number of players
  window.onunload = function (){
	numPlayersDB.once('value', function(data){
		let numPlayers = data.val();
		numPlayers--;
		if (numPlayers < 0) numPlayers = 0;
		numPlayersDB.set(numPlayers);
	});		
  };//window.onunload
  
  
  
/////////////////////////////////
/// LOGIC
/////////////////////////////////


// updateGame
// updates the user's screen every time there is a change
// in the database
function updateGame() {
  console.log("ENTER: updateGame()");
	//if lightbox is visible then do nothing for now
  if(document.getElementById("lightbox").className == "unhidden"){
	 return;
  }
  
	// show any changes to gameBoard
	drawGameBoard();
	
	//detect state change and take non-final actions
	if (bothPlayersOnline == false && numPlayers == 2){
		bothPlayersOnline = true;
	}
	//detect state change and take final actions
	// if one of 2 players disconnects
	if(bothPlayersOnline == true && numPlayers == 1){
		let changePlayerMessage = "";
		bothPlayersOnline = false;
		
		//if player 1 disconnected
		if(playerNumber == 2){
			playerNumber == 1;
			changePlayerMessage = " You are now X."
		}
		showLightBox("The other player has left the game. " + changePlayerMessage);
		return;
	};
	
	//player 2 has not yet connected
	if(numPlayers == 1 ){
		setMessage("Waiting for other player to join.");
		return;
	}
	
	//just in case, not likely to be used
	if(gameBoard == null){
		setMessage("Waiting for game to start");
		return;
	}
	// check win or loss
	let winner = checkWin(); // determine a winner
	if (winner != null){
		if(winner == playerNumber){
			showLightBox("You Win!");
		}else { 
			showLightBox("You Lose!");
		}
		//reset gameboard
		gameBoardDB.set(["", "", "", "", "", "", "", "", ""]);
		return;
	}// if winner
	
	// if 9 turs taken with no win, it's a tie
	if (getNumTurns() == 9){
		showLightBox("Tie!");
		gameBoardDB.set(["", "", "", "", "", "", "", "", ""]);//reset gameboard
		return;
	} // if tie
	
	
	
	// give instructions to user
	if(isMyTurn()){
		setMessage("You are " + playerSymbol() + ". Your turn");
	} else {
		setMessage("You are " + playerSymbol() + ". Waiting for opponent");
	}
}// updateGame

// take player turn 
// is called each time either player clicks a box in the board
// e is the block (or element) in the board that was clicked by the user
function playerTakeTurn(e) { 
  console.log("ENTER: playerTakeTurn(), element " + 
  toNumber(e.id) + " clicked.");
  
  //if we are not in a state that a turn can be taken
  if(document.getElementById("lightbox").className == "unhidden" ||
	playerNumber == null || 
	gameBoard == null || 
	numPlayers != 2) {
	return;  
  }
  
  //if it's this player's turn, do a turn
  if(isMyTurn()){

	  //if e is empty allow the turn
	  if(e.innerHTML == ""){
		  e.innerHTML = playerSymbol(); // show symbol on this play's screen
		  
		  
		  // save the change to the local board array
		  gameBoard[toNumber(e.id) -1] = playerSymbol();
		  
		  //push gameBoard to firebase
		  gameBoardDB.set(gameBoard);
	  }// if the element is empty
	  
	  //otherwise say box is selected
	  else { 
	  showLightBox("This box is already selected, please try another");
	  
	  }
  }// if it's my turn
  
  //otherwise say it's not your turn
  else {
	  showLightBox("It's not your turn, wait for the opponent to move.");
  }
} // playerTakeTurn 

////////////////////////////////////////
/// UTILITY FUNCTIONS (no data changes)
////////////////////////////////////////

//check for a win, there are 8 win possibilities
function checkWin(){
	if (gameBoard != null){
		
		// Top Row
		if(gameBoard[0] != "" && gameBoard[0] == gameBoard[1] && gameBoard[1] == gameBoard[2]){
			if(gameBoard[0] == "X") return 1;
			else return 2;
		}
		if(gameBoard[3] != "" && gameBoard[3] == gameBoard[4] && gameBoard[4] == gameBoard[5]){
			if(gameBoard[3] == "X") return 1;
			else return 2;
		}
		if(gameBoard[6] != "" && gameBoard[6] == gameBoard[7] && gameBoard[7] == gameBoard[8]){
			if(gameBoard[6] == "X") return 1;
			else return 2;
		}
		if(gameBoard[0] != "" && gameBoard[0] == gameBoard[3] && gameBoard[3] == gameBoard[6]){
			if(gameBoard[0] == "X") return 1;
			else return 2;
		}
		if(gameBoard[1] != "" && gameBoard[1] == gameBoard[4] && gameBoard[4] == gameBoard[7]){
			if(gameBoard[1] == "X") return 1;
			else return 2;
		}
		if(gameBoard[2] != "" && gameBoard[2] == gameBoard[5] && gameBoard[5] == gameBoard[8]){
			if(gameBoard[2] == "X") return 1;
			else return 2;
		}
		if(gameBoard[0] != "" && gameBoard[0] == gameBoard[4] && gameBoard[4] == gameBoard[8]){
			if(gameBoard[0] == "X") return 1;
			else return 2;
		}
		if(gameBoard[2] != "" && gameBoard[2] == gameBoard[4] && gameBoard[4] == gameBoard[6]){
			if(gameBoard[2] == "X") return 1;
			else return 2;
		}
	}

}// check Win

// get number of turns taken from gameboard
function getNumTurns(){
	if(gameBoard != null){
		let count = 0;
		for(let i = 0; i < gameBoard.length; i++){
			if(gameBoard[i] != "") count++;
		}
		return count;
	}
}//getNumTurns


//check to see if i is the current player's turn
// if the board has an evne number of symbols, it's 1's turn
// otherwise it's 2's turn

function isMyTurn(){
	//even number of turns
	if(getNumTurns() % 2 == 0){
		if(playerNumber == 1) return true;
		else return false;
	}
	
	//odd number of turns
	else{
	 if(playerNumber == 1) return false;
	 else return true
	}
	
}//isMyTurn


// returns this player's symbol
// player 1 is X, player 2 is O
function playerSymbol() {
  if (playerNumber == 1)
    return ("X");
  else if (playerNumber == 2)
    return("O");
  else
    return "E"; //Meaning "Error"
}

// convert from name of element to number of element
function toNumber(str) {
  let number = 0; 
  switch (str) {
    case "one": number = 1; break;
    case "two": number = 2; break; 
    case "three": number = 3; break; 
    case "four": number = 4; break; 
    case "five": number = 5; break; 
    case "six": number = 6; break; 
    case "seven": number = 7; break; 
    case "eight": number = 8; break; 
    case "nine": number = 9; break;  
  }
  return number; 
} // toNumber

// convert from element number to name
function toString(number) {
  let str = ""; 
  switch (number) {
    case 0: str = "one"; break;
    case 1: str = "two"; break;
    case 2: str = "three"; break;
    case 3: str = "four"; break;
    case 4: str = "five"; break;
    case 5: str = "six"; break;
    case 6: str = "seven"; break;
    case 7: str = "eight"; break;
    case 8: str = "nine"; break;
     
  }
  return str; 
} // toString

////////////////////////////////////////
/// DISPLAY FUNCTIONS (no data changes)
////////////////////////////////////////


// draw the gameboard on the screen
function drawGameBoard() {
  //draw Game Board
  if(gameBoard != null) {
    for (let i = 0; i < gameBoard.length; i++) {
        e = document.getElementById(toString(i));   
        e.innerHTML = gameBoard[i];
    }
  }
}

// updates message above gameBoard
function setMessage(message){
  let messageElement = document.getElementById('gameMessage');
  messageElement.innerHTML = message;
} // setMessage

// change the visibility of ID
// requires the css classes hidden and unhidden to be defined
// in the css file
function changeVisibility(divID) {
  var element = document.getElementById(divID);
 
  // if element exists, it is considered true
  if (element) {
    element.className = (element.className == 'hidden') ? 'unhidden' : 'hidden';
  } // if 
} // changeVisibility

// display message in lightbox
function showLightBox(message) {
  // set message
  document.getElementById("message").innerHTML = message;
  
  // show lightbox 
  changeVisibility("lightbox");
  changeVisibility("boundaryMessage");
  
} // showLightBox

// close light box
function continueGame() {
  //don't let them close the lightbox if the init did not finish correctly.
  if(playerNumber == null)
    return;
  changeVisibility("lightbox");
  changeVisibility("boundaryMessage");
  updateGame(); //do any updates that are needed. They may have been ignored while the lightbox was visible;
} // continueGame

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}