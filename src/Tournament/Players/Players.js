import React, { Component } from 'react'
import './Players.css'

class TournamentPlayers extends Component {
  renderPlayers(players) {
    const elements = []
    players.forEach((item) => {
      elements.push(<div key={ item._id } className="player">{ item.name }</div>)
    })

    return elements
  }

  render() {
    const players = this.props.players
    if (!players) return null
      
    const numPlayersString = players ? ' (' + players.length + ')' : '' 

    return (
      <div className={ this.constructor.name }>
        <div className="title">Players { numPlayersString }</div>
        { players && this.renderPlayers(players) }
      </div>
    )
  }
}

export default TournamentPlayers
