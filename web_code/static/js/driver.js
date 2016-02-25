/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition;            // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
                                        // they are not used in the stroop code but may be useful to you

// All pages to be loaded after Ad page which, accepted, splashes to consent page. 
var pages = [
	"instruct-desc.html",
	"instruct-ex-exp.html",
	"instruct-ex-form.html",
	"stage.html",
	"questionnaire.html"
];

var images = ["/static/images/lit.jpg",
              "/static/images/normal.jpg",
              "/static/images/indOn.jpg",
	      "/static/images/indOff.jpg"
];

psiTurk.preloadPages(pages);
psiTurk.preloadImages(images);

var instructionPages = ["instruct-desc.html",
	                "instruct-ex-exp.html",
	                "instruct-ex-form.html",
	               ];

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, 						       // a list of pages you want to display in function
    	function() { currentview = new experiment(); } // what you want to do when you are done with instructions
    );
});

