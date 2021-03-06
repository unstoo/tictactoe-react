import React from 'react'
import './App.css';
import Footer from './Footer.js';
import Game from './Game.js';

class App extends React.Component {
  // [] Settings (at least 3): looks, difficulty, [+] player name
  constructor(props) {
    super(props)

    const sounds = {
      music: new Audio("/intro.mp3"),
      gameover:  new Audio("/over.wav"),
      win: new Audio("/win.wav"),
      select: new Audio("/select.wav"),
    }

    const storedState = window.localStorage.getItem("game")

    

    if (storedState) {
      const parsedState = JSON.parse(storedState)
      this.state = parsedState
      
      sounds.music.volume = parsedState.settings.volumes.music / 10
      sounds.gameover.volume = parsedState.settings.volumes.sfx / 10
      sounds.win.volume = parsedState.settings.volumes.sfx / 10
      sounds.select.volume = parsedState.settings.volumes.sfx / 10
      
      this.state.settings.sounds = sounds
    } else {
      this.state = {
        fullScreen: true,
        activeRoot: "/home",
        lastKeyPressed: null,
        home: {},
        game: {
          player: {
            one: {},
            two: {}
          }
        },
        settings: {
          playbackMusic: false,
          volumes: {
            music: 10,
            sfx: 10
          },
          sounds
        },
        scores: [
          { 
            name: "Player 1",
            score: "10 : 7",
            result: "win"
          }
        ]
      }
    }
    
  }

  _handleKey = (e) => {
    console.log(e)
    if (this.state.settings.playbackMusic)  {
      this.state.settings.sounds.music.play()
    } else {
      this.state.settings.sounds.music.pause()
    }

    if (e.code === "F11") {
      e.preventDefault()
      var elem = document.getElementById("app");

      if (document.fullscreenEnabled) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
          elem.msRequestFullscreen();
        }
      } else {
        elem.cancelFullScreen()
      }
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this._handleKey);
  }

  componentDidUpdate() {
    window.localStorage.setItem("game", JSON.stringify(this.state))
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this._handleKey, false);
  }

  switchRoot = (e) => {
    e.preventDefault()
    const activeRoot = "/" + e.target.href.split("/").pop()
    this.setState({
      activeRoot
    })
  }

  saveSettings = (settings) => {
    this.setState({
      settings: Object.assign(this.state.settings, {
        playbackMusic: settings.playbackMusic,
        volumes: settings.volumes
    })
    })
  }

  gameEvents = (e) => {
    const {type, gameState} = e
    console.log(type + '-event');
    if (type === "win") {
      this.state.settings.sounds.win.play()
      window.localStorage.setItem("game", JSON.stringify(
        Object.assign({}, this.state, { game: gameState })
      ))
    }

    if (type === "turn") {
      this.state.settings.sounds.select.play()
      window.localStorage.setItem("game", JSON.stringify(
        Object.assign({}, this.state, { game: gameState })
      ))

      // this.setState({ game: gameState})
      
    }

    if (type === "gameover") {
      this.state.settings.sounds.gameover.play()
      window.localStorage.setItem("game", JSON.stringify(
        Object.assign({}, this.state, { game: gameState })
      ))
    }

    if (type === "reset") {
      window.localStorage.setItem("game", JSON.stringify(
        Object.assign({}, this.state, { game: gameState })
      ))
    }

    if (type === "finishmatch") {  
        let {one, two} = gameState.player
        let matchResult = {}
        matchResult.name = one.name
        matchResult.score = one.score + " : " + two.score
        matchResult.result = one.score > two.score ? "win" : (one.score === two.score ? "tie" : "lose")

          this.setState((state) => {
            if (Array.isArray(state.scores)) {
              let newScores = [...state.scores]
              newScores.push(matchResult)
              return { scores: newScores, lastGameEvent: '' }
            } else {    
              return { scores: [ matchResult ], lastGameEvent: '' }
            }      
          })
    }

    if (type === "save") {
      this.setState({
        game: Object.assign({}, gameState)
      })
    }
      
  }

  handleName = e => {
    let { value } = e.target
    this.setState(state => {
      state.game.player.one.name = value
      return state
    })
  }


  render () {
    return <div className="App" id="app">
      <nav className="navigation">
        <ul className="navigation--list">
          <li><a onClick={this.switchRoot} className="navigation--item" href="/home">Home</a></li>
          <li><a onClick={this.switchRoot} className="navigation--item" href="/game">Game</a></li>
          <li><a onClick={this.switchRoot} className="navigation--item" href="/settings">Settings</a></li>
        </ul>
        <div>{this.state.lastKeyPressed}</div>
      </nav>
      <main className="mainScreen">
        <Switch root={this.state.activeRoot} >
          <Root path="/home">
            <div className="home">
              <div className="homeWrapper">
                <div className="nameWrapper">
                  <div className="nameText" >Enter your name:</div>
                  <input className="nameInput" onChange={this.handleName} type="text" value={this.state.game.player.one.name || ""} />
                </div>
                <ScoresTable scores={this.state.scores}/>
              </div>
            </div>
            {/* {this.state.scores.map(record => <div>{JSON.stringify(record)}</div>)} */}
          </Root>
          <Root path="/game">
            <Game savedGame={this.state.game} gameEvents={this.gameEvents}/>
          </Root>
          <Root path="/settings">
            <Settings saveSettings={this.saveSettings} 
              sounds={this.state.settings.sounds} 
              playbackMusic={this.state.settings.playbackMusic} 
              volumes={this.state.settings.volumes}/>
          </Root>
        </Switch>
      </main>
      <Footer/>
    </div>
  }
}


const ScoresTable = ({ scores }) => {
  return (
    <div className="scoresTable">
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Score</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((entry, i) => {
            return <tr key={i}>
              <td>{entry.name}</td>
              <td>{entry.score}</td>
              <td>{entry.result}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  )
}
const Settings = (props) => {
  return (
    <div className="settings">
      <br/>
      <Music {...props}/>
    </div>
  )
}

const Switch = ({children, root}) => {
  let selectedComponent = <div>Root 404: { root }</div>

  children.forEach(child => {
    if (child.props.path === root)
      selectedComponent = child
  })
    
  return selectedComponent
}

const Root = ({children, path}) => {
  return children
}

class Music extends React.Component {
  constructor(props) {
    super(props)
    const {sounds, playbackMusic, volumes} = props
    this.state = { 
      sounds,
      music: playbackMusic ? playbackMusic : false,
      volumes
    }

  this.state.sounds.music.loop = true
  }

  componentDidMount() {
    for (const sfx in this.state.sounds) {
      if (Object.hasOwnProperty.call(this.state.sounds, sfx)) {
        this.state.sounds[sfx].addEventListener('ended', () => this.setState({ [sfx]: false })) 
      }
    }

    (this.state.music) ? this.state.sounds.music.play() : this.state.sounds.music.pause()
  }

  componentWillUnmount() {
    for (const sfx in this.state.sounds) {
      if (Object.hasOwnProperty.call(this.state.sounds, sfx)) {
        this.state.sounds[sfx].removeEventListener('ended', () => this.setState({ [sfx]: false })) 
      }
    }

    this.props.saveSettings({
      volumes: this.state.volumes,
      playbackMusic: this.state.music
    })
  }

  togglePlay = (e, sound) => {
    this.setState({ [sound]: !this.state[sound] }, 
      () => {
      this.state[sound] ? this.state.sounds[sound].play() : this.state.sounds[sound].pause();
    });
  }

  changeMusicVolume = e => {
    const volume = [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1][e.target.value]
    let { music, win, gameover, select } = this.state.sounds
    music.volume = volume

    this.setState({ 
      volumes: { 
        music: e.target.value,
        sfx: this.state.volumes.sfx
      },
      sounds: {
        win,
        gameover,
        select,
        music
      }
    })
  }

  changeSfxVolume = e => {
    const volume = [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1][e.target.value]
    let { music, win, gameover, select } = this.state.sounds
    win.volume = volume
    gameover.volume = volume
    select.volume = volume

    this.state.sounds.select.play()
    this.setState({ 
      volumes: { 
      sfx: e.target.value,     
      music: this.state.volumes.music
      },
      sounds: {
        win,
        gameover,
        select,
        music
      }
    })
  }

  render() {
    return (
      <div>
        <div>
          <div>
            Music: <button onClick={(e, sound = "music") => this.togglePlay(e, sound)}>{this.state.music ? 'Pause' : 'Play'}</button>  
          </div> 
          <div>
          <input onChange={this.changeMusicVolume} value={this.state.volumes.music} type="range" min="0" max="10" className="slider" id="musicRange" />
          </div>
        </div>
        <hr/>
        <div>
          <div>
            SFX Volume:
          </div>
          <div>
            <input onChange={this.changeSfxVolume} value={this.state.volumes.sfx} type="range" min="0" max="10" className="slider" id="sfxRange" />
          </div>
          </div>
      </div>
    );
  }
}


export default App;
