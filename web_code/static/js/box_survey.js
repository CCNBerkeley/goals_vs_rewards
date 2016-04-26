/****************
* Questionnaire *
****************/
var box_survey = function(instructionPages,instance_number) {


	if (instance_number == 1){
		var phase = 'box_survey_pre'
		var instruct_html = "<h1>Pre-Study Survey</h1> <hr> <p> Before proceeding, please indicate any unconsidered (i.e. \"gut\") preferences you have for the boxes below.</p>"
	}
	else{
		var phase = 'box_survey_post'
		var instruct_html = "<h1>Post-Study Survey</h1> <hr> <p> As before, please indicate gut preferences you have for the boxes below.</p>"
	};

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData({'phase':phase, 'status':'submit'});

		// $('input').each( function(i, val) {
		// 	psiTurk.recordUnstructuredData(this.id, this.value);		
		// });
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});
	};

	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
			    clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){finish()}); 
			}, 
			error: prompt_resubmit
		});
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('box_survey.html');
	d3.select('#instructions').html(instruct_html)
	psiTurk.recordTrialData({'phase':phase, 'status':'begin'});
	
	$("#submit").click(function () {
		var success = formcheck()

		if (success) {
		    record_responses();
		    psiTurk.saveData({
	            
	            success: function(){
	            	if (instance_number == 1){ 
					    psiTurk.doInstructions(
					        instructionPages,
					        function() {
					        	currentview = new experiment(train_set,box_images,goal_images,"train");
					        	//currentview = new experiment(train_set,box_images,goal_images,"learn")
					    	}
					    )
	            	}
	            	else {
			    		currentview = new Questionnaire();
	            	}
	            
	            }, // for some reason when prompt_resubmit gets triggered below, replaceBody can't be found ...
	            error: prompt_resubmit
	        });
		}
	});
    
	
};

function formcheck() {
  var fields = $(".ss-item-required").find("input").serializeArray();
  var success = (fields.length == 4)

  if (!success){alert("Please rate each item.")}

  return success
}
