import React, { Component } from 'react'
import './UpcomingMatches.css'

class TournamentUpcomingMatches extends Component {  
  getTeamById(id) {
    return this.props.teams.filter((team) => {
      return team._id === id
    })[0]
  }

  renderMatches(matches) {
    const elements = []
    matches.forEach((item) => {
      const team1 = this.getTeamById(item.teamId1)
      const team2 = this.getTeamById(item.teamId2)
      elements.push(
        <div key={ item.teamId1 + item.teamId2 + Math.random() } className="match">
          <div className="match-team-name">{ team1.name }<span className="vs">VS</span>{ team2.name }</div>
        </div>
      )
    })

    return elements
  }

  render() {
    const { matches, teams } = this.props
    if(!matches || !teams) return null

    return (
      <div className={ this.constructor.name }>
        <div className="title">Upcoming Matches</div>
        <div className="matches">
          { matches && matches.length ? this.renderMatches(matches) : 'TBD' }
        </div>
      </div>
    )
  }
}

export default TournamentUpcomingMatches
