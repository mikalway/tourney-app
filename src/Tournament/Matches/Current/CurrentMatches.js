import React, { Component } from 'react'
import './CurrentMatches.css'

class TournamentCurrentMatches extends Component {
  constructor() {
    super()
    this.requeueMatch = this.requeueMatch.bind(this)
    this.submitMatch = this.submitMatch.bind(this)
  }

  getTeamById(id) {
    return this.props.teams.filter((team) => {
      return team._id === id
    })[0]
  }

  getPlayerById(id) {
    return this.props.players.filter((player) => {
      return player._id === id
    })[0]
  }

  requeueMatch(event) {
    event.preventDefault()

    this.props.requeueMatchHandler 
      && this.props.requeueMatchHandler(event.target)
  }

  submitMatch(event) {
    event.preventDefault()

    this.props.submitMatchHandler 
      && this.props.submitMatchHandler(event.target)
  }

  getPlayerNames(team) {
    return this.getPlayerById(team.playerId1).name 
      + ' and ' + this.getPlayerById(team.playerId2).name 
  }
  
  renderMatches(matches) {
    const elements = []

    matches.forEach((item, index) => {
      console.log(item)
      const team1 = this.getTeamById(item.teamId1)
      const team2 = this.getTeamById(item.teamId2)
    
      const team1Names = this.getPlayerNames(team1) 
      const team2Names = this.getPlayerNames(team2) 

      elements.push(
        <div key={ item.teamId1 + item.teamId2 + Math.random() } className="match">
          <div className="match-team-name">{ team1.name }<span className="vs">VS</span>{ team2.name }</div>
          <div className="player-names">{ team1Names }<span className="vs">VS</span>{ team2Names }</div>
          <form onSubmit={ this.submitMatch }>
            <b>Who won?</b><br/>
            <input type="radio" name="winner" value={ item.teamId1 }/>{ team1.name }<br/>
            <input type="radio" name="winner" value={ item.teamId2 }/>{ team2.name }<br/>
            <b>How many cups did the losing team have remaining?</b><br/>
            <input type="text" name="loserExtraCups" />
            <input type="submit" value="Submit"/>
          </form>
          <form data-index={ index } onSubmit={ this.requeueMatch }>
            <input type="submit" value="Requeue Match"/>
          </form>
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
        <div className="title">Current Matches</div>
        <div className="matches">
          { matches && matches.length ? this.renderMatches(matches) : 'TBD' }
        </div>
      </div>
    )
  }
}

export default TournamentCurrentMatches
