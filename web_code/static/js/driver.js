// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition      = condition;       // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
                                        // they are not used in the stroop code but may be useful to you

// Debugging flag changes multiple aspects of the code.
var debug = true;

if (debug) {
	// Overwrites the loaded data;
	train_set = debug_train_set
   test_set  = debug_test_set
};

var box_images = {box1: "/static/images/box1.jpg",
                  box2: "/static/images/box2.jpg",
    				      box3: "/static/images/box3.jpg",
    				      box4: "/static/images/box4.jpg"};

var goal_images = ["/static/images/goal1.jpg",
				       "/static/images/goal2.jpg",
				       "/static/images/goal3.jpg"];

// All pages to be loaded after Ad page which, accepted, splashes to consent page. 
var pages = ["survey.html"  ,
			       "instruct.html"    ,
             "stage_inst.html"  ,
             "recap.html"       ,
             "stage.html"       ,
             "partition.html"   ,
             "questionnaire.html"];

// Preload various things.
psiTurk.preloadPages (pages);
psiTurk.preloadImages(box_images);
psiTurk.preloadImages(goal_images);
psiTurk.preloadImages(["/static/images/fixation.jpg"]);

var instructionPages = ["instruct.html","stage_inst.html","recap.html"];

// Task object to keep track of the current phase
var currentview;

// Run Task
$(window).load( function(){ currentview = new survey(instructionPages,'goal_survey_pre') });
