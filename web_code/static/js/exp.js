//------------------------------------------------------------//
// This file defines the "actual" goals-vs-rewards task. 
//------------------------------------------------------------//
var experiment = function(task_set,images,phase) {

   if (phase == 'test') {
      var prev_seen = []
   }
   
   // Initialize some tracking stuff
   var trials_done = [0]
   var trials_corr = [0]
   var key_list    = []

   var admonition_duration  = {'goals': 4250, 'points':4250, 'boxes': 2000}

   var first_round = true;
   var no_resp_counter = 0;

   if (phase == 'inst') {
      // Dummy task set for instructions.
      var task_set = [{boxes: "AB", yield: true , order: 1}];
      
      var resp_streak  = 0;            // How many times in a row has the subject responded in time?
      var resp_thresh  = debug ? 0:2;  // Declare ready to continue if resp_streak > resp_thresh.
   };

   // ----------------------------------------------------------------------------- //
   // Constructor for an image object, which keeps track of a length 2 subset of 
   // a set of images and their presentation order.
   // ----------------------------------------------------------------------------- //
   function ImageObject(image_set, indices){
      var image_set     = image_set;  // List of image paths
      var image_indices = indices;    // An initialization for the first goal choice
      var image_order   = 1;          // 1 == in order, -1 == reversed
      var self          = this;

      //
      // Private Functions
      //
      function codeResponse(response){
         return (response == 'left') ? 0:1;
      }

      //
      // Public Methods
      //

      this.getSelectionId = function(response){
         var ordered_indices = image_indices.slice();
         if (image_order == -1) {ordered_indices.reverse()};

         var response_code   = codeResponse(response)
         var selectionId     = ordered_indices[response_code]

         //console.log('ordered_indices: ' + ordered_indices)
         //console.log('response_code  : ' + response_code  )

         return selectionId
      }

      // Returns e.g. ["/static/js/goal1.jpg", "/static/js/goal2.jpg"]
      this.getImages = function(){
         var output = [ image_set[image_indices[0]], image_set[image_indices[1]] ];
         if (image_order == -1) {output.reverse()}

         return output
      }

      // Returns e.g. ["goal1", "goal2"] or '["boxC", "boxD"]
      this.getImageNames = function(){
         var image_names = self.getImages();

         image_names[0] = image_names[0].split("/")[image_names[0].split("/").length-1].split(".")[0]
         image_names[1] = image_names[1].split("/")[image_names[1].split("/").length-1].split(".")[0] 
         
         return image_names
      }

      // Sets the order parameter (should only be set to 0 or 1)
      this.setOrder = function(order){
         image_order = order
      }

      this.getOrder = function(){
         return image_order
      }

      // Set the indices of the images to use from image_set
      this.setImageIndices = function(indices){
         image_indices = indices
      }

      this.getImageIndices = function(){
         return image_indices.slice()
      }
   }

   // ----------------------------------------------------------------------------- //
   // Constructor for a trial object, which keeps track of trial internals.
   // Has state for goal and box presentations and current phase of trial.
   // Has methods for manipulating these. 
   // ----------------------------------------------------------------------------- //
   function TrialObject(task_set){
      var self = this;

      var subphase = !(phase == 'test') ? "goals":"boxes"
      var task_set = task_set
      var cur_task = task_set.shift()

      var box_response    = 'none'
      var goal_response   = 'none'
      var point_response  = 'none'
      var latest_response = 'none'
      var point_trial     = false
      var chose_zero      = false

      var box_image_object   = new ImageObject(images['boxes' ],[0,1])
      var goal_image_object  = new ImageObject(images['goals' ],[0,2])
      var point_image_object = new ImageObject(images['points'],[0,1])

      var cur_image_object = box_image_object
      var cur_choice_pair  = (phase == 'test') ? box_image_object.getImages():goal_image_object.getImages()

      var response_object = {correctness: null,
                             gets_reward: null,
                             response   : 'none',
                             code       : function(response){ codeResponse(response) }
                            }


      // -------------------------- //
      // Private functions:
      // -------------------------- //
      function updateBoxes(box_codes){
         var image_indices = [];
         var box_code_list     = ['A','B','C','D','E','F','G','H']

         for (var i = 0; i < 2; i++) {
            var box_code = box_codes.slice(i,i+1);
            image_indices[i] = box_code_list.indexOf(box_code);
         }

         box_image_object.setOrder(cur_task.order)
         box_image_object.setImageIndices(image_indices)
      }

      //
      function updateGoals(response){
         if (response == 'none'){
            var rand = Math.floor(Math.random()*2);
            response = (rand == 0) ? 'left':'right'
         }

         var index  = goal_image_object.getSelectionId(response);
         var setdif = [[1,2], [0,2], [0,1]];

         var indices = setdif[index];
         var order   = (goal_image_object.getOrder() == 1) ? -1:1

         goal_image_object.setOrder(order)
         goal_image_object.setImageIndices(indices)
      }

      function updatePoints(){
         var order = (point_image_object.getOrder() == 1) ? -1:1
         point_image_object.setOrder(order)
      }

      // -------------------------- //
      // Public methods:
      // -------------------------- //

      // Load next task pair or box-test and update images & goal options
      this.updateTask= function(){

         // Load the next task
         cur_task = task_set.shift()

         // Update the subphase, but there is only one
         // subphase for test sets.
         if (phase == 'test') {
            subphase = "boxes"
         }
         else {
            subphase = "goals"
         }

         // Load the new box images for this task
         updateBoxes(cur_task.boxes)

         if (phase != 'test'){
            if (box_image_object.getImageIndices()[0] > 3){
               point_trial = true
               subphase = "points"
            }
            else {
               point_trial = false
            }

            if (!point_trial){
               updateGoals(goal_response)
            }
            else {
               updatePoints()
            }
         }

         trials_done.push(0)
         trials_corr.push(0)
      }

      this.getImages = function(){
         switch (subphase){
            case "goals" : return  goal_image_object.getImages(); 
            case "boxes" : return   box_image_object.getImages();
            case "points": return point_image_object.getImages();
         }

      }

      this.doNextSubphase = function(responded, phase){
         
         // Maybe move on to the next 'pair', box-test, or phase. 
         var update_task = ( subphase == "boxes" || !responded )
         if (update_task){
            self.updateTask()
            if (point_trial){
               cur_image_object = point_image_object
            }
            else{
               cur_image_object = goal_image_object               
            }
         }
         else {
             subphase = "boxes"
             cur_image_object = box_image_object
         }

         // If we didn't finish, need to get rid of stuff
         display.clearDisplay()

         //
         display.showChoice( trial.getImages(), subphase );
         coordinator.listen( choice_time_limit )
      }

      this.getChoicePair = function(){
         return cur_choice_pair;
      }

      this.getGoalNames = function(){
         return goal_image_object.getImageNames();
      }

      this.getBoxNames = function(){
         return box_image_object.getImageNames();
      }

      this.getSubphase = function() {
         return subphase;
      }

      this.getTaskSetLength = function() {
         return task_set.length;
      }

      this.getGoalImages = function(){
         if (point_trial) {
            return point_image_object.getImages()
         }
         else{
            return goal_image_object.getImages()
         }
      }

      this.getCurTask = function(){
         return cur_task
      }

      // A function to update the instruction task set.
      this.addInstructionTask = function(){
         switch (cur_task.boxes) {
            case 'AB': var new_boxes = 'EF'; break
            case 'CD': var new_boxes = 'GH'; break
            case 'EF': var new_boxes = 'CD'; break
            case 'GH': var new_boxes = 'AB'; break
         }


         var new_yield = (cur_task.yield        ) ? false:true;
         var new_order = (cur_task.order == 1   ) ? -1   :1   ;

         var new_task  = {boxes:new_boxes, yield:new_yield, order:new_order};
         task_set.push(new_task)
      };

      this.registerResponse = function(response){
         if (subphase == 'boxes' ) { box_response   = response; }
         if (subphase == 'goals' ) { goal_response  = response; }
         if (subphase == 'points') { point_response = response; }
         latest_response = response;

         key_list.push(response)
         // If boxes subphase, assign correctness & reward
         switch (subphase){
            case "goals":
               var correct = null
               var reward  = null
               break;

            case "boxes":
               var correct = ((cur_task.order == 1 && response == 'left') || (cur_task.order == -1 && response == 'right'));

               var reinforce_good =  cur_task.yield &&  correct
               var reinforce_bad  = !cur_task.yield && !correct

               // "reward" really means "gets what was chosen" ... should be changed
               var reward  = ( reinforce_good || reinforce_bad ) || (chose_zero && point_trial);

               trials_done[trials_done.length-1] ++
               trials_corr[trials_corr.length-1] = (correct) ? 1:0

               if (phase == 'inst') {
                  resp_streak ++;
                  first_round = false;
               }
               break;

            case "points":
               chose_zero = (cur_image_object.getOrder() == 1 && response == 'left') || (cur_image_object.getOrder() == -1 && response == 'right')
               cur_task.yield = (chose_zero) ? false:cur_task.yield
               break;
         }
         return {correctness: correct, give_reward: reward}
      }
   }

   // ----------------------------------------------------------------------------- //
   // Define a display object. This will store display state and control the display.
   // ----------------------------------------------------------------------------- //
   function DisplayObject(){
      var self = this;

      // -------------------------- //
      // PRIVATE FUNCTIONS:
      // -------------------------- //
      // Removes the two images representing choices
      removeImages = function(){
         d3.select("#img0").remove();
         d3.select("#img1").remove();
      }

      // Toggles the fixation + in the center of the page
      toggleFixation = function(state){
         d3.select("#fixation").style("display",state);
      }

      // Shows the header and prompt or hides it
      toggleText = function(state){
         d3.select('#header').style("visibility",state);
         d3.select('#prompt').style("visibility",state);
      }

      // -------------------------- //
      // PUBLIC METHODS:
      // -------------------------- //
      // This updates the display to admonish the user for not responding
      this.admonish = function(){
         removeImages()

         d3.select("#header").html("Sorry, you took too long!")
         d3.select("#prompt").html("Please respond faster next time.")

         toggleText('visible')
      }

      // This displays a choice between two options, be they goals or boxes.
      this.showChoice = function(choice, subphase){
         if (phase == 'inst') {
            toggleText('visible')
         }
         else{
            toggleText('hidden')
         }

         toggleFixation('inline')

         if (subphase == 'goals' || subphase == 'points'){
            d3.select('#header').html ("Please select an item.");
         }
         else {
            d3.select('#header').html ("Please select a box to look in.");
         }

         d3.select("#item0" ).append("img").attr("id","img0").attr("src",choice[0])
         d3.select("#item1" ).append("img").attr("id","img1").attr("src",choice[1])
         d3.select("#prompt").html('<p id="prompt">Type "F" to select the left item or "J" to select right item.</p>');
      };

      this.showChosen = function(response){
         var index_to_remove = (response == 'left') ? 1:0

         d3.select("#img" + index_to_remove).remove();

         d3.select("#header"  ).style("visibility","hidden")
         d3.select("#fixation").style("display"   ,"none");

         if (phase == "inst") {
            d3.select("#prompt").html('<p id="prompt">Your Selection</p>')
         };
      }

      this.showBoxContent = function(response, box_content) {
         var choice_index = (response == 'left') ? 0:1
         d3.select("#img" + (choice_index) ).attr("src"   ,box_content);
         d3.select("#img" + (choice_index) ).attr("srcset",box_content);

         if (phase == "inst") {
            d3.select("#prompt").html('<p id="prompt"> This Box\'s Contents</p>')
         };
      }

      // Removes everything and shows fixation cross
      this.showFixation = function() {
         removeImages()

         d3.select("#fixation").style("display","inline");
         d3.select("#prompt").html('')
         d3.select('#header').style('visibility',"hidden");
      }

      this.clearDisplay = function() {
         removeImages()
         toggleText('hidden')
         toggleFixation('none')
      }

      this.showContinuePrompt = function() {
         self.clearDisplay()
         self.showFixation()
         d3.select("#stage_inst_button_row").style("display","inline")
         d3.select("#header").html("<br>")
         d3.select("#prompt").html("It looks like you're getting the hang of it. <br> You may continue or re-read the instructions. <br>")
         toggleText('visible')
      }
   }



   // This function records data and continues the experiment.
   function recordAndContinue(resp_time,response,phase,correct,reward){

      var responded       = response  != 'none';               // Did the subject respond?
      var index_to_remove = (response == 'left') ? 1:0

      var chosen_duration = 750;                               // Time for which the chosen item is shown (ms)
      var total_duration  = (responded) ? chosen_duration:0;   // In case of goals subphase, otherwise more (added to later)

      var subphase = trial.getSubphase()
      
      var fix_duration    = (subphase == "boxes") ? 500:1;     // Fixation period length
      var result_duration = (subphase == "boxes") ? 750:1;     // Time for which box contents are shown


      //   A choice was presented 1.5 seconds (choice_time_limit) ago or less.
      // 
      //   The timeline from here:  
      //   0    - Show chosen item
      //
      //   If on goal choice:
      //   0.75 - Proceed to doNextStep()
      //
      //   If on box choice:
      //   0.75 - Show box content
      //   1.5  - Show fixation
      //   2.0  - Proceed to doNextStep
      
      if (responded){

         // Show the participant what they chose
         display.showChosen(response)

         if (subphase == "goals" || subphase == 'points') {
            picked_index = (response == 'left') ? 0:1
         }

         // If we're opening boxes, we have to...
         //   1) increase the wait time before moving on
         //   2) show the content of the box
         if (subphase == "boxes") {

            var img_options = trial.getGoalImages();
            var box_content = (reward) ? img_options[picked_index]:img_options[(picked_index+1)%2];

            // Wait for chosen duration to end then show Result
            if (phase != "test") {
               setTimeout(function(){ display.showBoxContent(response, box_content) }, chosen_duration)

               total_duration = total_duration + result_duration;
            };

            var addnl_time = (phase != "test") ? result_duration:0;
            // Wait for chosen duration and result duration to end, then show fixation
            setTimeout(function(){ display.showFixation() },chosen_duration + addnl_time)

            total_duration = total_duration + fix_duration;
         };

      }
      else {
         // var correct = -1;
         // var reward  = -1;
         if (phase == 'inst') {resp_streak = 0}
      };

      var trial_data = {'phase'    : phase,
                        'subphase' : trial.getSubphase() ,
                        'response' : response,
                        'goals'    : trial.getGoalNames(),
                        'boxes'    : trial.getBoxNames() ,
                        'time_stamp': getFormattedDate() }

      if (subphase == 'boxes'){
         trial_data['correct'  ] = correct
         trial_data['reward'   ] = reward
      }

      if (responded){
         trial_data['resp_time'] = resp_time
      }
      
      // Record the trial data
      psiTurk.recordTrialData(trial_data);

      //console.log('phase    : ' + phase    )
      //console.log('subphase : ' + subphase )
      //console.log('response : ' + response )
      //console.log('correct  : ' + correct  )
      //console.log('reward   : ' + reward   )
      //console.log('resp_time: ' + resp_time)

      if (phase == "test") {
         //prev_seen.push(0)
         var cur_task = trial.getCurTask()

         // Check if this is a 'new' box pairing
         //prev_seen[prev_seen.length-1] = (cur_task.boxes != 'AB' && cur_task.boxes != 'CD') ? 0:1
         prev_seen.push( (cur_task.boxes != 'AB' && cur_task.boxes != 'CD' && cur_task.boxes != 'EF' && cur_task.boxes != 'GH') ? 0:1 )
      }

      // Should we add more instruction tasks?
      var add_task_condition_generic  = phase == 'inst' && resp_streak <= resp_thresh
      var add_task_condition_subphase = trial.getSubphase() == 'boxes' || !responded

      var add_task = add_task_condition_generic && add_task_condition_subphase 
      if (add_task) { trial.addInstructionTask() };

      var finish_normally = trial.getSubphase() == 'boxes' && trial.getTaskSetLength() == 0
      var finish_on_goals = (trial.getSubphase() == 'goals' || trial.getSubphase() == 'points') && trial.getTaskSetLength() == 0  && !responded

      // Move to the next subphase or finish 
      setTimeout(function(){
         //if (trial.getSubphase() == 'boxes' && trial.getTaskSetLength() == 0) {
         if (finish_normally || finish_on_goals) {
            finish()
         }
         else{
            trial.doNextSubphase(responded, phase)
         }
      },total_duration)
   };


   // This moves the participant out of the experimental task
   // and on to the questionaire.
   var finish = function() {
      //$("body").unbind("keydown", captureResponse); // Unbind keys
      //$("body").unbind("keyup"  , captureResponse); // Unbind keys

      switch (phase) {
         case 'inst':
            display.showContinuePrompt()
            break;

         case 'train':
            psiTurk.recordTrialData({'phase'      : phase,
                                     'key_list'   : key_list,
                                     'trials_corr': trials_corr,
                                     'trials_done': trials_done,
                                     'time_stamp' : getFormattedDate()}
                                     );

            // Display the Test-Splash Page
            /*
            psiTurk.showPage("partition.html");
            
            $('.okgotit').bind('click', function() {
               $('.okgotit').unbind('');
               currentview = new experiment(test_set,box_images,goal_images,"test" );
            });
            */
            
            currentview = new experiment(test_set,images,"test" );            

            break;

         case 'test':
            psiTurk.recordTrialData(
                        {'phase'      : phase,
                         'key_list'   : key_list,
                         'trials_corr': trials_corr,
                         'prev_seen'  : prev_seen,
                         'trials_done': trials_done,
                         'time_stamp' : getFormattedDate()}
                         );
            currentview = new survey([],'goal_survey_post');
            break;
        }
   };


   function CoordinatorObject(phase,subphase){
      var self = this;
      
      var listening = false;
      var keydown   = false;

      var choice_start_time = null;
      var too_late_timer    = null;

      // This runs when a participant runs out of time on a trial.
      function expireUI(){
         listening = false;

         var response  = 'none';
         var resp_time = -1;

         display.admonish()

      // if (phase == "inst" || no_resp_counter >= 5) {
         if (phase == "inst") {
            d3.select("#okbutton").style("display","inline");

            $('.okgotit').bind('click', function() {
               d3.select("#okbutton").style("display","none");
               $('.okgotit').unbind('');
               
               recordAndContinue(resp_time,response,phase);
            });
         }
         else {
            //var wait_time = (subphase == 'goals') ? 4500:1500;

            setTimeout(function(){
               //no_resp_counter ++
               recordAndContinue(resp_time,response,phase)
            },admonition_duration[trial.getSubphase()]);
         };
      };

      this.listen = function(time_limit){
         var self = this;
         listening = true

         too_late_timer    = setTimeout(expireUI, time_limit);
         choice_start_time = new Date().getTime();

         // Register the response handler.
         $("body").focus().keydown(this.captureResponse); 
         $("body").focus().keyup(  this.captureResponse); 

         psiTurk.recordTrialData({'phase' : phase, 'time_stamp' : getFormattedDate()})         
      }

      // Input response handler
      this.captureResponse = function(event) {

         if (!listening) return;
         if (event.type == 'keyup' && !keydown) {console.log(keydown); return;}
         
         switch (event.keyCode) {
            case 70: // "F"
               var response = 'left';
               break;
            case 74: // "J"
               var response = 'right';
               break;
            default:
               var response = 'none';
               break;
         }

         if (event.type == 'keydown'){
            resp_time = new Date().getTime() - choice_start_time;
            keydown = true
            return
         }

         if (response != 'none') {
            listening = false;
   
            var out = trial.registerResponse(response)

            clearTimeout(too_late_timer);
            recordAndContinue(resp_time,response,phase,out['correctness'],out['give_reward']);
         }
      };
   }

   //
   // Start the test
   //
   var trial       = new TrialObject( task_set )
   var display     = new DisplayObject()
   var coordinator = new CoordinatorObject(phase, trial.getSubphase())

   var choice_time_limit  = (phase == "inst" && first_round) ? 20000:1500

   // Load the stage.html snippet into the body of the page
   // (This already exists if were in the instruction set)
   if (phase != "inst") {
      psiTurk.showPage('stage.html');
   };
   
   // Set display
   display.showChoice( trial.getChoicePair(), trial.getSubphase() )

   // Start listening for responses
   coordinator.listen( choice_time_limit );

   // Change time_limit 'back' to what it should be
   choice_time_limit = 1500;
};
