//------------------------------------------------------------//
// This file defines the "actual" goals-vs-rewards task. 
//------------------------------------------------------------//
var experiment = function(task_set,box_images,goal_images,phase) {

   var choice_start;
   var too_late_timer;

   var subphase  = !(phase == 'test') ? "goals":"boxes";
   var listening = false;
   var keydown   = false;

   // Initial setup. Since updateAvial will be called, goal_avail will be [0,1] at first presentation.
   //var response    = 'right';
   //var goal_avail  = [0,2];

   if (phase == 'test') {
      var prev_seen = []
   }
      
   var trials_done = []
   var trials_corr = []
   var key_list    = []
   var wait_times  = {'goals': 4500, 'boxes': 1500}

   if (phase == 'inst') {
      // Dummy task set for instructions.
      var task_set = [{boxes: "AB", yield: true , order: 1}];
      
      var resp_streak  = 0;            // How many times in a row has the subject responded in time?
      var resp_thresh  = debug ? 1:2;  // Declare ready to continue if resp_streak >= resp_thresh.
      var first_round  = true;
   };

   var goals = new GoalObject();

   // Constructor for the goal object:
   // We should be able to get a selection ID from a response, and be able to tell the goal object
   // to update itself based on our response, but that should be it.
   function GoalObject(){

      // Private fields
      var images  = goal_images;
      var indices = [0,2];
      var order   = 0;
      var dbg     = true;
      var self    = this;

      // Private method
      function codeResponse(response){
         return (response == 'left') ? 0:1;
      }

      // Create priveleged public methods
      this.getSelectionId = function(response){
         //console.log('response: ' + response)
         //console.log('indices : ' + indices )
         //console.log('order   : ' + order   )

         var ordered_indices = indices.slice();
         if (order == 1) {ordered_indices.reverse()};

         var response_code   = codeResponse(response)
         var selectionId     = ordered_indices[response_code]

         //console.log('ordered_indices: ' + ordered_indices)
         //console.log('response_code  : ' + response_code  )

         return selectionId
      }

      this.updateGoals = function(response){
         var index  = self.getSelectionId(response);
         var setdif = [[1,2], [0,2], [0,1]];

         indices = setdif[index];
         order   = (order + 1) % 2
      }

      this.getImages = function(){
         var output = [ images[indices[0]], images[indices[1]] ];
         if (order == 1) {output.reverse()}

         return output
      }

      this.getGoalNames = function(){
         var goal_names = self.getImages();

         // Extract just e.g. 'goal1' from full path & filename
         goal_names[0] = goal_names[0].split("/")[goal_names[0].split("/").length-1].split(".")[0]
         goal_names[1] = goal_names[1].split("/")[goal_names[1].split("/").length-1].split(".")[0] 
         
         return goal_names
      }

      this.getOrder = function() {return order}

   }
   var goal_response = 'right';


   // This updates the goals which will be displayed as availabe choices.
/* function updateAvail(response,goal_avail){
      var index = (response == 'left') ? 0:1

      switch (goal_avail[index]) {
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
      
      if (debug){console.log(goal_avail)}
   };
*/

   // This updates the display to admonish the user for not responding
   function admonish(){
      removeImages()

      d3.select("#header").html("Sorry, you took too long!")
      d3.select("#prompt").html("Please respond faster next time.")

      toggleText('visible')
   }


   // Shows the header and prompt or hides it
   function toggleText(state){
      d3.select('#header').style("visibility",state);
      d3.select('#prompt').style("visibility",state);
   }


   // Removes the two images representing choices
   function removeImages(){
      d3.select("#img0").remove();
      d3.select("#img1").remove();
   }


   function toggleFixation(state){
      d3.select("#fixation").style("display",state);
   }


   // Determine which subphase we're moving on to
   function incrementSubphase(responded,phase,subphase){

      if (responded && !(phase == 'test')) {
         subphase = (subphase == "goals") ? "boxes":"goals";
      }
      else {
         if (phase == "train") {
            task_set.shift();
         }
         if (subphase == "goals") {
            var rand = Math.floor(Math.random()*2);
            response = (rand == 0) ? 'left':'right'
         };
         subphase = !(phase == "test") ? "goals":"boxes";            
      };

      return subphase
   }



   // This runs when a participant runs out of time on a non-goald trial.
   function expireUI(){
      listening = false;

      var response  = 'none';
      var resp_time = -1;

      admonish()

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
            toggleText('hidden')
            recordAndContinue(resp_time,response,phase)
         },wait_times[subphase]);
      };
   };

   // This records data and continues the experiment.
   function recordAndContinue(resp_time,response,phase){

      var responded       = resp_time > 0;                         // Did the subject respond?
      var index_to_remove = (response == 'left') ? 1:0

      var chosen_duration = 1.0*1000;                              // Time for which the chosen item is shown
      var total_duration  = chosen_duration;                       // In case of goals subphase, otherwise more (added to later)

      var fix_duration    = (subphase == "boxes") ? 0.5*1000:1;    // Fixation period length
      var result_duration = (subphase == "boxes") ? 1.0*1000:1;    // Time for which box contents are shown

      // Timeline:
      //   0   - Show the participant what they chose
      //   0.5 - Show box content if we're on box choice or proceed to doNextStep()
      //
      //   If on box choice:
      //   1.5 - Show fixation
      //   2.0 - Proceed to doNextStep
      
      if (responded){
         key_list.push(response)

         // If boxes subphase, assign correctness & reward
         switch (subphase){
            case "goals":
               var correct = -1
               var reward  = -1

               picked_index = (goal_response == 'left') ? 0:1
               break;

            case "boxes":
               var correct = ((cur_order == 1 && response == 'left') || (cur_order == -1 && response == 'right'));
               var reward  = (rew_corr_choice && correct) || (!rew_corr_choice && !correct);

               trials_done[trials_done.length-1] ++
               trials_corr[trials_corr.length-1] = (correct) ? 1:0

               if (phase == 'inst') {
                  resp_streak ++;
                  first_round = false;
               }
               break;
         }

         // Show the participant what they chose
         d3.select("#img" + index_to_remove).remove();
         d3.select("#header").style("visibility","hidden")
         d3.select("#fixation").style("display","none");

         if (phase == "inst") {d3.select("#prompt").html('<p id="prompt">Your Selection</p>')};


         // If we're opening boxes, we have to...
         //   1) increase the wait time before moving on
         //   2) show the content of the box
         if (subphase == "boxes") {

            var img_options = goals.getImages();
            //var img_options = [goal_images[goal_avail[0]],goal_images[goal_avail[1]]];
            var box_content = (reward) ? img_options[picked_index]:img_options[(picked_index+1)%2];

            // Wait for chosen duration to end then show Result
            if (phase != "test") {
               setTimeout(function(){
                  d3.select("#img" + (index_to_remove+1) % 2).attr("src"   ,box_content);
                  d3.select("#img" + (index_to_remove+1) % 2).attr("srcset",box_content);
                  
                  if (phase == "inst") {d3.select("#prompt").html('<p id="prompt"> This Box\'s Contents</p>')};
               },chosen_duration)

               total_duration = total_duration + result_duration;
            };

            var addnl_time = (phase != "test") ? result_duration:0;
            // Wait for chosen duration and result duration to end, then show fixation
            setTimeout(function(){
               removeImages()

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
         if (phase == 'inst') {resp_streak = 0}
      };

      if (subphase == 'boxes') {
         var box_record = box_img_subset;
      }
      else {
         var box_record = '';
      }

      var trial_data = {'phase'    : phase,
                        'subphase' : subphase,
                        'response' : response,
                        'goals'    : goals.getGoalNames(),
                        'boxes'    : box_record,
                        'time_stamp': getFormattedDate()}

      if (responded) {
         trial_data['resp_time'] = resp_time
         
         if (subphase == 'boxes'){
            trial_data['correct'  ] = correct
            trial_data['reward'   ] = reward
         }
      }
      
      // Record the trial data
      psiTurk.recordTrialData(trial_data);

      //console.log('phase    : ' + phase    )
      //console.log('subphase : ' + subphase )
      //console.log('response : ' + response )
      //console.log('correct  : ' + correct  )
      //console.log('reward   : ' + reward   )
      //console.log('resp_time: ' + resp_time)

      // Should we add more instruction tasks?
      var add_tasks = phase == 'inst' && resp_streak <= resp_thresh && subphase == 'boxes'
      if (add_tasks) { task_set.push(updateInstructionTask(cur_task)) };

      //task_set = updateTaskSet(cur_task)

      subphase = incrementSubphase(responded,phase,subphase)

      setTimeout(function(){
         removeImages()
         toggleFixation('inline')         
         doNextStep()
      },total_duration)
   };




   // This displays a choice between two options, be they goals or boxes.
   function displayChoice(choice){

      d3.select("#prompt").html('<p id="prompt">Type "F" to select the left item or "J" to select right item.</p>');
      
      toggleFixation('inline')

      if (phase == 'inst') {toggleText('visible')}

      d3.select("#item0")
         .append("img")
         .attr("id","img0")
         .attr("src",choice[0])

      d3.select("#item1")
         .append("img")
         .attr("id","img1")
         .attr("src",choice[1])

      choice_start = new Date().getTime();
      listening    = true;
      keydown      = false;

      if (phase == "inst" && first_round){
         var time_limit = 20000;
      }
      else {
         var time_limit = 2000;
      };

      too_late_timer = setTimeout(expireUI,time_limit);
   };

   // This is used to advance through the goal-fixation-box cycle.
   var doNextStep = function() {
      if (task_set.length === 0) {
         finish();
      }
      else {
         if (subphase == "goals"){
            trials_done.push(0)
            trials_corr.push(0)
            toggleFixation('inline')
            d3.select('#header'  ).html ("Please select an item.");

            //if (phase == "inst") {
            //   d3.select('#header'  ).style('visibility',"visible");
            //}

            goals.updateGoals(goal_response)
            //goal_avail = updateAvail(response,goal_avail)
            //var goals = [goal_images[goal_avail[0]], goal_images[goal_avail[1]]];
            var goal_images = goals.getImages();

            //if (phase == "inst" && Math.floor(Math.random()*2) == 1) {
            //   goal_images = goal_images.reverse();
            //};
            displayChoice(goal_images)
         }
         else {
            if (phase == 'test') {
               trials_done.push(0)
               trials_corr.push(0)
               prev_seen.push(0)
            }
            toggleFixation('none')

            cur_task = task_set.shift();

            cur_order       = cur_task.order;
            rew_corr_choice = cur_task.yield;

            box_img_subset = [];
            switch (cur_task.boxes.slice(0,1)) {
               case "A":
                  box_img_subset[0] = box_images[0];
                  break;
               case "B":
                  box_img_subset[0] = box_images[1];
                  break;
               case "C":
                  box_img_subset[0] = box_images[2];
                  break;
               case "D":
                  box_img_subset[0] = box_images[3];
                  break;
            }

            switch (cur_task.boxes.slice(1,2)) {
               case "A":
                  box_img_subset[1] = box_images[0];
                  break;
               case "B":
                  box_img_subset[1] = box_images[1];
                  break;
               case "C":
                  box_img_subset[1] = box_images[2];
                  break;
               case "D":
                  box_img_subset[1] = box_images[3];
                  break;
            }

            var box_options = (cur_order == 1) ? box_img_subset:box_img_subset.reverse();

            // Check if this is a 'new' box pairing
            if (phase == 'test') {
               prev_seen[prev_seen.length-1] = (cur_task.boxes != 'AB' && cur_task.boxes != 'CD') ? 0:1
            }
               
            d3.select('#header').html ("Please select a box to look in.");
            displayChoice(box_options);
         }
      }
   };
   

   // A function to update the instruction task set.
   function updateInstructionTask(task){
      var new_boxes = (task.boxes == "AB") ? "CD" :"AB";
      var new_yield = (task.yield        ) ? false:true;
      var new_order = (task.order == 1   ) ? -1   :1   ;

      return {boxes:new_boxes, yield:new_yield, order:new_order}
   };


   // Input response handler
   var response_handler = function(event) {

      if (!listening) return;
      if (event.type == 'keyup' && !keydown)  {console.log(keydown); return;}
      var response;

      switch (event.keyCode) {
         case 70: // "F"
            response = 'left';
            break;
         case 74: // "J"
            response = 'right';
            break;
         default:
            response = 'none';
            break;
      }
      if (subphase == "goals") {
         goal_response = response.slice();
      }

      if (event.type == 'keydown'){
         resp_time = new Date().getTime() - choice_start;
         keydown   = true
         return
      }

      //if (event.type == 'keyup'){
      //   keydown = false
      //}

      if (response != 'none') {
         //var resp_time = new Date().getTime() - choice_start;
         listening     = false;

         clearTimeout(too_late_timer);
         recordAndContinue(resp_time,response,phase);
      }
   };


   // This moves the participant out of the experimental task
   // and on to the questionaire.
   var finish = function() {
      $("body").unbind("keydown", response_handler); // Unbind keys
      $("body").unbind("keyup"  , response_handler); // Unbind keys

      switch (phase) {
         case 'inst':
            d3.select("#stage_inst_button_row").style("display","inline")
            d3.select("#prompt").html("It looks like you're getting the hang of it. <br> You may continue or re-read the instructions. <br>")
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
            
            currentview = new experiment(test_set,box_images,goal_images,"test" );            

            break;

         case 'test':
            psiTurk.recordTrialData({'phase'      : phase,
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

   // Load the stage.html snippet into the body of the page
   if (phase != "inst") {
      psiTurk.showPage('stage.html');
      toggleText('hidden')
   };

   // Register the response handler that is defined above to handle any
   // key down events.
   $("body").focus().keydown(response_handler); 
   $("body").focus().keyup(response_handler); 

   psiTurk.recordTrialData({'phase' : phase, 'time_stamp' : getFormattedDate()})

   // Start the test
   doNextStep();
};
