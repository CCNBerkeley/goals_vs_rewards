//------------------------------------------------------------//
// This file defines the "actual" goals-vs-rewards task. 
//------------------------------------------------------------//
var experiment = function(task_set,box_images,goal_images) {
	var choice_start;
	var too_late_timer;

	// Initial setup. Since updateAvial will be called, goal_avail will be [0,1] at first presentation.
	var subphase    = "goals";
	var listening   = false;
	var goal_avail  = [0,2];
	var selection   = 1;					// Left item -> 0, right item -> 1
	var goal_picked = 1;
	var phase       = "training";			// Protocal section: training or testing
	
	//stims_train = _.shuffle(stims_train);

	// This updates the goals which will be displayed as availabe choices.
	function updateAvail(selection,goal_avail){
		goal_chosen = goal_avail[selection];
		switch (goal_chosen) {
			case 0:
				return [1,2];
				break;
			case 1:
				return [0,2];
				break;
			case 2:
				return [0,1];
				break;
		}
	};

	// This runs when a participant runs out of time on a non-goal trial.
	function expireUI(){
		listening = false;
		var response = -1;

		d3.select("#trial").style("display","none");

		var too_long_text = "<h1>Sorry, you took to long!</h1><body>Please respond faster next time.<body>"
		var too_long_div  = d3.select("#container-exp").append("div").html(too_long_text);
		too_long_div.attr("id","too-long-div")

		setTimeout(function(){
			d3.select("#too-long-div").remove();
			var resp_time = -1;
			recordAndContinue(resp_time,response,phase);
		},2000)
	};

	// This records data and continues the experiment.
	function recordAndContinue(resp_time,response,phase){

		var responded   = resp_time > 0;			// Did the subject respond?
		var wait_time   = (responded) ? 2000:0; 	// Time until doNextStep()

		if (responded){
			switch (subphase){
				case "goals":
					var correct = -1
					var reward  = -1

					goal_picked = response;
					break;

				case "boxes":
					var correct = ((cur_order == 0 && response == 0) || (cur_order == 1 && response == 1));
					var reward  = (rew_corr_choice && correct) || (!rew_corr_choice && !correct);
					break;
			}

			d3.select("#img" + rem_ind).remove();
			d3.select("#query").html('<p id="prompt">Your selection ...</p>');		

			if (subphase == "boxes") {

				var img_options = [goal_images[goal_avail[0]],goal_images[goal_avail[1]]];
				var box_content = (reward) ? img_options[goal_picked]:img_options[(goal_picked+1)%2];

				setTimeout(function(){
					d3.select("#img" + (rem_ind+1) % 2).attr("src"   ,box_content);
					d3.select("#img" + (rem_ind+1) % 2).attr("srcset",box_content);
					d3.select("#query").html('<p id="prompt"> Outcome ...</p>');
				},2000)

				wait_time = wait_time + 2000;
			};
		}
		else {
			var correct = -1;
			var reward  = -1;
		};

		psiTurk.recordTrialData({'phase'     : phase,
								 'subphase'  : subphase,
                                 'response'  : response,
                                 'correct'   : correct,
                                 'reward'    : reward,
                                 'resp_time' : resp_time}
                               );

		subphase = (subphase == "goals") ? "boxes":"goals";

		setTimeout(function(){
			d3.select("#img0").remove();
			d3.select("#img1").remove();
			doNextStep();
		},wait_time)
	};

	// This displays a choice between two options, be they goals or boxes.
	function displayChoice(choice){
		d3.select("#trial").style("display","inline");
	    d3.select("#fixation").style("display","none");
		d3.select("#query").html('<p id="prompt">Type "F" selects left, "J" to selects right.</p>');

		d3.select("#item0")
			.append("img")
			.attr("id","img0")
			.attr("src",choice[0])

		d3.select("#item1")
			.append("img")
			.attr("id","img1")
			.attr("src",choice[1])

		choice_start = new Date().getTime();
		listening = true;
		if (subphase == "boxes"){
			too_late_timer = setTimeout(expireUI,2000);
		}
	};

	// This is used to advance through the goal-fixation-box cycle.
	var doNextStep = function() {
		if (task_set.length===0) {
			finish();
		}
		else {
			if (subphase == "goals"){
				d3.select("#trial").style("display","inline");
				goal_avail = updateAvail(goal_picked,goal_avail)
				var goals = [goal_images[goal_avail[0]], goal_images[goal_avail[1]]];
				displayChoice(goals)
			}
			else {
				d3.select("#trial").style("display","none");
				d3.select("#fixation").style("display","inline");

				var cur_task = task_set.shift();

				cur_order       = cur_task[2];
				rew_corr_choice = cur_task[1];

				var box_img_subset = [];
				switch (cur_task[0]) {
					case "AB":
						box_img_subset = box_images.slice(0,2);
						break;
					case "BC":
						box_img_subset = box_images.slice(2,4);
						break;
				}

				var box_options = (cur_order == 0) ? box_img_subset:box_img_subset.reverse();

				setTimeout(function(){displayChoice(box_options);},500);
			}
		}
	};
	
	// Takes input...
	var response_handler = function(e) {
		if (!listening) return;

		var keyCode = e.keyCode
		var	response;

		// response and selection are the same, need to simplify this
		switch (keyCode) {
			case 70: // "F"
				response  = 0;
				selection = 0;
				rem_ind   = 1;
				break;
			case 74: // "J"
				response  = 1;
				selection = 1;
				rem_ind   = 0;
				break;
			default:
				response = -1;
				break;
		}
		if (response > -1) {
			var resp_time  = new Date().getTime() - choice_start;
			listening = false;
			clearTimeout(too_late_timer);
			recordAndContinue(resp_time,response,phase);
		}
	};

	// This moves the participant out of the experimental task
	// and on to the questionaire.
	var finish = function() {
	    $("body").unbind("keydown", response_handler); // Unbind keys
	    currentview = new Questionnaire();
	};
	


	// Load the stage.html snippet into the body of the page
	psiTurk.showPage('stage.html');

	// Register the response handler that is defined above to handle any
	// key down events.
	$("body").focus().keydown(response_handler); 

	// Start the test
	doNextStep();
};
