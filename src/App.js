import React, { Component } from 'react'
import './App.css'
import './Tournament/Matches/Matches.css'

import TournamentIntros from './Tournament/Intros/Intros.js'
import TournamentPlayers from './Tournament/Players/Players.js'
import TournamentTeams from './Tournament/Teams/Teams.js'
import TournamentGroups from './Tournament/Groups/Groups.js'
import TournamentCurrentMatches from './Tournament/Matches/Current/CurrentMatches.js'
import TournamentUpcomingMatches from './Tournament/Matches/Upcoming/UpcomingMatches.js'
import TournamentCompletedMatches from './Tournament/Matches/Completed/CompletedMatches.js'

import $ from 'jquery'
import googleImages from 'google-images'

class App extends Component {
  constructor() {
    super()

    this.handleNameChange = this.handleNameChange.bind(this)
    this.submitPlayer = this.submitPlayer.bind(this)
    this.startTournament = this.startTournament.bind(this)

    if(localStorage.getItem('renderIntro') === null) {
      localStorage.setItem('renderIntro', true)
    }

    $.get('./adjectivelist.txt', {}, (content) => {
      this.adjectives = content.split('\n');
    });

    $.get('./nounlist.txt', {}, (content) => {
      this.nouns = content.split('\n');
    });

    this.addListeners()
  }

  componentDidMount() {
    this.fetchPlayers()
    this.fetchTeams()
    this.fetchGroups()
    this.fetchMatches()

    this.client = new googleImages('004764128469374828995:febdo0di9ju', 'AIzaSyDbbEZdAYhyCIIRaiIyLulbQz29owX4ihU')
  }

  addListeners() {
    this.requeueMatchHandler = (match) => {
      this.requeueMatch(match)
    }

    this.submitMatchHandler = (match) => {
      this.submitMatch(match)
    }
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
    .then(() => {
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
    .then(() => {
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
      const teamNoun = this.getRandomNoun()
      tempTeam.name = teamAdjective + ' ' + teamNoun

      this.client.search(teamAdjective).then((images) => {
        const imageIndex = Math.floor(Math.random() * 10)
        tempTeam.image = images[imageIndex].url
        tempTeam.backupImage = images[(imageIndex + 1) % 10].url
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
    var teams = []

    // for forcing a team to be premade
    var tempTeamArray = []
    for(var i = 0; i < names.length; i++) {
      if(names[i].name === 'test1' || names[i].name === 'test6') {
        tempTeamArray.push(names[i])
        names.splice(i, 1)
        i--
      }  
    }
    
    if(tempTeamArray.length === 1) {
      names.push(tempTeamArray[0])
    } else if(tempTeamArray.length === 2) {
      teamsCount--
      teams.push(tempTeamArray)
    }

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

  requeueMatch(match) {
    const matches = this.state.matches
    const index = $(match).data('index')
    matches[0].todo.push(matches[0].todo.splice(index, 1)[0])
    this.setState({ matches })
  }

  submitMatch(match) {
    var winningTeamId = $("input[name='winner']:checked", match).val();
    var losingTeamId = $("input[name='winner']:not(:checked)", match).val();
  
    if(!winningTeamId) {
      alert('Must select the team who won to submit!')
      return
    }

    var loserExtraCups = parseInt($("input[name='loserExtraCups']", match).val(), 10);

    if(isNaN(loserExtraCups)) {
      alert('Must include # of extra cups to submit!')
      return
    }

    var teamId1 = $("input[name='winner']", match).val()
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

  getRandomAdjective() {
    const string = this.adjectives[Math.floor(Math.random() * this.adjectives.length)] 
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  getRandomNoun() {
    const string = this.nouns[Math.floor(Math.random() * this.nouns.length)] 
    return string.charAt(0).toUpperCase() + string.slice(1)
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
    const renderIntro 
      = tournamentStarted && localStorage.getItem('renderIntro') === 'true'

    return (
      <div className="App">
        
        { !tournamentStarted && this.renderSubmitPlayer() }
        { !tournamentStarted && this.renderStartTournament() }
        { renderIntro && <TournamentIntros players={ this.state.players }
          teams={ this.state.teams }/> }

        <TournamentPlayers players={ this.state.players }/>
        <TournamentTeams teams={ this.state.teams } 
          players={ this.state.players }/>

        <div className="groups-current-matches-parent">
          <TournamentGroups groups={ this.state.groups } 
            teams={ this.state.teams }/>
          <TournamentCurrentMatches matches={ this.state.matches }
            teams={ this.state.teams }
            requeueMatchHandler={ this.requeueMatchHandler }
            submitMatchHandler={ this.submitMatchHandler }/>
        </div>

        <TournamentUpcomingMatches matches={ this.state.matches }
          teams={ this.state.teams }/>
        <TournamentCompletedMatches matches={ this.state.matches }
          teams={ this.state.teams }/>
      </div>
    );
  }
}

export default App;
