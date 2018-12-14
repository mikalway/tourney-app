import React, { Component } from 'react'
import './App.css'
import $ from 'jquery'
import googleImages from 'google-images'

class App extends Component {
  constructor() {
    super()

    this.handleNameChange = this.handleNameChange.bind(this)
    this.submitPlayer = this.submitPlayer.bind(this)
    this.startTournament = this.startTournament.bind(this)
    this.submitMatch = this.submitMatch.bind(this)
    this.requeueMatch = this.requeueMatch.bind(this)

    $.get('./adjectivelist.txt', {}, (content) => {
      this.adjectives = content.split('\n');
    });

    $.get('./nounlist.txt', {}, (content) => {
      this.nouns = content.split('\n');
    });
  }

  componentDidMount() {
    this.fetchPlayers()
    this.fetchTeams()
    this.fetchGroups()
    this.fetchMatches()

    this.client = new googleImages('004764128469374828995:febdo0di9ju', 'AIzaSyDbbEZdAYhyCIIRaiIyLulbQz29owX4ihU')
  }

  /*
   *
   * FETCH CALLS
   *
   */

  putData(url, data) {
    return fetch(url, {
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      },
      method: 'PUT',
    })
    .then(response => {
      this.fetchGroups()
      this.fetchMatches()
    }) 
  }

  postData(url, data) {
    return fetch(url, {
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
    })
    .then(response => {
      this.fetchPlayers()
      this.fetchTeams()
      this.fetchGroups()
      this.fetchMatches()
    }) 
  }

  setDataState(stateVarName, url) {
    return fetch(url)
      .then((response) => response.json())
      .then((responseJSON) => {
        this.setState({ [stateVarName]: responseJSON })
      })
  }

  /*
   *
   * TOURNAMENT LOGIC
   *
   */

  startTournament(event) {
    event.preventDefault()
    var teams = this.randomizeTeams(this.state.players, this.state.players.length / 2)

    var parsedTeams = []
    var postedTeamCount = 0

    teams.forEach((element) => {
      var tempTeam = {}
      tempTeam.playerId1 = element[0]._id
      tempTeam.playerId2 = element[1]._id

      const teamAdjective = this.getRandomAdjective()
      tempTeam.name = teamAdjective + ' ' + this.getRandomNoun()

      this.client.search(teamAdjective).then((images) => {
        console.log(tempTeam, images)
        tempTeam.image = images[Math.floor(Math.random() * 10)].url

        parsedTeams.push(tempTeam)
        this.postData('http://localhost:8000/teams/', tempTeam).then((response) => {
          postedTeamCount++;
          if(postedTeamCount === teams.length) {
            this.fetchTeams().then((response) => {
              this.initializeGroups(this.state.teams)
            })
          }
        })
      })
    })
  }

  initializeGroups(teams) {
    var groups = this.randomizeTeams(teams, 4)
    var parsedGroups = {}

    groups.forEach((teams, index) => {
      var tempGroup = []

      teams.forEach((element) => {
        var tempTeam = {}
        tempTeam.teamId = element._id
        tempTeam.wins = 0
        tempTeam.losses = 0
        tempTeam.extraCups = 0

        tempGroup.push(tempTeam)
      })

      switch(index) {
        case 3:
          parsedGroups.a = tempGroup
          break
        case 2:
          parsedGroups.b = tempGroup
          break
        case 1: 
          parsedGroups.c = tempGroup
          break
        case 0:
          parsedGroups.d = tempGroup
          break
        default:
          break
      }
    })

    this.postData('http://localhost:8000/groups/', parsedGroups).then((response) => {
      this.fetchGroups().then((response) => {
        this.initializeMatches(this.state.groups[0])
      })
    })
  }

  initializeMatches(groups) {
    var matches = []

    var matchesA = this.getMatches(groups.a)
    var matchesB = this.getMatches(groups.b)
    var matchesC = this.getMatches(groups.c)
    var matchesD = this.getMatches(groups.d)

    for(var i = 0; i < matchesA.length; i++) {
      matches.push(matchesA[i]);
      if(matchesB.length > i)
        matches.push(matchesB[i]) 
      if(matchesC.length > i)
        matches.push(matchesC[i]) 
      if(matchesD.length > i)
        matches.push(matchesD[i]) 
    }

    var object = {}
    object.todo = matches
    object.completed = []

    this.postData('http://localhost:8000/matches/', object).then((response) => {
      
    })
  }

  getMatches(teams) {
    var matches = []
    for(var i = 0; i < teams.length; i++) {
      for(var j = i + 1; j < teams.length; j++){
        var tempMatch = {}
        tempMatch.teamId1 = teams[i].teamId
        tempMatch.teamId2 = teams[j].teamId
        tempMatch.winner = null
        tempMatch.loserExtraCups = 0
        matches.push(tempMatch)
      }
    }

    return matches
  }

  randomizeTeams(names, teamsCount) {
    var teams = [];
    while (teamsCount > 0) {
      teams.push(this.shuffle(names).splice(0, Math.floor(names.length / teamsCount)))
      teamsCount--;
    }
    return teams
  }

  shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  handleNameChange(event) {
    this.setState({ playerName: event.target.value });
  }

  requeueMatch(event, index) {
    event.preventDefault()

    console.log(event, index)
  }

  submitMatch(event) {
    event.preventDefault()

    var winningTeamId = $("input[name='winner']:checked", event.target).val();
    var losingTeamId = $("input[name='winner']:not(:checked)", event.target).val();
  
    if(!winningTeamId) {
      alert('Must select the team who won to submit!')
      return
    }

    var loserExtraCups = parseInt($("input[name='loserExtraCups']", event.target).val(), 10);

    if(isNaN(loserExtraCups)) {
      alert('Must include # of extra cups to submit!')
      return
    }

    var teamId1 = $("input[name='winner']", event.target).val()
    var teamId2 = winningTeamId === teamId1 ? losingTeamId : winningTeamId;

    var matches = this.state.matches[0]

    for (var i = 0; i < matches.todo.length; i++){
      if(matches.todo[i].teamId1 === teamId1 
        && matches.todo[i].teamId2 === teamId2) {
          matches.todo.splice(i, 1)
      }
    }
    
    var completedMatch = {}
    completedMatch.teamId1 = teamId1
    completedMatch.teamId2 = teamId2
    completedMatch.winner = winningTeamId
    completedMatch.loserExtraCups = loserExtraCups

    matches.completed.push(completedMatch)

    this.putData('http://localhost:8000/matches/' + this.state.matches[0]._id, matches)

    var groups = this.state.groups[0]

    groups.a.forEach((element, index) => {
      if(element.teamId === winningTeamId) {
        element.wins = element.wins + 1
        groups.a[index] = element
      } else if (element.teamId === losingTeamId) {
        element.losses = element.losses + 1
        element.extraCups = element.extraCups + loserExtraCups
        groups.a[index] = element
      }
    })

    groups.b.forEach((element, index) => {
      if(element.teamId === winningTeamId) {
        element.wins = element.wins + 1
        groups.b[index] = element
      } else if (element.teamId === losingTeamId) {
        element.losses = element.losses + 1
        element.extraCups = element.extraCups + loserExtraCups
        groups.b[index] = element
      }
    })

   groups.c.forEach((element, index) => {
      if(element.teamId === winningTeamId) {
        element.wins = element.wins + 1
        groups.c[index] = element
      } else if (element.teamId === losingTeamId) {
        element.losses = element.losses + 1
        element.extraCups = element.extraCups + loserExtraCups
        groups.c[index] = element
      }
    })

    groups.d.forEach((element, index) => {
      if(element.teamId === winningTeamId) {
        element.wins = element.wins + 1
        groups.d[index] = element
      } else if (element.teamId === losingTeamId) {
        element.losses = element.losses + 1
        element.extraCups = element.extraCups + loserExtraCups
        groups.d[index] = element
      }
    })
    
    this.putData('http://localhost:8000/groups/' + this.state.groups[0]._id, groups)
  }

  submitPlayer(event) {
    event.preventDefault()

    if (!this.state.playerName) return
    if (!this.playerSubmitArea) 
      this.playerSubmitArea = $('#submit-player input[type="text"], textarea')

    this.postData('http://localhost:8000/players/', { name: this.state.playerName })
    this.playerSubmitArea.val('')
  }

  fetchPlayers() {
    return this.setDataState('players', 'http://localhost:8000/players/')
  }

  fetchTeams() {
    return this.setDataState('teams', 'http://localhost:8000/teams/')
  }

  fetchGroups() {
    return this.setDataState('groups', 'http://localhost:8000/groups/')
  }

  fetchMatches() {
    return this.setDataState('matches', 'http://localhost:8000/matches/')
  }

  getPlayerById(id) {
    if(!this.state.players) return ''
    return this.state.players.filter((player) => {
      return player._id === id
    })[0]
  }

  getTeamById(id) {
    if(!this.state.teams) return ''
    return this.state.teams.filter((team) => {
      return team._id === id
    })[0]
  }

  getRandomAdjective() {
    const string = this.adjectives[Math.floor(Math.random() * this.adjectives.length)] 
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  getRandomNoun() {
    const string = this.nouns[Math.floor(Math.random() * this.nouns.length)] 
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  /*
   *
   * RENDER FUNCTIONS
   *
   */

  renderPlayers(players) {
    const elements = []
    players.forEach((item, index) => {
      elements.push(<div key={ item._id } className="player">{ item.name }</div>)
    })

    return elements
  }

  renderTeams(teams) {
    if (!this.state.players) return ''

    const elements = []
    teams.forEach((item, index) => {
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

  renderCurrentMatches(matches) {
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

  renderUpcomingMatches(matches) {
    if(!matches[0].todo || matches[0].todo.length === 0)
      return ''

    const elements = []
    matches[0].todo.forEach((item, index) => {
      if(index <= 2) return

      const team1 = this.getTeamById(item.teamId1)
      const team2 = this.getTeamById(item.teamId2)
      elements.push(
        <div key={ item.teamId1 + item.teamId2 } className="match">
          <div className="match-team-name">{ team1.name }<span className="vs">VS</span>{ team2.name }</div>
        </div>
      )
    })

    return elements
  }

  renderCompleted(matches) {
    if(!matches[0].completed || matches[0].completed.length === 0)
      return ''

    const elements = []
    matches[0].completed.forEach((item, index) => {
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

  renderSubmitPlayer() {
    return (
      <form id="submit-player" onSubmit={ this.submitPlayer }>
        Full name:
        <input type="text" name="name" onChange={ this.handleNameChange }/>
        <input type="submit" value="Submit"/>
      </form>
    )
  }

  renderStartTournament() {
    return (     
      <form id="start" onSubmit={ this.startTournament }>
        <input type="submit" value="Start Tournament"/>
      </form>
    )
  }

  render() {
    if (!this.state) return ''

    const tournamentStarted = this.state.teams && this.state.teams.length > 0
    return (
      <div className="App">
        
        { !tournamentStarted ? this.renderSubmitPlayer() : '' }
        { !tournamentStarted ? this.renderStartTournament() : '' }

        <div className="player-parent">
          <div className="title">Players{ this.state.players 
            ?  ' (' + this.state.players.length + ')' : '' }</div>
          { this.state.players ? this.renderPlayers(this.state.players) : 'No players yet' }
        </div>
        
        <div className="team-parent">
          <div className="title">Teams</div>
          { this.state.teams && this.state.teams.length ? this.renderTeams(this.state.teams) : 'TBD' }
        </div>

        <div className="groups-current-parent">
          <div className="groups-parent">
            <div className="title">Groups</div>
            <div className="groups">
              { this.state.groups && this.state.groups.length ? this.renderGroups(this.state.groups) : 'TBD' }
            </div>
          </div>
          <div className="groups-parent">
            <div className="title">Current Matches</div>
            <div className="matches">
              { this.state.matches && this.state.matches.length ? this.renderCurrentMatches(this.state.matches) : 'TBD' }
            </div>
          </div>
        </div>

        <div className="matches-parent">
          <div className="title">Upcoming Matches</div>
          <div className="matches">
            { this.state.matches && this.state.matches.length ? this.renderUpcomingMatches(this.state.matches) : 'TBD' }
          </div>
        </div>

        <div className="completed-parent">
          <div className="title">Completed</div>
          <div className="completed">
            { this.state.matches && this.state.matches.length ? this.renderCompleted(this.state.matches) : 'TBD' }
          </div>
        </div>

      </div>
    );
  }
}

export default App;
