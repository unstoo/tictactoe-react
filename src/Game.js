import React from 'react'
import './App.css';

// rows
const row0 = [[0,0], [0,1], [0,2]]
const row1 = [[1,0], [1,1], [1,2]]
const row2 = [[2,0], [2,1], [2,2]]
// columns
const col0 = [[0,0], [1,0], [2,0]]
const col1 = [[0,1], [1,1], [2,1]]
const col2 = [[0,2], [1,2], [2,2]]
// diagonals
const diag0 = [[0,0], [1,1], [2,2]]
const diag1 = [[2,0], [1,1], [0,2]]
const combinations = [row0, row1, row2, col0, col1, col2, diag0, diag1]

const initState = (props) => {
  return {
    hotkeyCell: [1, 1],
    isGameActive: true,
    isTie: false,
    lastGameEvent: '',
    autoTurnIsRunning: false,
    MAX_TURNS: 9,
    activePlayer: "X",
    PLAYER_ONE: "X",
    PLAYER_TWO: "O",
    turns_count: 0,
    player: {
      one: {
        name: props.playerName || "Player 1",
        symbol: "X",
        score: 0
      },
      two: {
        name: "Computer",
        symbol: "O",
        score: 0
      }
    },
    winningCoords: [],
    board: [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ],
    combinations: combinations
  }
}

const getCleanBoard = () => [
  [null, null, null],
  [null, null, null],
  [null, null, null]
]

class Game extends React.Component {
  constructor(props) {
    super(props)
    const { savedGame } = props
    if (savedGame.board) {
      this.state = Object.assign(initState(props), savedGame)
    } else {
      this.state = initState(props)
    }
  }

  componentDidMount = () => {
    document.addEventListener("keydown", this._handleKey, false);
  }

  _handleKey = (e) => {
    if (e.key === "ArrowUp") {
      this.setState(state => {
        let [row, col] = state.hotkeyCell
        row -= 1
        row = row > 0 ? row : 0
        return {
          hotkeyCell: [row, col]
        }
      })
    }
    if (e.key === "ArrowDown") {
      this.setState(state => {
        let [row, col] = state.hotkeyCell
        row += 1
        row = row < 2 ? row : 2
        return {
          hotkeyCell: [row, col]
        }
      })
    }
    if (e.key === "ArrowLeft") {
      this.setState(state => {
        let [row, col] = state.hotkeyCell
        col -= 1
        col = col > 0 ? col : 0
        return {
          hotkeyCell: [row, col]
        }
      })
    }
    if (e.key === "ArrowRight") {
      this.setState(state => {
        let [row, col] = state.hotkeyCell
        col += 1
        col = col < 2 ? col : 2
        return {
          hotkeyCell: [row, col]
        }
      })
    }

    if (e.code === "Space") {
      let turnIndex = this.state.hotkeyCell.join(",")
      this.handleTurn({ target: {
        value: turnIndex
      }})
    }
  }

  componentDidUpdate = (prevProps, prevState) => {
    // Launch auto-turn
    if (this.state.isGameActive && !this.state.autoTurnIsRunning &&
        this.state.activePlayer === this.state.PLAYER_TWO) {
        this.setState({ autoTurnIsRunning: true }, () => {
          setTimeout(this.makeAutoTurn.bind(this), 1000)
        })
      }
    
    let event = this.state.lastGameEvent

    if (['gameover', 'win', 'turn', 'reset'].includes(event)) {
      this.setState({ lastGameEvent: "" }, () => {
        let stateForSave = Object.assign({}, this.state)
        this.props.gameEvents({ type: event, gameState: stateForSave })
      }) 
    }

    if (event ===  'finishmatch') {
      this.setState({ lastGameEvent: "" }, () => {
        let stateForSave = Object.assign({}, prevState)
        stateForSave.lastGameEvent = ''
        stateForSave.activePlayer = this.state.activePlayer
        this.props.gameEvents({ type: event, gameState: stateForSave })
      })
    }
  }

  componentWillUnmount = () => {
    this.props.gameEvents({ 
      type: 'save',
      gameState: this.state
     })
  }

  toggleActivePlayer = () => {
    const {activePlayer, PLAYER_ONE, PLAYER_TWO} = this.state
    return activePlayer === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE
  }

  makeAutoTurn = () => {
    const [rowIndex, cellIndex] = this.getRandomTurn()

    this.setState((state, props) => {
      let newState = Object.assign({}, state)
      newState.autoTurnIsRunning = false

      // Mark board
      newState.board[rowIndex][cellIndex] = newState.activePlayer
      newState.turns_count += 1

      // Check for winning combinations
      const [someoneHasWon, winningCoords] = this.checkCombinations(newState.board)

      if (someoneHasWon) {
        let twoScore = newState.player.two.score
        let { one } = newState.player

        if (newState.player.two.symbol === newState.activePlayer) {
          twoScore += 1
        }
          
        newState = {
          lastGameEvent: 'gameover',
          winningCoords,
          isGameActive: false,
           player: {
             one,
             two: {
               score: twoScore,
               symbol: "O",
               name: "Computer"
             }
           }
         }

        return newState
      }

      // Check for a tie
      newState.activePlayer = this.toggleActivePlayer()
      if (newState.turns_count === state.MAX_TURNS) {
        newState.isGameActive = false
        newState.isTie = true
      }
      
      newState.lastGameEvent ='turn'
      return newState
    })
  }

  handleTurn = (e) => {  
    const [rowIndex, cellIndex] = e.target.value.split(",")
    this.setState((state, props) => {
      if (!state.isGameActive || state.isTie) return null
      // Wait for auto-turn
      if (state.activePlayer === state.PLAYER_TWO) return null
      // Ignore taken cells
      if (state.board[rowIndex][cellIndex] !== null) return null

      let newState = Object.assign({}, state)

      // Mark board
      newState.board[rowIndex][cellIndex] = state.activePlayer
      newState.hotkeyCell = [Number(rowIndex), Number(cellIndex)]
      newState.turns_count++

      // Check for winning combinations
      const [someoneHasWon, winningCoords] = this.checkCombinations(newState.board)

      if (someoneHasWon) {
        newState.isGameActive = false
  
        if (newState.player.one.symbol === newState.activePlayer) {
          newState.player.one.score += 1
        }
  
        if (newState.player.two.symbol === newState.activePlayer) {
          newState.player.two.score += 1
        }

        newState.winningCoords = winningCoords
        newState.lastGameEvent ='win'
        

        return newState
      }

      // Check for a tie
      newState.activePlayer = this.toggleActivePlayer()
      if (newState.turns_count === state.MAX_TURNS) {
        newState.isGameActive = false
        newState.isTie = true
      }
      
      newState.lastGameEvent ='turn'
      return newState
    })
  }

  checkCombinations = (board) => {
    let threeInRow = false
    const {combinations} = this.state
    for (let index = 0; index < combinations.length; index++) {
      const lineToCheck = []
      const coordsToCheck = []
      combinations[index].forEach(([row, column]) => {
        const cell = board[row][column]
        lineToCheck.push(cell)
        coordsToCheck.push([row, column])
      })
  
      threeInRow = this.cellsAreEqual(lineToCheck)

      if (threeInRow) {
        return [threeInRow, coordsToCheck]
      }
    }

    return [threeInRow, null]
    
  }

  cellsAreEqual = (array) => {
    const uniqueItems = [...new Set(array)]
    if (uniqueItems.includes(null)) return false
    return (uniqueItems.length === 1) ? true : false 
  }

  getRandomTurn = () => {
    const cells = [...row0, ...row1, ...row2]
    let index = parseInt(Math.random()*10%9)
    let [rowIndex, cellIndex] = cells[index]
    let selectedCell = this.state.board[rowIndex][cellIndex]
    while (selectedCell) {
      index = parseInt(Math.random()*10%9)
      rowIndex = cells[index][0] 
      cellIndex = cells[index][1]
      selectedCell = this.state.board[rowIndex][cellIndex]
    }
    return [rowIndex, cellIndex, selectedCell]
  }

  isPlayerOneActive = () => {
    return this.state.player.one.symbol === this.state.activePlayer
  }

  resetGame = () => {
    if (!this.state.isGameActive) {
      let activePlayer = this.state.isTie ? this.toggleActivePlayer() : this.state.activePlayer

      this.setState({
        lastGameEvent: 'reset',
        isGameActive: true,
        isTie: false,
        autoTurnIsRunning: false,
        board: getCleanBoard(),
        winningCoords: [],
        turns_count: 0,
        activePlayer
      })
    }
  }

  finishMatch = () => {
      this.setState((state) => {
        if (!state.isGameActive) {
          let activePlayer = state.player.one.symbol
          let playerOne = {...state.player.one}
          let playerTwo = {...state.player.two}
          playerOne.score = 0
          playerTwo.score = 0

          return {
            lastGameEvent: 'finishmatch',
            isGameActive: true,
            isTie: false,
            autoTurnIsRunning: false,
            board: getCleanBoard(),
            winningCoords: [],
            turns_count: 0,
            activePlayer,
            player: {
              one: playerOne,
              two: playerTwo
            }
          }
        }  
    })

  }

  render() {
    
    return (
      <div className="game">
        <div className="scoresRow">
          <div className={this.isPlayerOneActive() ? "player playerActive" : "player"}>
              <div className="playerName">{ this.state.player.one.name }</div>
              <div className="playerSymbol">{ this.state.player.one.symbol }</div> 
          </div>

          <div className="scores">
            <div>Score</div>
            <div>{this.state.player.one.score + " : " + this.state.player.two.score }</div>
          </div>

          <div className={!this.isPlayerOneActive() ? "player playerActive" : "player"}>
            <div className="playerName">{ this.state.player.two.name }</div>   
            <div className="playerSymbol">{ this.state.player.two.symbol }</div>
          </div>
        </div>
        <div className="gameRow">
         
          <div className="board">
            {this.state.board.map((row, rowIndex) => {
              return <div key={rowIndex} className="boardRow">
                { row.map((cell, cellIndex) => {
                let cellClass = "boardCell"
                if (an.array(this.state.winningCoords).includes([rowIndex, cellIndex])) {
                  cellClass += " highlightedCell"
                }

                if (this.state.hotkeyCell[0] === rowIndex && this.state.hotkeyCell[1] === cellIndex) {
                  cellClass += " hotkeyCell"
                }
                return <button 
                key={rowIndex+'-'+cellIndex} 
                className={cellClass} 
                onClick={this.handleTurn} 
                value={[rowIndex, cellIndex]}>{cell}</button>
              } )}
              </div>
            })}
          </div>

          
        </div>

       <div className="gameControls">
       { this.state.isGameActive && <button onClick={this.resetGame} disabled>New round</button>}
        { !this.state.isGameActive && <button onClick={this.resetGame}>New round</button>}
        { this.state.isGameActive && <button onClick={this.finishMatch} disabled>Finish match</button>}
        { !this.state.isGameActive && <button onClick={this.finishMatch}>Finish match</button>}
        { this.state.isTie && <div>It's a tie!</div>}
        {/* <button onClick={this.makeAutoTurn}>Auto turn</button> */}
       </div>
        
      </div>
    )
  }
}

let an = {
  _arrA: null,
  _arrB: null,

  array: function(arr) {
    this._arrA = arr || []
    return this
  },

  includes: function(arr) {
    this._arrB = arr
    
    for (let index = 0; index < this._arrA.length; index++) {
      if (
      this._arrA[index][0] === this._arrB[0] &&
      this._arrA[index][1] === this._arrB[1]
      ) return true    
    }

    return false
  }
}

export default Game;
