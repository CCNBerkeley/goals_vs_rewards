//------------------------------------------------------------//
// This file defines the "actual" goals-vs-rewards task. 
//------------------------------------------------------------//
var experiment = function() {
	var choice_start;
	var too_late_timer;

	var box_images  = ["/static/images/box1.jpg","/static/images/box2.jpg"];
	var goal_images = ["/static/images/goal1.png",
					   "/static/images/goal2.png",
					   "/static/images/goal3.png"];
	var subphase    = "goals";
	var listening   = false;
	var stim_order  = [0,1,0];
	var succ_probs  = [0.8,0.2];
	var goal_avail  = [0,2];
	var goal_ind    = 1;
	//stim_order = _.shuffle(stim_order);

	// This updates the goals which will be displayed as availabe choices.
	function updateAvail(goal_ind,goal_avail){
		var goal_chosen = goal_avail[goal_ind];
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
	function tooLate(){
		listening = false;
		var response = "";

		d3.select("#trial").style("display","none");

		var too_long_text = "<h1>Sorry, you took to long!</h1><body>Please respond faster next time.<body>"
		var too_long_div  = d3.select("#container-exp").append("div").html(too_long_text);
		too_long_div.attr("id","too-long-div")

		setTimeout(function(){
			d3.select("#too-long-div").remove();
			var resp_time = -1;
			recordAndContinue(resp_time,response);
		},2000)
	};

	// This records data and continues the experiment.
	function recordAndContinue(resp_time,response){
//		var cur_probs  = (cur_order == 0) ? succ_probs:succ_probs.reverse();
//		var goal_found = Math.random() < cur_probs(goal_ind);

		psiTurk.recordTrialData({'phase'     :"TEST",
                                 'response'  :response,
                                 //'goal_found':goal_found,
                                 'resp_time' :resp_time}
                               );
		switch (subphase){
			case "goals":
				subphase = "boxes";
				break;
			case "boxes":
				subphase = "goals"
				break;
		}

		if (resp_time > 0){
			var wait_time = 2000;
			d3.select("#img" + rem_ind).remove();
			d3.select("#query").html('<p id="prompt">Your selection ...</p>');			
		}
		else{
			var wait_time = 0;
		}

		setTimeout(function(){
			d3.select("#img0").remove();
			d3.select("#img1").remove();
			nextStep();
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
			too_late_timer = setTimeout(tooLate,2000);
		}
	};

	// This is used to advance through the goal-fixation-box cycle.
	var nextStep = function() {
		if (stim_order.length===0) {
			finish();
		}
		else {
			if (subphase == "goals"){
				d3.select("#trial").style("display","inline");
				goal_avail = updateAvail(goal_ind,goal_avail)
				var goals = [goal_images[goal_avail[0]], goal_images[goal_avail[1]]];
				displayChoice(goals)
			}
			else {
				d3.select("#trial").style("display","none");
				d3.select("#fixation").style("display","inline");

				var cur_order  = stim_order.shift();
				var stim       = (cur_order == 0) ? box_images:box_images.reverse();
				setTimeout(function(){displayChoice(stim);},500);
			}
		}
	};
	
	// Takes input...
	var response_handler = function(e) {
		if (!listening) return;

		var keyCode = e.keyCode
		var	response;

		switch (keyCode) {
			case 70: // "F"
				response = "left";
				goal_ind = 0;
				rem_ind  = 1;
				break;
			case 74: // "J"
				response = "right";
				goal_ind = 1;
				rem_ind  = 0;
				break;
			default:
				response = "";
				break;
		}
		if (response.length > 0) {
			var resp_time  = new Date().getTime() - choice_start;
			listening = false;
			clearTimeout(too_late_timer);
			recordAndContinue(resp_time,response);
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
	nextStep();
};