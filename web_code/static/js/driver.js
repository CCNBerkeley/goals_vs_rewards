// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition      = condition;       // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
                                        // they are not used in the stroop code but may be useful to you

var box_images  = ["/static/images/boxA.jpg","/static/images/boxB.jpg",
				   "/static/images/boxC.jpg","/static/images/boxD.jpg"];

var goal_images = ["/static/images/goal1.png",
				   "/static/images/goal2.png",
				   "/static/images/goal3.png"];

// All pages to be loaded after Ad page which, accepted, splashes to consent page. 
var pages = ["instruct.html","stage.html","questionnaire.html"];

psiTurk.preloadPages(pages);
psiTurk.preloadImages(box_images);
psiTurk.preloadImages(goal_images);

var instructionPages = ["instruct.html"];

// Task object to keep track of the current phase
var currentview;

// Data that must be passed into the experiment
var stims_train = [0,1,0];
var stims_test  = [1,0];
var box_content = [0];

// Define a task set for which 80% of 'good' choices in 'AB' yield rewards
// and 60% of 'good' choices in 'CD' yield rewards.
//
// Format: 
//   Col 1: Box choice pair label
//   Col 2: Better choice yields reward boolean
//   Col 3: Presentation order

// Very small test set:
var task_set = [["AB",true ,0],	// Pick correct/left get reward
			    ["AB",true ,1],	// 
			    ["AB",false,0],
			    ["AB",false,1],
			    ];

// Small test set:
/*
var task_set = [["AB",true ,0],
			    ["AB",true ,1],
			    ["AB",true ,0],
			    ["AB",true ,1],
			    ["AB",false,0],

			    ["CD",true ,0],
			    ["CD",true ,1],
			    ["CD",false,0],
			    ];
*/

// Big test set:
/*
var task_set = [["AB",true ,0],
			    ["AB",true ,1],
			    ["AB",true ,0],
			    ["AB",true ,1],
			    ["AB",false,0],

			    ["AB",true ,1],
			    ["AB",true ,0],
			    ["AB",true ,1],
			    ["AB",true ,0],
			    ["AB",false,1],

			    ["CD",true ,0],
			    ["CD",true ,1],
			    ["CD",false,0],

			    ["CD",true ,1],
			    ["CD",true ,0],
			    ["CD",false,1],
			    ];
*/

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
        instructionPages,
        //function() {currentview = new example(stim_order, succ_probs);}
        function() { currentview = new experiment(task_set,box_images,goal_images);} 
    );
});