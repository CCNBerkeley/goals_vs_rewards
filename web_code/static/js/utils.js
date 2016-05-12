
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


// Bonus computation 
function computeBonus(){
   var data = psiTurk.getTrialData()
   var summary = {}

   // Find the summary data
   for (var i=0; i < data.length; i++){
      var cur_trial = data[i].trialdata

      if (cur_trial.hasOwnProperty('key_list')) {
         summary[cur_trial['phase']] = {'key_list': cur_trial['key_list'], 'trials_done': cur_trial['trials_done']}
      }
   }

   var num_responses_train = summary['train']['trials_done'].reduce(add, 0)
   var num_trials_train    = summary['train']['trials_done'].length

   var num_responses_test  = summary['test']['trials_done'].reduce(add, 0)
   var num_trials_test     = summary['test']['trials_done'].length

   var frac_complete_train = num_responses_train / num_trials_train;
   var frac_complete_test  = num_responses_test  / num_trials_test;
   var frac_complete       = (num_responses_train + num_responses_test)/(num_trials_train + num_trials_test)

   if (frac_complete < 0.75 || frac_complete_test < 0.75){
      var bonus = 0
      return bonus.toFixed(2)
   }

   var max_bonus = 5.0

   var wgt_train = 1
   var wgt_test  = 1
   var wgt_sum   = wgt_train + wgt_test

   var bonus = (frac_complete_train*(wgt_train/wgt_sum) + frac_complete_test*(wgt_test/wgt_sum))*max_bonus
   var bonus = Math.round(bonus*Math.pow(10,2))/Math.pow(10,2);

   return bonus.toFixed(2)
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