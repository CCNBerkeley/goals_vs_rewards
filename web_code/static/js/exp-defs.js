// Create a Psiturk instance
var psiturk = new PsiTurk(uniqueId, adServerLoc, mode);

// Setup timing variables
var feedback_delay    = 0;
var timing_post_trial = 500;
var feedback_duration = 500;
var timing_response   = 1500;

// Welcome and instruction content
var welcome_block = {
	type:   "text",
	text:   "<div id='jspsych-instructions'>" + 
		    "<img src='../static/images/university.png', class='jspsych-instructions-image-top'>" +
		    '<p>Welcome!</p>' + 
		    '<p>Thank you for your participation.<br/><br/></p>' +
		    '<br/><br/><p>[Press ENTER to continue]</p></div>',
	cont_key: 13,
	timing_post_trial: 5
};

var game_instructions = {
	type: 	"text",
	text: 	"<div id='jspsych-instructions'>" + 
		    '<p class="jspsych-instructions-large">INSTRUCTIONS</p>' +
		    '</br><p class="jspsych-instructions-leftaligned">' +
		    'In this experiment, you will see a series of colored '+
		    'shapes. You need to respond quickly by pressing a ' + 
		    'button on the keyboard. Each trial will begin with a ' +
		    '"plus" sign (+) followed by a colored shape.</p>' +
			'<p class="jspsych-instructions-leftaligned">' +
		    '<br/><br/><p>[Press ENTER to continue]</p></div>', 
	cont_key: 13,
	timing_post_trial: 5
}; 

var game_instructions_2 = {
	type: 	"text",
	text: 	"<div id='jspsych-instructions'>" + 
	    	'<p class="jspsych-instructions-large">INSTRUCTIONS</p>' +
		    '<br/>' + 
			'<p class="jspsych-instructions-leftaligned">' +
		    'Using the 4 fingers of your right hand, you will pick one of the following keys on each trial:</p>' + 
		    '<p>&#34H&#34  &nbsp; &#34J&#34 &nbsp; &#34K&#34 &nbsp; &#34L&#34 </p>' +
		    '<p class="jspsych-instructions-leftaligned">' +
			'You will have 1.5 seconds to choose an action before the trial ends. ' +
		    '</p>' +
		    '<p class="jspsych-instructions-leftaligned">' +
			'Use the points you win to figure out what key to press for each shape! ' +
		    '</p>' +
		    '<br/><br/><p>[Press ENTER to continue]</p></div>', 
	cont_key: 13,
	timing_post_trial: 5
}; 

var game_instructions_3 = {
	type: 	"text",
	text: 	"<div id='jspsych-instructions'>" + 
			'<p class="jspsych-instructions-large">INSTRUCTIONS</p>' +
			'</br><p class="jspsych-instructions-leftaligned">' +
			'You can win points depending on how well you play the game. ' +
			'Your goal is to win as many points as possible! Your total score at the end of the ' + 
			'game will be converted to BONUS PAYMENTS. </p>' +
			'</br><p class="jspsych-instructions-leftaligned">' +
			'After each trial you will ' +
			'see whether or not you have won points on the round, as well as your' + 
			' total score so far. The game varies in length but most people will finish ' +
			'in less than 9 minutes.</p>' +
			'<p class="jspsych-instructions-emphasize">GOOD LUCK!</p>' +
			'<br/><br/><p>[Press ENTER when you are ready to begin the game]</p></div>',
	cont_key: 13,
	timing_post_trial: 5
}; 

// Randomize the idenity of stimuli
var contextKey = [0,1,2,3,4];
var stimKey    = [0,1,2,3,4];
var contextID  = [0,1];
// note: actions are randomized prior to importing

// Code response keys
var keyCode       = { 0: 'H',  1: 'J',  2: 'K',  3: 'L'};
var keyCodeNumber = { 0: 'h',  1: 'j',  2: 'k',  3: 'l'};
var keyDecoder    = {72:   0, 74:   1, 75:   2, 76:   3};    

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
/* Misc Code */
function getTotalScore() {

    var trials = jsPsych.data.getTrialsOfType('bandit-wo-feedback');

    var sum_rew = 0;
    for (var i = 0; i < trials.length; i++) {
      if (trials[i].key_press > 0) {
          sum_rew += trials[i].rewOutcome;
      }
    }
    return sum_rew ;
};
  
function getBonus() {
    var trials = jsPsych.data.getTrialsOfType('bandit-wo-feedback');

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

