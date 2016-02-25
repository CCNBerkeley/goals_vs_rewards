
/* keep a set of all the images files to preload */
preload_set = {};

// preload the used stimuli
var images_preload = Object.keys(preload_set);

/* pick a game to load from file */
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

/* loop through the trials and set the stimuli */
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
    
    /* set the reward outcomes */
    rewardOutcomes.push(gameData.rewards[ii]);
    
    /* Misc */
    trialTypeMat.push(gameData.trial_type[ii])        
}

var banditTask = {
        type          : 'bandit-wo-feedback',
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

// Setup the experiment
experiment.push(welcome_block);
/*
experiment.push(game_instructions);
experiment.push(game_instructions_2); 
experiment.push(game_instructions_3);
//experiment.push(banditTask);
experiment.push(debrief_block);
experiment.push(instructions_survey_block2);
experiment.push(survey_likert); */

/* start the experiment */
//psiturk.preloadImages(images_preload, function(){ startExperiment(); });
psiturk.preloadImages(function(){ startExperiment(); });

function startExperiment(){
    jsPsych.init({
        timeline: experiment
        /*
        display_element: $('#jspsych-target'),
        experiment_structure: experiment,
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
    });
}