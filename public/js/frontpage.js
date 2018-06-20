var jsonData
var activeElement
var goalStarTimout
var loader = document.getElementById('loader')
var knockoutClosed = true

fetch('/load/data/', { credentials: 'include' })
  .then(function(response) {
    return response.json()
  })
  .then(function(data) {
    jsonData = data

    fetch('/load/me', { credentials: 'include' })
      .then(function(response) {
        return response.json()
      })
      .then(function(data){
        userData = data

        if (!jsonData.knockout_closed) {
          knockoutClosed = false
        } else {
          document.getElementById('goalStar').setAttribute('disabled', true)
        }

        printGroups(jsonData.groups)
        printBestTable(16)
        printBestTable(8)
        printBestTable(4)
        printBestTable(2)
        printBestTable(1)
        setupListeners()

        document.getElementById('goalStar').value = userData.goal_star
      })
  })

function loadDetailedResults() {
  fetch('/load/others', { credentials: 'include' })
    .then(function(response) {
      return response.json()
    })
    .then(function(data){
      printDetailedResults(data)
    })
}

function printGroups(groups) {
  let guessGroupMatchesTable = document.getElementById('table--group-matches')
  let matches = getMatchesSorted(groups)
  let output = ''
  for (let i = 0; i < matches.length; i++) {
    let thisMatch = matches[i]
    let thisDate = new Date(thisMatch.date)
    let thisScore = '-'

    disabledClass = ''
    if (thisMatch.started) {
      disabledClass = 'disabled'
    }

    let guess_home = 0
    let guess_away = 0
    let thisMatchName = 'match_' + thisMatch.name
    
    if (userData.group_matches[thisMatchName]) {
      let guesses = userData.group_matches[thisMatchName]
      guess_home = guesses.home
      guess_away = guesses.away
    }

    let home_result_class = ''
    let away_result_class = ''
    let rowSpan = 1
    if(thisMatch.finished) {
      if (guess_home == thisMatch.home_result) {
        home_result_class = 'group-match--input__correct'
      } else {
        home_result_class = 'group-match--input__incorrect'
      }
      if (guess_away == thisMatch.away_result) {
        away_result_class = 'group-match--input__correct'
      } else {
        away_result_class = 'group-match--input__incorrect'
      }

      thisScore = calculateResultScore(thisMatch, guess_home, guess_away)
      rowSpan = 2
    }
    
    output += '<tr class="group-match--row ' + disabledClass + '">';
    output += '<td rowspan="' + rowSpan + '">' + thisMatch.name + '</td>'
    output += '<td rowspan="' + rowSpan + '">' + thisDate.toLocaleDateString("fi-FI") 
               + ' ' + thisDate.toLocaleTimeString("fi-FI") + '</td>'
    output += '<td>' 
    output += '<label class="match--team--container match--team--container__home">'
    output += '<input ' + disabledClass + ' value="' + guess_home + '" type="number" min="0" max="9" '
    output +=   'class="group-match--input ' + home_result_class + '" '
    output +=   'id="match-' + thisMatch.name + '-home">'
    output += '<div class="match--team">'
    output += '<span class="match--team--flag"><img src="https://api.fifa.com/api/v1/picture/flags-fwc2018-4/' + getTeamInfo(thisMatch.home_team, 'fifaCode') + '"></span>'
    output += '<span class="match--team--name">' + getTeamInfo(thisMatch.home_team, 'name') + '</span>'
    output += '</div>'
    output += '</label>'
    output += '</td>'
    output += '<td>' 
    output += '<label class="match--team--container match--team--container__away">'
    output += '<input ' + disabledClass + ' value="' + guess_away + '" type="number" min="0" max="9" '
    output +=   'class="group-match--input ' + away_result_class + '" '
    output +=   'id="match-' + thisMatch.name + '-away">'
    output += '<div class="match--team">'
    output += '<span class="match--team--flag"><img src="https://api.fifa.com/api/v1/picture/flags-fwc2018-4/' + getTeamInfo(thisMatch.away_team, 'fifaCode') + '"></span>'
    output += '<span class="match--team--name">' + getTeamInfo(thisMatch.away_team, 'name') + '</span>'
    output += '</div>'
    output += '</label>'
    output += '</td>'
    output += '<td rowspan="' + rowSpan + '">' + thisScore + '</td>'
    output += '</tr>'
    if (thisMatch.finished) {
      output += '<tr class="disabled">'
      output += '<td colspan="2" class="group-match--result"><p class="group-match--final-result">'
      output += 'Lopputulos: ' + thisMatch.home_result + '-' + thisMatch.away_result
      output += '</p></td></tr>'
    }
  }
  guessGroupMatchesTable.innerHTML = output;
}

function printBestTable(round) {
  let guessBestTable = document.getElementById('table--best-' + round)
  let output = '';
  for (let i = 0; i < round; i++) {
    output += '<tr>'
    output += '<td>' + (i + 1) + '</td>'
    output += '<td>' + getTeamDropdown(round, i) + '</td>'
    output += '<td></td>'
    output += '</tr>'
  }
  guessBestTable.innerHTML = output;
}

function getMatchesSorted(groups) {
  let matches = []
  for (let group in groups) {
    for (let match = 0; match < groups[group].matches.length; match++) {
      matches.push( groups[group].matches[match] )
    }
  }
  matches.sort(
    function(a, b) {
      return a.name - b.name
    }
  )
  
  return matches
}

function printDetailedResults(data) {
  document.querySelectorAll('.group-match--result').forEach(function(element, index) {
    let results = document.createElement('p');
    results.className = 'group-match--guesses'
    let thisText = ''
    for (let i = 0; i < data.length; i++) {
      let thisPlayer = data[i]
      if (thisPlayer.display_name == 'Karri') {
        console.log(thisPlayer)
      }
      if (thisPlayer && thisPlayer.guesses[index]) {
        let home = thisPlayer.guesses[index].home || 0
        let away = thisPlayer.guesses[index].away || 0
        thisText += thisPlayer.display_name + ': '
        thisText += home + '-' + away
        thisText += '<br>'
      }
    }
    
    results.innerHTML = thisText
    element.appendChild(results)
  })
}


function getTeamInfo(teamNumber, info) {
  let teams = jsonData.teams;
  if (info === 'emojiString' && teamNumber === 27) {
    return " 🇹🇳"
  } else {
    return teams[teamNumber - 1][info]
  }
  
}

function calculateResultScore(thisMatch, guess_home, guess_away) {
  let score = 0

  // Score from the results
  if (guess_home === thisMatch.home_result
    && guess_away === thisMatch.away_result) {
  
    score += 2
}

  // And then the winners
  var realWinner
  if (thisMatch.home_result > thisMatch.away_result) {
    realWinner = 1
  } else if (thisMatch.home_result < thisMatch.away_result) {
    realWinner = -1
  } else {
    realWinner = 0
  }

  var guessWinner
  if (guess_home > guess_away) {
    guessWinner = 1
  } else if (guess_home < guess_away) {
    guessWinner = -1
  } else {
    guessWinner = 0
  }

  if (realWinner === guessWinner) {
    score += 1
  }

  return score
}

function getTeamDropdown(round, position) {
  let team = null
  var ddOutput
  if (userData['round_' + round][position]) {
    team = userData['round_' + round][position]
  }

  if (!knockoutClosed) {
    let selectId = 'best-' + round + '-' + position
    ddOutput = '<select class="dropdown--teams" id="' + selectId + '">'
    ddOutput += '<option value="0">--Valitse--</option>'
    for (let i = 0; i < jsonData.teams.length; i++) {
      ddOutput += '<option value="' + jsonData.teams[i].id + '"'
      ddOutput += (team == parseInt(jsonData.teams[i].id)) ? ' selected>' : '>'
      ddOutput += jsonData.teams[i].name
      ddOutput += '</option>'
    }
    ddOutput += '</select>'
  } else {
    if (team) {
      ddOutput = '<p>' + jsonData.teams[team - 1].name + '</p>'
    } else {
      ddOutput = '<p class="dim">&laquo;Ei valittu&raquo;</p>'
    }
  }
  return ddOutput

}

function setupListeners() {
  document.querySelectorAll('.group-match--input').forEach(function(element, index) {
    element.addEventListener('change', function(event) {
      activeElement = event.target;
      activeElement.setAttribute('disabled', 'disabled')
      let elementNameArray = event.target.id.split('-')
      let matchId = elementNameArray[1]
      let homeGuess = document.getElementById('match-' + matchId + '-home').value;
      let awayGuess = document.getElementById('match-' + matchId + '-away').value;
      saveGroupMatchGuess(matchId, homeGuess, awayGuess)
    })
  })

  if (!knockoutClosed) {
    document.querySelectorAll('.dropdown--teams').forEach(function(element, index) {
      element.addEventListener('change', function(event) {
        let elementNameArray = event.target.id.split('-')
        let round = elementNameArray[1]
        let team = event.target.value
        let position = parseInt(elementNameArray[2]) + 1
        saveRoundGuess(round, team, position)
      })
    })

    document.getElementById('goalStar').addEventListener('input', function(event) {
      if (goalStarTimout) {
        clearTimeout(goalStarTimout)
      }
      goalStarTimout = setTimeout(saveGoalStar, 1000)
    })
  }

  /*
  document.getElementById('tableSwitcher_group').addEventListener('click', function(event) {
    loadDetailedResults()
  })
  */
}

function saveGoalStar() {
  loader.style.display = 'block'
  let data = {
    'goal_star': document.getElementById('goalStar').value
  }
  fetch('/save/goal_star', {
    body: JSON.stringify(data), 
    cache: 'no-cache', 
    credentials: 'include',
    headers: {
      'content-type': 'application/json'
    },
    method: 'POST', 
    mode: 'cors', 
    redirect: 'follow', 
    referrer: 'no-referrer',
  })
  .then(function() {
    loader.style.display = 'none'
  })
}

function saveGroupMatchGuess(matchId, homeGuess, awayGuess) {
  let data = {
    'match_id': matchId,
    'guess_home': homeGuess,
    'guess_away': awayGuess
  }
  fetch('/save/group_match', {
    body: JSON.stringify(data), 
    cache: 'no-cache', 
    credentials: 'include',
    headers: {
      'content-type': 'application/json'
    },
    method: 'POST', 
    mode: 'cors', 
    redirect: 'follow', 
    referrer: 'no-referrer',
  })
  .then(function() {
    activeElement.removeAttribute('disabled')
  })
}

function saveRoundGuess(round, team, position) {
  console.log(team)
  let data = {
    'round':    round,
    'team':     team,
    'position': position
  }
  fetch('/save/round', {
    body: JSON.stringify(data), 
    cache: 'no-cache', 
    credentials: 'include',
    headers: {
      'content-type': 'application/json'
    },
    method: 'POST', 
    mode: 'cors', 
    redirect: 'follow', 
    referrer: 'no-referrer',
  })
  .then(function() {
    console.log('saved round')
  })
}