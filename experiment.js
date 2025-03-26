/**************************************************************************
 * INITIALIZATION
**************************************************************************/

// Initialize jsPsych.
var jsPsych = initJsPsych({
  show_progress_bar: true,
  auto_update_progress_bar: false,
  on_finish: function() {
    //jsPsych.data.displayData();
    saveData();
  }
});

// Capture info from Prolific.
var subject_id = jsPsych.data.getURLVariable('PROLIFIC_PID');
var study_id = jsPsych.data.getURLVariable('STUDY_ID');
var session_id = jsPsych.data.getURLVariable('SESSION_ID');
jsPsych.data.addProperties({
    subject_id: subject_id,
    study_id: study_id,
    session_id: session_id
});

// Set random seed.
const seed = jsPsych.randomization.setSeed();
jsPsych.data.addProperties({
    rng_seed: seed
});

/**************************************************************************
 * GLOBAL VARIABLES 
**************************************************************************/

var DEBUG = false; // CHANGE TO FALSE FOR REAL EXPERIMENT
var REQUIRE_QUESTIONS = !DEBUG; 

// Randomly assign participant to an experimental list (0-3).
// var expt_list_id = jsPsych.randomization.sampleWithReplacement([0,1,2,3], 1)[0];

// Get stimuli according to list ID.
var stimuli = test_stimuli; // test_stimuli is read from prefixes_stimuli.js
if (DEBUG) {
  stimuli = jsPsych.randomization.sampleWithoutReplacement(stimuli, 5); // just use a small number of stimuli when debugging
}
var n_trials = stimuli.length; 

// Conditions.
var CONDITIONS = [
  "improbable", "impossible", "inconceivable"
];

// These variables will be updated on each trial.
var CUR_CONDITION = "";
var CUR_QUERY = "";

/**************************************************************************
 * HELPER FUNCTIONS
**************************************************************************/

function get_random_condition () {
  var condition = jsPsych.randomization.sampleWithReplacement(CONDITIONS, 1)[0];
  return condition
}

function capitalizeFirstLetter(string) {
  return string[0].toUpperCase() + string.slice(1);
}
function get_stimulus(prefix, continuation) {

  var q = "How hard is it to visualize the following scenario?<BR/><BR/>"
  var s = q + capitalizeFirstLetter(prefix) + " " + continuation
  s = s.replace("[POSS]", "their")
  return s
}

function get_condition_order() {
  // There are 70 stimuli in total, and 3 conditions, so make sure everyone
  // sees 23 examples of 2 conditions and 24 examples of the other 1
  var l = [];
  // Add 17 instances of each condition
  CONDITIONS.forEach((cond) => l = l.concat(Array(23).fill(cond)));
  // For two randomly chosen conditions, add one more instance
  var extra_conditions = jsPsych.randomization.sampleWithoutReplacement(CONDITIONS, 1);
  extra_conditions.forEach((cond) => l = l.concat([cond]));
  // Shuffle the full list of conditions
  var l_shuffled = jsPsych.randomization.shuffle(l);
  return l_shuffled
}

var COND_ORDER = get_condition_order();

/**************************************************************************
 * EXPERIMENT CODE
**************************************************************************/

/* create timeline */
var timeline = [];

/* define instructions trial */
var instructions = {
  type: jsPsychInstructions,
  pages: [
    `<div class="jspsych-content" align=left style="width:1000px;text-align: left;">
    <h2>Hello, and welcome to our study!</h2>
    In this study, we will ask you ${n_trials} simple questions.
    <br><br>
    The questions are all about how hard it is to visualize certain scenarios.
    <br>
    <h3>Your task:</h3>
    <ul>
      <li>Read each question carefully.</li>
      <li>Answer how hard it is to visualize the scenario.</li>
      <li>You will answer using a slider.</li>
      <li>Respond as quickly as you can.</li>
    </ul>
    <h3>IMPORTANT:</h3>
    <ul>
      <li>Some questions might sound weird or nonsensical. Just answer the best you can.</li>
      <li>There are no right or wrong answers. We are simply interested in your intuitions.</li>
      <li>Remember to respond quickly!</li>
    </ul>
    <br>
    Once you are ready, click the button below to begin the experiment.
    </div>
    <br>`
  ],
  button_label_next: "Begin experiment",
  allow_backward: false,
  show_clickable_nav: true
}
instructions.on_finish = function (data) {data.task_type = "instructions";};
timeline.push(instructions);

var trial = {
  type: jsPsychHtmlSliderResponse,
  data: {},
  stimulus: function() {
    // Get last element of pre-generated order of conditions.
    CUR_CONDITION = COND_ORDER.pop(); // get_random_condition();
    CUR_QUERY = get_stimulus(
      jsPsych.timelineVariable("classification_prefix"), 
      jsPsych.timelineVariable(CUR_CONDITION)
    );
    var html = `<div style="font-size:20px;"><p>${CUR_QUERY}</p></div>`;
    return html
  },
  require_movement: true,
  min: 0,
  max: 100,
  // step: 1,
  labels: ["Extremely easy to visualize", "Extremely hard to visualize"],
  slider_start: 50,
  slider_width: 300
};
trial.on_start = function(trial){
  trial.data = jsPsych.getAllTimelineVariables();
  trial.data.task_type = "critical";
};
trial.on_finish = function(data){
  // at the end of each trial, update the progress bar
  // based on the current value and the proportion to update for each trial
  var cur_progress_bar_value = jsPsych.getProgressBarCompleted();
  jsPsych.setProgressBar(cur_progress_bar_value + (1/n_trials));

  data.condition = CUR_CONDITION;
  data.query = CUR_QUERY;
};

/* define test procedure */
var test_procedure = {
  timeline: [trial],
  timeline_variables: stimuli,
  randomize_order: true
};
timeline.push(test_procedure);

/* define postquestionnaire */
var post_test_survey = {
  type: jsPsychSurveyText,
  preamble: `
    <p>Thanks for contributing to our study, and have a nice day!</p>
    <p>The following questions are optional, but your feedback would really help us improve our study for future participants.</p>
  `,
  questions: [
    {prompt: "What is your native language?", name: 'language'},
    {prompt: "What is your gender?", name: 'gender'},
    {prompt: "Please leave any additional feedback in the text box below.", name: 'feedback', rows: 10}
  ],
  on_finish: function(data) {data.task_type = "survey"}
};
timeline.push(post_test_survey);

/* start the experiment */
function run_experiment() {
    jsPsych.run(timeline);
}