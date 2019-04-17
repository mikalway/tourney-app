import React, { Component } from 'react'
import './CompletedMatches.css'

class TournamentCompletedMatches extends Component {
  getTeamById(id) {
    return this.props.teams.filter((team) => {
      return team._id === id
    })[0]
  }

  renderMatches(matches) {
    if(!matches[0].completed || matches[0].completed.length === 0)
      return ''

    const elements = []
    matches[0].completed.forEach((item) => {
      const team1 = this.getTeamById(item.teamId1)
      const team2 = this.getTeamById(item.teamId2)
      if (item.winner === item.teamId1) {
        elements.push(
          <div key={ item.teamId1 + item.teamId2 } className="match">
            <div className="match-team-name">
              <span className="winner">{ team1.name }</span>
              <span className="vs">VS</span>
              <span className="loser">{ team2.name }</span>
            </div>
            <div className="match-extra-cups">Extra cups: { item.loserExtraCups }</div>
          </div>
        )
      } else {
        elements.push(
          <div key={ item.teamId1 + item.teamId2 } className="match">
            <div className="match-team-name">
              <span className="loser">{ team1.name }</span>
              <span className="vs">VS</span>
              <span className="winner">{ team2.name }</span>
            </div>
            <div className="match-extra-cups">Extra cups: { item.loserExtraCups }</div>
          </div>
        )
      }
    })

    return elements
  }

  render() {
    const { matches, teams } = this.props
    if(!matches || !teams) return null

    return (
      <div className={ this.constructor.name }>
        <div className="title">Completed</div>
        <div className="completed">
          { matches && matches.length ? this.renderMatches(matches) : 'TBD' }
        </div>
      </div>
    )
  }
}

export default TournamentCompletedMatches
