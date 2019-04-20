import React, { Component } from 'react'
import $ from 'jquery'
import './Intros.css'

class TournamentIntros extends Component {
  clickTeamIntro(event) {
    const playersObject = $($('.team-intro-players', event.currentTarget)[0])
    if(playersObject.hasClass('hidden')) {
      playersObject.removeClass('hidden')
    } else {
      $(event.currentTarget).remove()
    }
  }
  
  removeIntros() {
    localStorage.setItem('renderIntro', false)
  }

  getPlayerById(id) {
    return this.props.players.filter((player) => {
      return player._id === id
    })[0]
  }

  renderTeamIntro(team) {
    const player1 = this.getPlayerById(team.playerId1)
    const player2 = this.getPlayerById(team.playerId2)

    const key = 'intro' + team.name
    return (
      <div key={ key } className="team-intro" onClick={ this.clickTeamIntro }>
        <div className="team-intro-name">{ team.name }</div>
        <img className="team-intro-image" alt="Team" src={ team.image }/>
        <div className="team-intro-players hidden">
          <div className="team-intro-player">{ player1.name }</div>
          <div className="team-intro-and">and</div>
          <div className="team-intro-player">{ player2.name }</div>
        </div>
      </div>
    )
  }

  render() {
    const { teams, players } = this.props
    if(!teams || !players) return null

    return (
      <div className={ this.constructor.name }>
{/*        <form onSubmit={ this.removeIntros }>
          <input type="submit" value="Exit"/>
        </form>*/}
        { teams.map((team) => this.renderTeamIntro(team)) }
      </div>
    )
  }
}

export default TournamentIntros
