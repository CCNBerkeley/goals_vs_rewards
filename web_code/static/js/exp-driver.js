/*
// keep a set of all the images files to preload 
preload_set = {};

// preload the used stimuli
var images_preload = Object.keys(preload_set);

// pick a game to load from file
games = [0];
games = shuffleArray(games);
    
// load json files for the task (contains trial orders, etc)
var url = '/static/game' + games[0] +'.json';

$.ajax({
  type    : 'GET',
  url     :  url ,
  dataType: 'json',
  success : function(data) { gameData = data;},
  async   : false
});


// get the number of trials
var nTrials = Object.keys(gameData.trials).length;        


contextKey = shuffleArray(contextKey);	//
stimKey    = shuffleArray(stimKey);		// 
contextID  = shuffleArray(contextID); 	// Radomize which dimension is the context

// loop through the trials and set the stimuli
for (var ii=0; ii<nTrials; ii++) {

	// store the stimuli and context numbers for easy data analysis
	stimMat.push(gameData.trials[ii][0]);
	contextMat.push(gameData.trials[ii][1]);

	// use the predrawn randomization functions to choose the appropriate image with the stimuli.
    var image = "/static/images/S"+ stimKey[gameData.trials[ii][contextID[0]]] 
              + "_C" + contextKey[gameData.trials[ii][contextID[1]]] + ".png";
    imageMat.push(image);
    preload_set[image] = true; // put the images in the set if it wasn't already there

    probMat.push(1);
    
    // set the reward outcomes
    rewardOutcomes.push(gameData.rewards[ii]);
    
    // Misc
    trialTypeMat.push(gameData.trial_type[ii])        
}
*/

var boxImgs  = ['/static/images/box1.jpg','/static/images/box2.jpg'];
var goalImgs = ['/static/images/goal1.png','/static/images/goal2.png','/static/images/goal3.png'];
var goalAsks = []

var banditTrial = {
    type     : 'banditTask',
    boxImgs  : boxImgs     ,
    goalImgs : goalImgs    ,
    probs    : [0.8, 0.2]  ,
    inputKeys: ['f','j']   ,
    timeLimit: 5
};

/*
var banditTask = {
        type          : 'banditTask',
        stimuli       : stimMat,
        contexts      : contextMat,
        images_path   : imageMat,
        // outcomes: outcomeMat,
        rewardOutcomes: rewardOutcomes,
        value         : valueMat,
        trialType     : trialTypeMat,
        prob          : probMat,
        choices       : ['h','j','k','l'],
        choiceKey     : keyDecoder,
        feedback_duration: feedback_duration,
        feedback_delay   : feedback_delay,
        timing_post_trial: timing_post_trial,
        timing_response  : timing_response,
        continue_after_response: true,
        show_score       : true,
        prompt: "<p class='jspsych-single-stim-prompt'><br/> Press one of the following keys: <br/><br/> &#34H&#34  &nbsp; &#34J&#34 &nbsp; &#34K&#34 &nbsp; &#34L&#34 </p>",
};
*/

// Setup the experiment
timeline = [];
timeline.push(banditTrial)
//timeline.push(banditTask);
//timeline.push(debrief_block);
timeline.push(instructions_survey_block2);

// All pages to be loaded after Ad page which, accepted, splashes to consent page. 
var pages = ["instruct.html","stage.html","questionnaire.html"];

var images = ["/static/images/lit.jpg",
              "/static/images/normal.jpg",
              "/static/images/indOn.jpg",
              "/static/images/indOff.jpg"
];

psiTurk.preloadPages(pages);
psiTurk.preloadImages(images);

var instructionPages = ["instruct.html"];

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
        instructionPages,                              // a list of pages you want to display in function
        function() { currentview = new experiment(); } // what you want to do when you are done with instructions
    );
});

function experiment(){ 
    jsPsych.init({timeline: timeline
    /*
        on_finish: function(data) {
            psiturk.saveData({
                success: function () {
                    psiturk.completeHIT();
                }
            });
        },
        
        on_data_update: function(data) {
            psiturk.recordTrialData(data);
        }
    */
    })
}