/****************
* Questionnaire *
****************/
var Questionnaire = function() {

   var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

   record_responses = function() {
      var question_data = []

      //psiTurk.recordTrialData({'phase':'questionnaire', 'status':'submit'});

      $('input:checked').each( function(i, val) {
         question_data.push(this.name + this.value)
         // psiTurk.recordUnstructuredData(this.name, this.value);
      });

      psiTurk.recordTrialData({'phase'    : 'questionnaire',
                               'response' : question_data  ,
                               'status'   : 'submit'}
                              );
   };

   prompt_resubmit = function() {
      replaceBody(error_message);
      $("#resubmit").click(resubmit);
   };

   resubmit = function() {
      replaceBody("<h1>Trying to resubmit...</h1>");
      reprompt = setTimeout(prompt_resubmit, 10000);
      
      psiTurk.saveData({
         success: function() {
             clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){finish()}); 
         }, 
         error: prompt_resubmit
      });
   };

   var bonus = computeBonus()

   // Load the questionnaire snippet 
   psiTurk.showPage('questionnaire.html');
   psiTurk.recordTrialData({'phase' :'questionnaire',
                            'status':'begin'        ,
                            'bonus' : bonus});
   
   $("#submit").click(function () {
       record_responses();
       psiTurk.saveData({
            success: function(){
                  psiTurk.computeBonus('compute_bonus', function() {
                  psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                }); 
            }, // for some reason when prompt_resubmit gets triggered below, replaceBody can't be found ...
            error: prompt_resubmit});
   });
};