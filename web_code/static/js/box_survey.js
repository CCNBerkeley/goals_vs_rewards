/****************
* Questionnaire *
****************/
var box_survey = function(instructionPages,call_time) {


	// Set variables which depend on whether this is pre or post task set.
	if (call_time == 'pre_task_call'){
		var phase        = 'box_survey_pre'
		var header_inner = 'Pre-Study Survey'
		var prompt_inner = 'Before proceeding, please indicate any unconsidered (i.e. \"gut\") preferences you have for the boxes below.'
	}
	else{
		var phase        = 'box_survey_post'
		var header_inner = 'Post-Study Survey'
		var prompt_inner = 'As before, please indicate gut preferences you have for the boxes below.'
	};

	var error_message = "<h1>Oops!</h1> <p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	// Function for saving user responses.
	record_responses = function() {
		psiTurk.recordTrialData({'phase':phase, 'status':'submit'});

		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});
	};


	// Functions for resubmitting after failed submit.
	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: success_function,
			error  : prompt_resubmit
		});
	};


	// What to do if the submission is successful
	succuss_function = function() {
    	if (call_time == 'pre_task_call'){ 
    		psiTurk.doInstructions(
		      instructionPages,
		      function() {currentview = new experiment(train_set,box_images,goal_images,"train")}
		    )
    	}
    	else {
    		currentview = new Questionnaire();
    	}
    }


	// Function for checking the form is filled out.
	function formcheck() {
		var fields  = $(".ss-item-required").find("input").serializeArray();
		var success = (fields.length == 4)

		if (!success){alert("Please rate each item.")}

		return success
	}


	// Load the questionnaire snippet 
	psiTurk.showPage('box_survey.html');

	d3.select('#header').html(header_inner)
	d3.select('#prompt').html(prompt_inner)
	
	psiTurk.recordTrialData({'phase':phase, 'status':'begin'});
	

	// Bind submit key
	$("#submit").click(function () {
		var success = formcheck()

		if (success) {
		    record_responses();
		    psiTurk.saveData({
	            success: succuss_function,
	            error  : prompt_resubmit
	        });
		}
	});

};


