
function AssertException(message) { this.message = message; }
AssertException.prototype.toString = function () {
	return 'AssertException: ' + this.message;
};

function assert(exp, message) {
	if (!exp) {
		throw new AssertException(message);
	}
}

// Mean of booleans (true==1; false==0)
function boolpercent(arr) {
	var count = 0;
	for (var i=0; i<arr.length; i++) {
		if (arr[i]) { count++; } 
	}
	return 100* count / arr.length;
}


// Necessary for sum implementation
function add(a, b) {
   return a + b;
}

// An 'Actual' Date Function
function getFormattedDate() {
    var date = new Date()
    var str  = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    return str;
}

// Bonus computation 
function computeBonus(){
   var max_bonus = 1.0

   try {
      var data = psiTurk.getTrialData()
      var summary = {}

      // Find the summary data
      for (var i=0; i < data.length; i++){
         var cur_trial = data[i].trialdata

         if (cur_trial.hasOwnProperty('key_list')) {
            summary[cur_trial['phase']] = {'key_list': cur_trial['key_list'], 'trials_done': cur_trial['trials_done'], 'trials_corr':cur_trial['trials_corr']}
            if (cur_trial['phase'] == 'test'){
               var prev_seen = cur_trial['prev_seen']
            }
         }
      }

      // Get fractions completed
      var num_responses_train = summary['train']['trials_done'].reduce(add, 0)
      var num_trials_train    = summary['train']['trials_done'].length

      var num_responses_test  = summary['test']['trials_done'].reduce(add, 0)
      var num_trials_test     = summary['test']['trials_done'].length

      var frac_complete_train = num_responses_train / num_trials_train;
      var frac_complete_test  = num_responses_test  / num_trials_test;
      var frac_complete       = (num_responses_train + num_responses_test)/(num_trials_train + num_trials_test)


      // Return 0 if not enough completed
      if (frac_complete < 0.75 || frac_complete_test < 0.75){
         var bonus = 0
         return bonus.toFixed(2)
      }

      // Get fraction correct from training trials
      var frac_correct_train = summary['train']['trials_corr'].reduce(add,0) / summary['train']['trials_corr'].length
      var performance_train  = Math.max(frac_correct_train - 0.5, 0.0)*2
      
      // Get fraction correct from previously seen pairs in test
      var seen_and_correct = []
      for (var i = 0; i < prev_seen.length; i++) {
         seen_and_correct.push( Math.floor( (prev_seen[i] + summary['test']['trials_corr'][i] )/2 ));
      }
      var performance_test = seen_and_correct.reduce(add,0) / seen_and_correct.length
      var performance_test = Math.max(performance_test - 0.5, 0.0)*2

      // Create a psuedo histogram of key-stroke streaks:
      // Tally streaks of length 1 through 6, where 1 is not truly a streak and those > 6 are decomposed
      var streak_hist   = [0,0,0,0,0,0,0,0,0,0]
      var increment     = 0
      var prev_response = summary['train']['key_list'][0]

      for (var i=1; i < summary['train']['key_list'].length; i++){
         if (increment == 10) {
            streak_hist[9] ++
            increment = 0
         }

         if (summary['train']['key_list'][i] == prev_response) {
            increment ++
         }
         else {
            streak_hist[increment] ++
            increment = 0
         }
         prev_response = data[i]
      }
      streak_hist[Math.min(increment,9)] ++

      // For every length 6 streak, decrement bonus amount by 6/num_trials_train
      var bonus = max_bonus * (1 - streak_hist[9]*(10/num_trials_train))
     

 
      // Give only a fraction of this bonus, based on the fraction answered. 
      var wgt_train = 1
      var wgt_test  = 1
      var wgt_sum   = wgt_train + wgt_test

      var bonus = (  frac_complete_train *(wgt_train /wgt_sum) * performance_train
                   + frac_complete_test  *(wgt_test  /wgt_sum) * performance_test  ) *bonus

      var bonus = Math.round(bonus*Math.pow(10,2))/Math.pow(10,2);

      if (Number.isNaN(bonus)) {
        psiTurk.recordTrialData({'phase': 'questionnaire','bonus_error': 'bonus is NaN!'});
        bonus = 1
      }
      return bonus.toFixed(2)

   } catch(e){
      psiTurk.recordTrialData({'phase': 'questionnaire','bonus_error': e.message});
      return max_bonus.toFixed(2)
   }
}


function shuffle(array) {
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


function loadJSON(filename,callback) {   
    var xobj = new XMLHttpRequest();

    xobj.overrideMimeType("application/json");
    xobj.open('GET', filename, true);
    
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);
    return xobj
}
