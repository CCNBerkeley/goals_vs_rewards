
// Survey for the end of the experiment
var instructions_survey_block1 = {
    type: "text",
  	text: function() {
    	return '<div id="jspsych-instructions">' + 
        '<p>Great Job!</p>' +
        '<p>You won <strong>' +
        getTotalScore() + " Points</strong>! You will receive a bonus payment" +
        ' of &#36;' + getBonus() + '.</p>' +
        '<p>Before we finish, there will be a short voluntary survey.<br/><br/></p>' +
        '<p>[Press ENTER to continue]</p></div>';
  	}
};

var debrief_block = {
  type: "text",
  text: function() {
    return '<div id="jspsych-instructions">' +
        '<p>You won <strong>' +
        getTotalScore() + " Points</strong>! You will receive a bonus payment" +
        ' of &#36;' + getBonus() + '.</p>' +
        '<p>Before we finish, there will be a short voluntary survey.<br/><br/></p>' +
        '<p>[Press ENTER to continue]</p></div>';
  },
  cont_key: 13,	
  timing_post_trial: 5
};

var instructions_survey_block2 = {
    type: "text",
    text: "<div id='jspsych-instructions'>" + 
    '<p>This survey is completely ANONYMOUS, and information collected is only used for our research purposes.</p>' +
    '<p>Nevertheless, every question will have an option of "I prefer not to answer".</p>' +
    '<p>Using your mouse, please move the black cursor to the left or right to choose your option:</p>' +
    "<img src='/static/images/likert_example.png', class='jspsych-instructions-image'>" +
    '<p>[Press ENTER to begin the survey]</p></div>',
    cont_key: 13,
    timing_post_trial: 5
};

var page_1_questions = ["What is your gender?"];
var page_2_questions = ["What is your age?"];
var page_3_questions = ["What is your highest level of education?"];
var page_4_questions = ["What is your race / ethnicity?"];

var scale_1 = ["Male", "I prefer not to answer", "Female"];
var scale_2 = ["18-25", "26-30", "31-40","more than 40","I prefer not to answer"];
var scale_3 = ["I prefer not to answer", "Elementary school", "Middle school", "High school", "College", "Graduate/Professional school"];
var scale_4 = ["I prefer not to answer", "Asian", "African American", "Caucasian", "Native American", "Native Hawaiian or Pacific Islander"];

var survey_likert = {
    type: 'survey-likert',
    questions: [page_1_questions, page_2_questions, page_3_questions, page_4_questions],
    labels: [[scale_1], [scale_2], [scale_3],[scale_4]], // need one scale for every question on a page
    intervals: [[3],[5],[6],[6]],
    show_ticks: [[true],[true],[true],[true]]
};