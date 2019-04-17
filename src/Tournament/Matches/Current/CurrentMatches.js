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

  renderMatches(matches) {
    if(!matches[0].todo || matches[0].todo.length === 0)
      return ''

    const elements = []
    for(var i = 0; i < 3; i++) {
      const item = matches[0].todo[i]
      if(!item) return elements

      const team1 = this.getTeamById(item.teamId1)
      const team2 = this.getTeamById(item.teamId2)
      elements.push(
        <div key={ item.teamId1 + item.teamId2 } className="match">
          <div className="match-team-name">{ team1.name }<span className="vs">VS</span>{ team2.name }</div>
          <form onSubmit={ this.submitMatch }>
            <b>Who won?</b><br/>
            <input type="radio" name="winner" value={ item.teamId1 }/>{ team1.name }<br/>
            <input type="radio" name="winner" value={ item.teamId2 }/>{ team2.name }<br/>
            <b>How many cups did the losing team have remaining?</b><br/>
            <input type="text" name="loserExtraCups" />
            <input type="submit" value="Submit"/>
          </form>
          <form data-index={ i } onSubmit={ this.requeueMatch }>
            <input type="submit" value="Requeue Match"/>
          </form>
        </div>
      )
    }

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
