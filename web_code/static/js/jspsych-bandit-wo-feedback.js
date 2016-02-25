/**
 * jspsych-bandit-w-feedback
 *
 * plugin for the change-point memory task
 *
 *
 **/

(function($) {
	jsPsych["bandit-wo-feedback"] = (function() {

		var plugin = {};
		
		//Define global variables for display
		var totalScore = 0;
		var rewOutcome = 0;
		
		
		plugin.create = function(params) {

			params = jsPsych.pluginAPI.enforceArray(params, ['stimuli', 'choices', 'data']);

			var trials = new Array(params.stimuli.length);
			for (var i = 0; i < trials.length; i++) {
				trials[i] = {};
				trials[i].a_path = params.images_path[i];
				trials[i].choices = params.choices;
				trials[i].choiceKey = params.choiceKey;
				
				// outcomes
				// trials[i].outcomes = params.outcomes[i];
				trials[i].rewardOutcomes = params.rewardOutcomes[i];
				
				// option to show image for fixed time interval, ignoring key responses
				//      true = image will keep displaying after response
				//      false = trial will immediately advance when response is recorded
				trials[i].continue_after_response = (typeof params.continue_after_response === 'undefined') ? true : params.continue_after_response;
				
				// timing parameters
				trials[i].timing_iti = params.timing_iti;
				trials[i].max_response_time = params.timing_max_response_time || -1; // if -1, then wait for response forever
				trials[i].timing_between_response_and_feedback = params.timing_between_response_and_feedback;
				trials[i].feedback_display_time = params.feedback_display_time; 
				
				// optional parameters
				trials[i].is_html = (typeof params.is_html === 'undefined') ? false : params.is_html;
				trials[i].prompt = (typeof params.prompt === 'undefined') ? "" : params.prompt;

				//
				trials[i].value = params.value;
				
				// store for data analysis
				trials[i].trialType = params.trialType[i];
                trials[i].stimulus = params.stimuli[i];
                trials[i].context = params.contexts[i];
			}
			return trials;
		};


		plugin.trial = function(display_element, trial) {
			
			// clear the display
			display_element.html('');
			
			// if any trial variables are functions
			// this evaluates the function and replaces
			// it with the output of the function
			trial = jsPsych.pluginAPI.normalizeTrialVariables(trial);

			// display fixation cross
			display_element.append($('<div>', {
				"class": 'jspsych-centered-text',
				html: "+",
			}));
			
			reward = 0;
			// Display the value for 2 seconds, show blank screen for 0.5 s, then proceed with the trial.
			setTimeout(function() {
				
				display_element.html('');
				
				setTimeout(function() {
				
					// this array holds handlers from setTimeout calls
					// that need to be cleared if the trial ends early
					var setTimeoutHandlers = [];
					
					// display stimulus
					if (!trial.is_html) {
						display_element.append($('<img>', {
							src: trial.a_path,
							class: 'jspsych-single-stim-stimulus'
						}));
					} else {
						display_element.append($('<div>', {
							html: trial.a_path,
							id: 'jspsych-single-stim-stimulus'
						}));
					}

					//show prompt if there is one
					if (trial.prompt !== "") {
						display_element.append(trial.prompt);
					}
					
					// store response
					var response = {rt: -1, key: -1};

					// function to end trial when it is time
					var end_trial = function() {

						// kill any remaining setTimeout handlers
						for (var i = 0; i < setTimeoutHandlers.length; i++) {
							clearTimeout(setTimeoutHandlers[i]);
						}

						// kill keyboard listeners
						jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);

						// gather the data to store for the trial
						var trial_data = {
							"rt": response.rt,
							"stimulus": trial.stimulus,
                            "context": trial.context,
                            "imagefile": trial.a_path,
							"key_press": key_press,
							"response": responseID,
							"rewOutcome": rewOutcome,
							"outcome": outcome,
							"trialType": trial.trialType,
						};

						jsPsych.data.write($.extend({}, trial_data, trial.data));

						// clear the display
						//display_element.html('');

						// displayOutcome();

						// move on to the next trial
						setTimeout(function() {
							displayFeedback();
						}, trial.timing_between_response_and_feedback); // Controls time between outcome and feedback in the training 
					};

					// Did the subject choose to play?
					var play = 1; 
					
					// what was the trial outcome?
					var outcome =[];
					
					
					// Did the subject press a key?
					var responseID = -1;
					var key_press = -1;
					
					// function to handle responses by the subject
					var after_response = function(info) {

						display_element.html('');

						/* decode responses */
						responseID = trial.choiceKey[info.key];
						key_press = info.key;

						// new code -- if outcome is moved below
						// outcome = trial.outcomes[responseID];
						rewOutcome = trial.rewardOutcomes[responseID];
						if (rewOutcome == 1) {
							rewOutcome = trial.value[0];
						} else {
							rewOutcome = trial.value[1];
						};
						totalScore += rewOutcome;
						
						// only record the first response
						if(response.key == -1){
							response = info;
						}

						if (trial.continue_after_response) {
							// response triggers the next trial in this case.
							// if hide_image_after_response is true, then next
							// trial should be triggered by timeout function below.
							end_trial();
						}

					};

					
					// start the response listener
					var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse(after_response, trial.choices);

					// hide image if timing is set 
					if (trial.timing_stim > 0) {
						var t1 = setTimeout(function() {
							$('#jspsych-single-stim-stimulus').css('visibility', 'hidden');
						}, trial.timing_stim);
						setTimeoutHandlers.push(t1);
					}

					// end trial if time limit is set
					if (trial.max_response_time > 0) {
						var t2 = setTimeout(function() {
							end_trial();
						}, trial.max_response_time);
						setTimeoutHandlers.push(t2);
					}

					// // Show Outcome
					// function displayOutcome() {
					// 	display_element.html(''); // remove all
					// 	if (responseID > -1) {
					// 		display_element.append($('<img>', {
					// 			src: outcome,
					// 			class: 'jspsych-single-stim-stimulus'
					// 		}));
					// 	};
					// 	setTimeout(function() {
							
					// 		display_element.html('');
							
					// 		// Don't show score (Feedback, blank, end trial) ??? NTF: not sure what this does
					// 		setTimeout(function() {}, 250);
							
					// 	}, 2000);
					// };
					
					
					// Show feedback
					function displayFeedback(reward) {

						display_element.html(''); // remove all

						setTimeout(function() {
						
						// If the subject didn't press the correct key, tell them
						if (responseID == -1) {
							display_element.append($('<div>', {
								"class": 'jspsych-single-stim-feedback-tooslow',
								html: "<p>Respond Faster</p>",
							}));
						}
						// If the subject recieved a reward show the increase in value
						else if (rewOutcome == trial.value[0]) {
							display_element.append($('<div>', {
								"class": 'jspsych-single-stim-feedback-correct',
								html: "+" + rewOutcome
							}));
							display_element.append($('<div>', {
								"class": 'jspsych-single-stim-feedback-score',
								html: "Total Score: " + totalScore,
							}));
						}
						// If the subject played and this trial is not rewarded, show -10.
						else {
							display_element.append($('<div>', {
								"class": 'jspsych-single-stim-feedback-incorrect',
								html: "+" + rewOutcome
							}));
							display_element.append($('<div>', {
								"class": 'jspsych-single-stim-feedback-score',
								html: "Total Score: " + totalScore,
							}));
						}}, 0); // Not sure what this controls timing-wise
						

						setTimeout(function() {
							
							display_element.html('');
							
							// Don't show score (Feedback, blank, end trial) ??? NTF: not sure what this does
							setTimeout(function() {
								jsPsych.finishTrial();
							}, 0); // how long to show blank screen between fixation and trial??
							
						}, trial.feedback_display_time);	// How long to display feedback
					}


				}, 0); 
			}, trial.timing_iti);	// How long to display fixation cross
		
		};

		return plugin;
	})();
})(jQuery);
