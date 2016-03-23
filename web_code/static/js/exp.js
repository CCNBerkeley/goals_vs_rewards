//------------------------------------------------------------//
// This file defines the "actual" goals-vs-rewards task. 
//------------------------------------------------------------//
var experiment = function(task_set,box_images,goal_images,phase) {
	var choice_start;
	var too_late_timer;

	// Initial setup. Since updateAvial will be called, goal_avail will be [0,1] at first presentation.
	var subphase    = "goals";
	var listening   = false;
	var goal_avail  = [0,2];
	var selection   = 1;					// Left item -> 0, right item -> 1
	var goal_picked = 1;

	if (phase == 'inst') {
		var task_set = [{boxes: "AB" ,
				 		 yield: true ,
		    	 		 order: 1   }];

		var resp_count  = 0;  				// How many times in a row has the subject responded in time?
		var resp_fail   = 0;  				// How many times in a row has the subject failed to respond?
		var gets_it = false;				// Is the subject ready to move on?
		var resp_thresh = 1;			    // Declare ready to continue if resp_count >= resp_thresh.
	};
	
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
		var resp_time = -1;

		if (phase == "inst") {
			d3.select("#img0").remove();
			d3.select("#img1").remove();
			d3.select("#header").html("Sorry, you took to long!")
			d3.select("#prompt").html("Please respond faster next time. <br> In the experiment you won't be notified, the next cycle will just start.")
	
			d3.select("#okbutton").style("display","inline");
	
			$('.okgotit').bind('click', function() {
				d3.select("#okbutton").style("display","none");
				$('.okgotit').unbind('');
				recordAndContinue(resp_time,response,phase);
			});
		}
		else {
			recordAndContinue(resp_time,response,phase);
		};
		//setTimeout(function(){
		//	var resp_time = -1;
		//	recordAndContinue(resp_time,response,phase);
		//},6000)
	};

	// This records data and continues the experiment.
	function recordAndContinue(resp_time,response,phase){
		var responded = resp_time > 0;		     	// Did the subject respond?

		var chosen_duration = 0.5*1000;				// Time for which the chosen item is shown
		var total_duration  = chosen_duration;      // In case of goals subphase, otherwise more (added to later)

		var fix_duration    = (subphase == "boxes") ? 0.5*1000:1;	// Fixation period length
		var result_duration = (subphase == "boxes") ? 1.0*1000:1;   // Time for which box contents are shown

		// Timeline:
		//   0   - Show the participant what they chose
		//   0.5 - Show box content if we're on box choice or proceed to doNextStep()
		//
		//   If on box choice:
		//   1.5 - Show fixation
		//   2.0 - Proceed to doNextStep
		if (responded){

			// If boxes subphase, assign correctness & reward
			switch (subphase){
				case "goals":
					var correct = -1
					var reward  = -1

					goal_picked = response;
					break;

				case "boxes":
					var correct = ((cur_order == 1 && response == 0) || (cur_order == -1 && response == 1));
					var reward  = (rew_corr_choice && correct) || (!rew_corr_choice && !correct);

					if (phase == 'inst') {resp_count++; resp_fail = 0}
					break;
			}

			// Show the participant what they chose
			d3.select("#img" + rem_ind).remove();
			d3.select("#fixation").style("display","none");

			if (phase == "inst") {d3.select("#prompt").html('<p id="prompt">Your Selection</p>')};


			// If we're opening boxes, we have to...
			//   1) increase the wait time before moving on
			//   2) show the content of the box
			if (subphase == "boxes") {

				var img_options = [goal_images[goal_avail[0]],goal_images[goal_avail[1]]];
				var box_content = (reward) ? img_options[goal_picked]:img_options[(goal_picked+1)%2];

				// Wait for chosen duration to end then show Result
				if (phase != "test") {
					setTimeout(function(){
						d3.select("#img" + (rem_ind+1) % 2).attr("src"   ,box_content);
						d3.select("#img" + (rem_ind+1) % 2).attr("srcset",box_content);
						
						if (phase == "inst") {d3.select("#prompt").html('<p id="prompt"> This Box\'s Contents</p>')};
					},chosen_duration)

					total_duration = total_duration + result_duration;
				};

				var addnl_time = (phase != "test") ? result_duration:0;
				// Wait for chosen duration and result duration to end, then show fixation
				setTimeout(function(){
					d3.select("#img" + rem_ind).remove();
					d3.select("#img" + (rem_ind+1) % 2).remove();
					d3.select("#fixation").style("display","inline");
					d3.select("#prompt").html('')
					d3.select('#header').style('visibility',"hidden");
				},chosen_duration + addnl_time)
				total_duration = total_duration + fix_duration;
			};
		}
		else {
			var correct = -1;
			var reward  = -1;
			if (phase == 'inst') {resp_count = 0; resp_fail++}
		};

		psiTurk.recordTrialData({'phase'     : phase,
								 'subphase'  : subphase,
                                 'response'  : response,
                                 'correct'   : correct,
                                 'reward'    : reward,
                                 'resp_time' : resp_time}
                               );

		if (phase == 'inst' && resp_count <= resp_thresh && subphase == 'boxes') {
			task_set.push(updateTrainingTask(cur_task))
		};

		if (responded) {
			subphase = (subphase == "goals") ? "boxes":"goals";
		}
		else {
			if (phase != "inst") {
				task_set.shift();
				//goal_picked = Math.floor(Math.random());
			}
			if (subphase == "goals") {
				goal_picked = Math.floor(Math.random()*2);
			};
			subphase = "goals";
		};

		setTimeout(function(){
			d3.select("#img0").remove();
			d3.select("#img1").remove();
			d3.select("#fixation").style("display","inline");
			doNextStep();
		},total_duration)
	};



	// This displays a choice between two options, be they goals or boxes.
	function displayChoice(choice){
		d3.select("#trial"   ).style("display","inline");
	    d3.select("#fixation").style("display","inline" );

	    if (phase == "inst"){
	    	d3.select('#header'  ).style('visibility',"visible");
	    }

		var prompt_text = '<p id="prompt">Type "F" to select the left item or "J" to select right item.</p>';
		d3.select("#prompt").html(prompt_text);

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
		//if (subphase == "boxes"){
			too_late_timer = setTimeout(expireUI,2000);
		//}
	};

	// This is used to advance through the goal-fixation-box cycle.
	var doNextStep = function() {
		if (task_set.length===0) {
			finish();
		}
		else {
			if (subphase == "goals"){
				d3.select("#trial"   ).style("display","inline");
				d3.select("#fixation").style("display","inline" );
				d3.select('#header'  ).html ("Please select an item.");

				if (phase == "inst") {
					d3.select('#header'  ).style('visibility',"visible");
				}

				goal_avail = updateAvail(goal_picked,goal_avail)
				var goals = [goal_images[goal_avail[0]], goal_images[goal_avail[1]]];

				if (phase == "inst" && Math.floor(Math.random()*2) == 1) {
					goals = goals.reverse();
				};
				displayChoice(goals)
			}
			else {
				//d3.select("#trial"   ).style("display","none");
				//d3.select("#fixation").style("display","none");

				cur_task = task_set.shift();

				cur_order       = cur_task.order;
				rew_corr_choice = cur_task.yield;

				var box_img_subset = [];
				switch (cur_task.boxes.slice(0,1)) {
					case "A":
						box_img_subset[0] = box_images.boxA;
						break;
					case "B":
						box_img_subset[0] = box_images.boxB;
						break;
					case "C":
						box_img_subset[0] = box_images.boxC;
						break;
					case "D":
						box_img_subset[0] = box_images.boxD;
						break;
				}

				switch (cur_task.boxes.slice(1,2)) {
					case "A":
						box_img_subset[1] = box_images.boxA;
						break;
					case "B":
						box_img_subset[1] = box_images.boxB;
						break;
					case "C":
						box_img_subset[1] = box_images.boxC;
						break;
					case "D":
						box_img_subset[1] = box_images.boxD;
						break;
				}

				var box_options = (cur_order == 1) ? box_img_subset:box_img_subset.reverse();

				//setTimeout(function(){
					d3.select('#header'  ).html ("Please select a box to look in.");
					displayChoice(box_options);
				//},500);
			}
		}
	};
	
	function updateTrainingTask(task){
		var new_boxes = (task.boxes == "AB") ? "CD" :"AB";
		var new_yield = (task.yield        ) ? false:true;
		var new_order = (task.order == 1   ) ? -1   :1   ;

		return {boxes:new_boxes, yield:new_yield, order:new_order}
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

		switch (phase) {
        	case 'inst':
				d3.select("#stage_inst_button_row").style("display","inline")
				d3.select("#prompt").html("It looks like you're getting the hang of it. <br> You may continue or re-read the instructions. <br>")
        		//psiTurk.showPage("recap.html")
        		/*
        	    psiTurk.doInstructions(
			        ["recap.html"],
			        function() {
			        	currentview = new experiment(train_set,box_images,goal_images,"train");
			        	//currentview = new experiment(train_set,box_images,goal_images,"learn")
			        })
	        	//currentview = new experiment(train_set,box_images,goal_images,"train");
	        	*/
	        	break;

		    case 'train':
        		psiTurk.showPage("train_test_partition.html");
		
				$('.okgotit').bind('click', function() {
					$('.okgotit').unbind('');
	        		currentview = new experiment(test_set,box_images,goal_images,"test" );
				});
	        	break;

			case 'test':
		    	currentview = new Questionnaire();
		    	break;
        }
	};

	// Load the stage.html snippet into the body of the page

	if (phase != "inst") {
		psiTurk.showPage('stage.html');
		d3.select('#header').style("visibility","hidden");
		d3.select('#prompt').style("visibility","hidden");
	};

	// Register the response handler that is defined above to handle any
	// key down events.
	$("body").focus().keydown(response_handler); 

	// Start the test
	doNextStep();
};
