//------------------------------------------------------------//
// Below is the ct_bact experiment.
//
// A brief overview of experiment control flow:
// - begin()
//
//------------------------------------------------------------//
var experiment = function() {
	var wordon, // time word is presented
	    listening = false;

	var stims = [
			["/static/images/goal1.png","/static/images/goal2.png"],
			["/static/images/goal2.png","/static/images/goal3.png"],
			["/static/images/goal2.png","/static/images/goal3.png"],
		];

	stims = _.shuffle(stims);

	function displayStim(stim){
		d3.select("#trial").style("display","inline");
	    d3.select("#fixation").style("display","none");

		show_choice(stim[0],stim[1]);

		wordon = new Date().getTime();
		listening = true;
		d3.select("#query").html('<p id="prompt">Type "F" selects left, "J" to selects right.</p>');
	};

	var nextCycle = function() {
		if (stims.length===0) {
			finish();
		}
		else {
			d3.select("#trial").style("display","none");
			d3.select("#fixation").style("display","inline");

			stim = stims.shift();
			timeout_handle = setTimeout(function(){displayStim(stim);},2000);
		}
	};
	
	var response_handler = function(e) {
		if (!listening) return;

		var keyCode = e.keyCode,
			response;

		switch (keyCode) {
			case 70: // "F"
				response="left";
				break;
			case 74: // "J"
				response="right";
				break;
			default:
				response = "";
				break;
		}
		if (response.length > 0) {
			listening = false;
			var hit = response == stim[1];
			var rt = new Date().getTime() - wordon;

			psiTurk.recordTrialData({'phase'   :"TEST",
                                     //;'word'    :stim[0],
                                     //;'color'   :stim[1],
                                     //'relation':stim[2],
                                     'response':response,
                                     //'hit'     :hit,
                                     'rt'      :rt}
                                   );
			remove_images();
			nextCycle();
		}
	};

	var show_choice = function(src1, src2) {
		d3.select("#item1")
			.append("img")
			.attr("id","img1")
			.attr("src",src1)

		d3.select("#item2")
			.append("img")
			.attr("id","img2")
			.attr("src",src2)
	};

	var remove_images = function() {
		d3.select("#img1").remove();
		d3.select("#img2").remove();
	};

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
	nextCycle();
};