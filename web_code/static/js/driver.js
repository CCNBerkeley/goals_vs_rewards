// Debugging flag changes multiple aspects of the code.
var debug = true;

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition      = condition;       // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
                                        // they are not used in the stroop code but may be useful to you

var condition_str  = (mycondition.length == 2) ? mycondition:('0' + mycondition)
var data_file_name = debug ? '/static/data/debug_data.json':'/static/data/condition_' + condition_str + '_data.json';

var box_images = ["/static/images/box1.jpg",
                  "/static/images/box2.jpg",
                  "/static/images/box3.jpg",
                  "/static/images/box4.jpg"];

var goal_images = ["/static/images/goal1.jpg",
				       "/static/images/goal2.jpg",
				       "/static/images/goal3.jpg"];

// All pages to be loaded after Ad page which, accepted, splashes to consent page. 
var pages = ["survey.html"      ,
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


shuffle(box_images);
psiTurk.recordTrialData({'condition': mycondition, 'box_images':box_images})
// Run Task
$(window).load(
   loadJSON(data_file_name,
      function(json){
      	 //alert(json);
         var actual_json = JSON.parse(json);
         train_set = actual_json['train_set'];
         test_set  = actual_json['test_set'];
         currentview = new survey(instructionPages,'goal_survey_pre')
      }
   )
);
