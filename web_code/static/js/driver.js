// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition      = condition;       // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
                                        // they are not used in the stroop code but may be useful to you

var box_images  = ['/static/images/box1.jpg' ,'/static/images/box2.jpg'];
var goal_images = ['/static/images/goal1.png','/static/images/goal2.png','/static/images/goal3.png'];

// All pages to be loaded after Ad page which, accepted, splashes to consent page. 
var pages = ["instruct.html","stage.html","questionnaire.html"];

psiTurk.preloadPages(pages);
psiTurk.preloadImages(box_images);
psiTurk.preloadImages(goal_images);

var instructionPages = ["instruct.html"];

// Task object to keep track of the current phase
var currentview;

// Data that must be passed into the experiment
var stim_order  = [0,1,0];
var succ_probs  = [0.8,0.2];

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
        instructionPages,
        function() { currentview = new experiment(stim_order, succ_probs);} 
    );
});