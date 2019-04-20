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

const NUM_GROUPS = 4
const NUM_ROUNDS = 2

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
  }

  postData(url, data) {
    return fetch(url, {
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
    })
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

  setDataState(stateVarName, url) {
    return fetch(url)
      .then((response) => response.json())
      .then((responseJSON) => {
        console.log(responseJSON, stateVarName)
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

    var teams = this.createGroupings(this.state.players, this.state.players.length / 2)

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
        this.postData('http://localhost:8000/teams/', tempTeam).then(() => {
          postedTeamCount++;
          if(postedTeamCount === teams.length) {
            this.fetchTeams().then(() => {
              this.initializeGroups(this.state.teams)
            })
          }
        })
      })
    })
  }

  initializeGroups(teams) {
    var groups = this.createGroupings(teams, NUM_GROUPS)
    var parsedGroups = []

    groups.forEach((group, index) => {
      var tempGroup = {}
      tempGroup.teams = []
      tempGroup.index = index

      group.forEach((team) => {
        var tempTeam = {}
        tempTeam.teamId = team._id
        tempTeam.wins = 0
        tempTeam.losses = 0
        tempTeam.extraCups = 0

        tempGroup.teams.push(tempTeam)
      })

      parsedGroups.push(tempGroup)
    })


    this.postData('http://localhost:8000/groups/', parsedGroups).then(() => {
      this.initializeMatches(parsedGroups)
    })
  }

  initializeMatches(groups) {
    var matches = []

    groups.forEach((group) => {
      const groupMatches = this.getMatches(group.teams)
      groupMatches.forEach((match) => {
        matches.push(match)
      })
    })

    var object = {}
    object.todo = this.shuffle(matches)
    object.completed = []

    this.postData('http://localhost:8000/matches/', object).then(() => {
      this.fetchPlayers()
      this.fetchTeams()
      this.fetchGroups()
      this.fetchMatches()
    })
  }

  shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }

    return array
  }

  getMatches(teams) {
    var matches = []
    for(var currentRound = 0; currentRound < NUM_ROUNDS; currentRound++) {
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
    }

    return matches
  }

  createGroupings(singleItems, numGroupings) {
    var groupings = []

    // for forcing a team to be premade
    var tempTeamArray = []
    for(var i = 0; i < singleItems.length; i++) {
      if(singleItems[i].name === 'test1' || singleItems[i].name === 'test6') {
        tempTeamArray.push(singleItems[i])
        singleItems.splice(i, 1)
        i--
      }  
    }
    
    if(tempTeamArray.length === 1) {
      singleItems.push(tempTeamArray[0])
    } else if(tempTeamArray.length === 2) {
      numGroupings--
      groupings.push(tempTeamArray)
    }

    while (numGroupings > 0) {
      groupings.push(this.shuffle(singleItems).splice(0, Math.floor(singleItems.length / numGroupings)))
      numGroupings--;
    }
    return groupings
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

    var groups = this.state.groups[0].groups

    // TODO: find the actual group instead of looping through all?
    groups.forEach((group, groupIndex) => {
      group.teams.forEach((team, teamIndex) => {
        if(team.teamId === winningTeamId) {
          team.wins = team.wins + 1
          groups[groupIndex][teamIndex] = team
        } else if (team.teamId === losingTeamId) {
          team.losses = team.losses + 1
          team.extraCups = team.extraCups + loserExtraCups
          groups[groupIndex].teams[teamIndex] = team
        }
      })
    })

    this.putData('http://localhost:8000/groups/' + this.state.groups[0]._id, groups).then(() => {
      
      // TODO: Just update state
      this.fetchMatches()
      this.fetchGroups()
    })
  }

  submitPlayer(event) {
    event.preventDefault()

    if (!this.state.playerName) return
    if (!this.playerSubmitArea) 
      this.playerSubmitArea = $('#submit-player input[type="text"], textarea')

    this.postData('http://localhost:8000/players/', { name: this.state.playerName }).then(() => {
      // TODO: Just update state
      this.fetchPlayers()
    })

    this.playerSubmitArea.val('')
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

  renderPreTournament() {
    return (
      <div className="pre-tournament">
        { this.renderSubmitPlayer() }
        { this.renderStartTournament() }
        <TournamentPlayers players={ this.state.players }/>
      </div>

    )
  }

  renderTournamentInfo () {
    return (
      <div className="tournament-info">
        <TournamentPlayers players={ this.state.players }/>
        <TournamentTeams teams={ this.state.teams } 
          players={ this.state.players }/>

        <div className="groups-current-matches-parent">
          <TournamentGroups groups={ this.state.groups[0].groups } 
            teams={ this.state.teams }/>
          <TournamentCurrentMatches matches={ this.state.matches }
            teams={ this.state.teams }
            players={ this.state.players }
            requeueMatchHandler={ this.requeueMatchHandler }
            submitMatchHandler={ this.submitMatchHandler }/>
        </div>

        <TournamentUpcomingMatches matches={ this.state.matches }
          teams={ this.state.teams }/>
        <TournamentCompletedMatches matches={ this.state.matches }
          teams={ this.state.teams }/>
      </div>
    )
  }

  render() {
    if (!this.state) return ''

    const tournamentStarted 
      = this.state.teams && this.state.teams.length > 0
      && this.state.groups && this.state.groups.length > 0
      && this.state.matches && this.state.matches.length > 0 

    const renderIntro 
      = tournamentStarted && localStorage.getItem('renderIntro') === 'true'
      
    return (
      <div className="App">
        { !tournamentStarted && this.renderPreTournament() }

        { renderIntro && <TournamentIntros players={ this.state.players }
          teams={ this.state.teams }/> }

        { tournamentStarted && this.renderTournamentInfo() }
      </div>
    );
  }
}

export default App;
