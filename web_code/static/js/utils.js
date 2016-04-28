
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

   var max_bonus = 5.0

   var wgt_train = 1
   var wgt_test  = 1
   var wgt_sum   = wgt_train + wgt_test

   var bonus = (frac_complete_train*(wgt_train/wgt_sum) + frac_complete_test*(wgt_test/wgt_sum))*max_bonus

   return bonus
}
