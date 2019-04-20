import React, { Component } from 'react'
import './Teams.css'

import $ from 'jquery'

class TournamentTeams extends Component {
  constructor() {
    super ()
    this.addListeners()
  }

  addListeners() {
    this.toggleImages = () => {
      $('.team-image').toggleClass('visible')
    }
  }

  getPlayerById(id) {
    return this.props.players.filter((player) => {
      return player._id === id
    })[0]
  }

  renderTeams(teams) {
    const elements = []
    teams.forEach((item) => {
      const player1 = this.getPlayerById(item.playerId1)
      const player2 = this.getPlayerById(item.playerId2)

      if(!player1 || !player2) return ''
      elements.push(
        <div key={ item._id } className="team">
          <div className="team-name">{ item.name }</div>
          <div className="team-players">
            <div className="team-player">{ player1.name }</div>
            <div className="team-and">and</div>
            <div className="team-player">{ player2.name }</div>
          </div>
          <img className="team-image" alt="Team" src={ item.image }/>
        </div>
      )
    })

    return elements
  }

  render() {
    const { players, teams } = this.props
    if(!players || !teams) return null

    return (
      <div className={ this.constructor.name }>
        <div className="header">
          <div className="title">Teams</div>
          <button type="button" onClick={ this.toggleImages }>
            Toggle Images 
          </button>
        </div>
          { teams && teams.length ? this.renderTeams(teams) : 'TBD' }
      </div>
    )
  }
}

export default TournamentTeams
