// Create a Psiturk instance
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition      = condition;       // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
                                        // they are not used in the stroop code but may be useful to you

// Setup timing variables
var feedback_delay    = 0;
var timing_post_trial = 500;
var feedback_duration = 500;
var timing_response   = 1500;

// Randomize the idenity of stimuli
var contextKey = [0,1,2,3,4];
var stimKey    = [0,1,2,3,4];
var contextID  = [0,1];

// note: actions are randomized prior to importing

// Code response keys
var keyCode       = { 0: 'H',  1: 'J'};
var keyCodeNumber = { 0: 'h',  1: 'j'};
var keyDecoder    = {70:   0, 74:   1};    

/* Set up the pretraining regimen */
//
var imageMat       = [];
var outcomeMat     = [];
var keyResponseMat = [];
var promptMat      = [];
var stimMat        = [];

var contextMat     = [];
var gameData       = [];

/* define test block */
var imageMat = [];
var probMat  = [];

// var outcomeMat = [];
var rewardOutcomes = [];
var trialTypeMat   = [];
var stimMat        = [];
var contextMat     = [];

/* Values of winning, losing*/
var valueMat = [1, 0];

/* create experiment definition array */
var experiment = [];


function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
};

/*
// Misc Code
function getTotalScore() {

    var trials = jsPsych.data.getTrialsOfType('two-step');

    var sum_rew = 0;
    for (var i = 0; i < trials.length; i++) {
      if (trials[i].key_press > 0) {
          sum_rew += trials[i].rewOutcome;
      }
    }
    return sum_rew ;
};
  
function getBonus() {
    var trials = jsPsych.data.getTrialsOfType('two-step');

    var sum_rew = 0;
    var bonus = 0;
    for (var i = 0; i < trials.length; i++) {
      if (trials[i].key_press > 0) {
          sum_rew += trials[i].rewOutcome;
      }
    }
    if (sum_rew <101){
        bonus = 0;
    }
    if (sum_rew >100){
    		bonus = (sum_rew-100)*0.5/100;
    }
    if (bonus>0.4){
        bonus = 0.4;
    }
    return bonus ;
};

*/