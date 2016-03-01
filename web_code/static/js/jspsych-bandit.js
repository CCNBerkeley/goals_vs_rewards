/**
 * jspsych-bandit-w-feedback
 * plugin for the change-point memory task
 **/


(function($) {
jsPsych.plugins["banditTask"] = (function() {

	var plugin = {};
	
	// 
	var totalScore = 0;
	var rewOutcome = 0;
	
	// Creates the trials' data structure
	plugin.create = function(params) {
		//params = jsPsych.pluginAPI.enforceArray(params, ['stimuli', 'choices', 'data']);

		var trials = new Array(params.stimuli.length);

		for (var i = 0; i < trials.length; i++) {
			trials[i] = {};
			trials[i].choices   = params.choices;
			trials[i].timeLimit = params.timeLimit || -1; // if -1, then wait for response forever
            trials[i].stimulus  = params.stimuli[i];
            trials[i].fixTime   = 2000;
		}
		return trials;
	};

	// Creates the Table that choices are laid out in.
 	function getChoiceHTML(boxes) {
		var row        = 1;
		var ncols      = 2;
		var image_size = [100,100];
 
		// create blank element to hold code that we generate
		$('body').append($('<div>', {
		  	id : 'jspsych-vsl-grid-scene-dummy',
		  	css: {display: 'none'}
		}));

		// create table
		$('#jspsych-vsl-grid-scene-dummy').append($('<table>', {
		  	id : 'jspsych-vsl-grid-scene-table',
		  	css: {
		    	'border-collapse': 'collapse',
		    	'margin-left'    : 'auto',
		    	'margin-right'   : 'auto'
		  	}
		}));

		$("#jspsych-vsl-grid-scene-table").append($('<tr>', {
			id : 'jspsych-vsl-grid-scene-table-row-' + row,
			css: { height: image_size[1] + "px" }
		}));

      	for (var col = 0; col < (ncols); col++) {
        	$("#jspsych-vsl-grid-scene-table-row-" + row).append($('<td>', {
          		id: 'jspsych-vsl-grid-scene-table-' + row + '-' + col,
          		css: {
            		padding: image_size[1] / 10 + "px " + image_size[0] / 10 + "px",
            		border : '1px solid #555'
          		}
        	}));

        	$('#jspsych-vsl-grid-scene-table-' + row + '-' + col).append($('<div>', {
          		id: 'jspsych-vsl-grid-scene-table-cell-' + row + '-' + col,
          		css: {
            		width : image_size[0] + "px",
            		height: image_size[1] + "px"
          		}
       		}));
      	}

      	for (var col = 0; col < (ncols); col++) {
        	if (boxes[col] !== 0) {
          		$('#jspsych-vsl-grid-scene-table-cell-' + row + '-' + col).append($('<img>', {
            		src: boxes[col],
            		css: {
              			width : image_size[0] + "px",
              			height: image_size[1] + "px",
            			}
          		}));
        	};
      	};

		var html_out = $('#jspsych-vsl-grid-scene-dummy').html();
		$('#jspsych-vsl-grid-scene-dummy').remove();

		return html_out;
	};

	function displayCross() {
		// Clear display then show fixation cross
		display_element.html('');
		display_element.append($('<div>', {
			"class": 'jspsych-centered-text',
			html   : "+",
		}));
	}

	function displayChoice(boxes){
		display_element.html(getChoiceHTML(boxes));
		display_element.append($('<div>', {
			"class": 'jspsych-centered-text',
			html   : "Please press 'f' or 'j'.",
		}));
	}

	function handleResponse(info){
		display_element.html('');

		/* decode responses */
		key_press  = info.key;

		// new code -- if outcome is moved below
		// outcome = trial.outcomes[responseID];
		//rewOutcome = trial.rewardOutcomes[responseID];
		if (rewOutcome == 1) {rewOutcome = trial.value[0];}
		else {rewOutcome = trial.value[1];};
		totalScore += rewOutcome;
		
		// only record the first response
		//if(response.key == -1){ response = info; }

		if (trial.continue_after_response) { end_trial(); }
	}

	function endTrial(keyboardListener, setTimeoutHandlers) {

		// kill any remaining setTimeout handlers
		for (var i = 0; i < setTimeoutHandlers.length; i++) {
			clearTimeout(setTimeoutHandlers[i]);
		}

		// kill keyboard listeners
		jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);

		// gather the data to store for the trial
		var trial_data = {
			"rt"        : response.rt,
			"stimulus"  : trial.stimulus,
            "context"   : trial.context,
            "imagefile" : trial.a_path,
			"key_press" : key_press,
			"response"  : responseID,
			"rewOutcome": rewOutcome,
			"outcome"   : outcome,
			"trialType" : trial.trialType,
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

	// Definition of a trial
	plugin.trial = function(display_element, trial, choices) {

		// Display the value for 2 seconds, show blank screen for 0.5 s, then proceed with the trial.
		setTimeout(function() {
			displayCross()

			setTimeout(function() {
				displayChoice(trial.stimuli[0])

				var setTimeoutHandlers = [];
				var response = {rt: -1, key: -1};
				var play = 1; 
				var outcome =[];
				var responseID = -1;
				var key_press = -1;

				// start the response listener
				var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
					callback_function: handleResponse,
					valid_responses  : choices,
					rt_method        : 'date',
					persist          : false
				});

				// hide image if timing is set 
				if (trial.timing_stim > 0) {
					var t1 = setTimeout(function() {
						$('#jspsych-single-stim-stimulus').css('visibility', 'hidden');
					}, trial.timing_stim);
					setTimeoutHandlers.push(t1);
				}

				// end trial if time limit is set
				if (trial.timeLimit > 0) {
					var t2 = setTimeout(function() {
						end_trial(keyboardListener, setTimeoutHandlers);
					}, trial.timeLimit);
					setTimeoutHandlers.push(t2);
				}

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
						}}
					, 0); // Not sure what this controls timing-wise
					

					setTimeout(function() {
						
						display_element.html('');
						
						// Don't show score (Feedback, blank, end trial) ??? NTF: not sure what this does
						setTimeout(function() {
							jsPsych.finishTrial();
						}, 0); // how long to show blank screen between fixation and trial??
						
					}, trial.feedback_display_time);	// How long to display feedback
				}
			}, trial.fixTime); 
		}, trial.fixTime);	// How long to display fixation cross
	
	};

	return plugin;
})();

})(jQuery);
