/****************
* Questionnaire *
****************/
var survey = function(instructionPages,page) {


	// Set variables which depend on whether this is pre or post task set.
	switch(page){
		case 'box_survey_pre':
			var header_inner = 'Pre-Study Survey'
			var prompt_inner = 'Before proceeding, please indicate any unconsidered (i.e. \"gut\") preferences you have for the images below.'
			var num_items_to_rate = 4
			break

		case 'box_survey_post':
			var header_inner = 'Post-Study Survey'
			var prompt_inner = 'As before, please indicate gut preferences you have for the images below.'
			var num_items_to_rate = 4
			break

		case 'goal_survey_pre':
			var header_inner = 'Pre-Study Survey'
			var prompt_inner = 'Before proceeding, please indicate any unconsidered (i.e. \"gut\") preferences you have for the images below.'
			var next_survey  = 'box_survey_pre'
			var num_items_to_rate = 3
			break

		case 'goal_survey_post':
			var header_inner = 'Post-Study Survey'
			var prompt_inner = 'As before, please indicate gut preferences you have for the images below.'
			var next_survey  = 'box_survey_pre'
			var num_items_to_rate = 3
			break
	}

	// This function generates the HTML on the survey page
	function generatePage() {
		var labels = ['I really dislike it', 'I dislike it', 'I\'m indifferent', 'I like it', 'I really like it']
		for (var i=1; i <= num_items_to_rate; i++){
			if (page.slice(0,3) == 'box') {
				var html_img_prefix = 'box'
			}
			else{
				var html_img_prefix = 'goal'
			};

			var html_img   = '<img src="/static/images/' + html_img_prefix + i + '.jpg">'
			var html_div   = '<div class="ss-item-required-' + i + '"> </div> <br>' 
			var html_table = '<table> <tr> <td id="img-td"> ' + html_img + ' </td> <td id="input-td-' + i +'"> </td> </tr> </table>'

			$('#survey').append(html_div)
			$('.ss-item-required-' + i).append(html_table)

			for (var j=0; j < 5; j++) {
				var html_input = '<input type="radio" name="input' + i +'" value="' + j + '">' + labels[j] + '<br>'
				$('#input-td-' + i).append(html_input)
			}
		}
	}

	// psiTurk error message...
	var error_message = "<h1>Oops!</h1> <p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	// Function for saving user responses.
	record_responses = function() {
		psiTurk.recordTrialData({'phase':page, 'status':'submit'});

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
		switch (page){
			case 'goal_survey_pre':
	         currentview = new survey(instructionPages,'box_survey_pre');
				break

			case 'box_survey_pre':
	    		psiTurk.doInstructions(
			      instructionPages,
			      function() {currentview = new experiment(train_set,box_images,goal_images,"train")}
			    )
				break

			case 'goal_survey_post':
	         currentview = new survey([],'box_survey_post');
				break

			case 'box_survey_post':
	    		currentview = new Questionnaire();
				break
		}
    }


	// Function for checking the form is filled out.
	function formcheck() {
		var fields  = $('[class^="ss-item-required"]').find("input").serializeArray();
		var success = (fields.length == num_items_to_rate)

		if (!success){alert("Please rate each item.")}

		return success
	}


	// Load the questionnaire snippet 
	psiTurk.showPage('survey.html');
	generatePage()

	d3.select('#header').html(header_inner)
	d3.select('#prompt').html(prompt_inner)
	
	psiTurk.recordTrialData({'phase':page, 'status':'begin'});
	

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


