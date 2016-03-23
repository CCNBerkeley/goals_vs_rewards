// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition      = condition;       // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
                                        // they are not used in the stroop code but may be useful to you

// Debuging test set or set from
var debug = true;
if (debug) {
	var train_set = [{boxes: "CD" ,
					 yield: false ,
			    	 order: 1   },

			    	{boxes: "CD" ,
					 yield: true ,
			    	 order: -1   },
	];

	// Very small test set:
	var test_set = [{boxes: "AB" ,
					 yield: true ,
			    	 order: 1   },

			    	{boxes: "CD" ,
					 yield: true ,
			    	 order: -1   },

			        {boxes: "AD",
			         yield: true,
			         order: -1  },

			        {boxes: "BC" ,
			         yield: false,
			         order: 1    }
	];
}
else {
/*	$.ajax({
		type: 'GET',
		url: '../../gameData.json',
		dataType: 'json',
		success: function(data) {gameData = data;},
		async: false
	});
*/};

var box_images  = {boxA: "/static/images/boxA.jpg",
				   boxB: "/static/images/boxB.jpg",
				   boxC: "/static/images/boxC.jpg",
				   boxD: "/static/images/boxD.jpg"};

var goal_images = ["/static/images/goal1.png",
				   "/static/images/goal2.png",
				   "/static/images/goal3.png"];

// All pages to be loaded after Ad page which, accepted, splashes to consent page. 
var pages = ["instruct.html","stage_inst.html","recap.html","stage.html","questionnaire.html"];

psiTurk.preloadPages (pages);
psiTurk.preloadImages(box_images);
psiTurk.preloadImages(goal_images);
psiTurk.preloadImages(["/static/images/fixation.jpg"]);

var instructionPages = ["instruct.html","stage_inst.html","recap.html"];

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
        instructionPages,
        function() {
        	currentview = new experiment(train_set,box_images,goal_images,"train");
        	//currentview = new experiment(train_set,box_images,goal_images,"learn")
        }
    );
         //,

        //function() { currentview = new experiment(train_set,box_images,goal_images,"learn");},
        //function() { currentview = new experiment(test_set ,box_images,goal_images,"test" );}
});