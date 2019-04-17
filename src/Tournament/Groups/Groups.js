import React, { Component } from 'react'
import './Groups.css'

class TournamentGroups extends Component {
  getTeamById(id) {
    return this.props.teams.filter((team) => {
      return team._id === id
    })[0]
  }

  renderGroupsTeam(team) {
    const teamObject = this.getTeamById(team.teamId)
    
    if (!teamObject) {
      // race condition: might not be set yet
      return 
    }

    const teamName = teamObject.name

    return (
      <div key={ team.teamId } className="group-team">
        <div className="group-team-name">{ teamName }</div>
        <div className="group-team-statistics">
          <div className="group-team-wins"><span>W:</span>{ team.wins } </div>
          <div className="group-team-losses"><span>L:</span> { team.losses }</div>
          <div className="group-team-extracups"><span>Extra:</span> { team.extraCups }</div>
        </div>
      </div>
    )
  }

  renderGroup(groupName, group) {
    var groupTeams = []
    group.forEach((team) => groupTeams.push(this.renderGroupsTeam(team)))
    return (
      <div key={ groupName } className="group">
        <div className="group-title">{ groupName }</div>
        { groupTeams }
      </div>
    )
  }

  compareTeams(team1, team2) {
    if (team1.wins < team2.wins)
      return 1;
    if (team1.wins > team2.wins)
      return -1;
    if (team1.wins === team2.wins) {
      if (team1.extraCups < team2.extraCups)
        return -1;
      if (team1.extraCups > team2.extraCups)
        return 1;
    }

    return 0;
  }

  renderGroups(groups) {
    const groupA = groups[0].a.sort(this.compareTeams)
    const groupB = groups[0].b.sort(this.compareTeams)
    const groupC = groups[0].c.sort(this.compareTeams)
    const groupD = groups[0].d.sort(this.compareTeams)

    var groupParent = []
    groupParent.push(this.renderGroup('Group A', groupA))
    groupParent.push(this.renderGroup('Group B', groupB))
    groupParent.push(this.renderGroup('Group C', groupC))
    groupParent.push(this.renderGroup('Group D', groupD))

    return groupParent
  }
  render() {
    const { groups, teams } = this.props
    if(!groups || !teams) return null

    return (
      <div className={ this.constructor.name }>
        <div className="title">Groups</div>
        <div className="groups">
          { groups && groups.length ? this.renderGroups(groups) : 'TBD' }
        </div>
      </div>
    )
  }
}

export default TournamentGroups
