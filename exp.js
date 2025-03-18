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

var STIM_COUNT = 60;
var TRAIN_COUNT = 4;

// Get stimuli according to list ID.
var stimuli = test_stimuli; // test_stimuli is read from prefixes_stimuli.js
if (DEBUG) {
  STIM_COUNT = 4; // just use a small number of stimuli when debugging
}

stimuli = jsPsych.randomization.sampleWithoutReplacement(stimuli, STIM_COUNT + TRAIN_COUNT); // Sample stimuli randomly
var train_stimuli = stimuli.slice(0, TRAIN_COUNT)
var test_stimuli = stimuli.slice(TRAIN_COUNT, TRAIN_COUNT + STIM_COUNT)

var n_trials = test_stimuli.length; 

// Conditions.
var CONDITIONS = [
  "probable", "improbable", "impossible", "inconceivable"
];

const PROMPT_TYPE_MAP = new Map() 
PROMPT_TYPE_MAP.set("improbable", "improbable")
PROMPT_TYPE_MAP.set("impossible", "impossible")
PROMPT_TYPE_MAP.set("inconceivable", "nonsensical")

const REMINDER_MAP = new Map()
REMINDER_MAP.set("improbable", 
  `<strong>Improbable</strong> means it is possible, but unlikely (e.g., "I painted the house with my hair.").`)

REMINDER_MAP.set("impossible",
  `<strong>Impossible</strong> means it cannot happen in our world given the laws of nature (e.g., "I painted the house with my mind."). `)
REMINDER_MAP.set("inconceivable",
  `<strong>Nonsensical</strong> means it does not make sense due to some basic conceptual error ("I painted the house with my number."). `)

// Randomly Select Prompt Type, then keep it fixed 
var PROMPT_TYPE = ["improbable", "impossible", "inconceivable"]
PROMPT_TYPE= jsPsych.randomization.sampleWithoutReplacement(PROMPT_TYPE, 1)

// These variables will be updated on each trial.
var CUR_CONDITION = "";
var CUR_PROMPT = "";
var CUR_QUERY = "";

/**************************************************************************
 * HELPER FUNCTIONS
**************************************************************************/

function repeatElements(arr, times) {
  var l = arr.flatMap(num => Array(times).fill(num));
  return l
}

function repeatArray(arr, times){
  var l = [].concat(...Array(times).fill(arr));
  return l
}


function get_stimulus(verb, object, prep, continuation, condition, reminder) {
  var task = "Rate the following phrase according to how <b>" + condition + "</b> it is. <p>Reminder: " + reminder + "</p><BR/><BR/>\""
  var s = task + verb + " " + object + " " + prep + " " + continuation + "\""
  s = s.replace("[POSS]", "their")
  return s
}

function get_s_condition_order(COUNT) {
  // There are COUNT test/train stimuli in total, and 4 stim conditions, so make sure everyone
  // sees COUNT/4 examples of each condition
  var s = [];
  CONDITIONS.forEach((cond) => s = s.concat(Array(COUNT/4).fill(cond)))
  return s
}

function get_q_condition(COUNT) {
  // Generate a list of COUNT instances of each q_condition
  var q = [];
  PROMPT_TYPE.forEach((cond) => q = q.concat(Array(COUNT).fill(cond)))
  return q
}


// Generate train stimulus condition order and 
// test stimulus condition order repeated three times
var S_COND_ORDER_TRAIN= get_s_condition_order(TRAIN_COUNT);

var S_COND_ORDER = get_s_condition_order(STIM_COUNT);
S_COND_ORDER = jsPsych.randomization.sampleWithoutReplacement(S_COND_ORDER, STIM_COUNT);

// Generate question condition order for train and test
var Q_COND_ORDER_TRAIN = get_q_condition(TRAIN_COUNT);

// Repeat [improbable, impossible, inconceivable] in that order over and over
var Q_COND_ORDER = get_q_condition(STIM_COUNT);

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
    This study will consist of two short phases. First, we will ask you ${TRAIN_COUNT} simple questions to familiarize
    you with the task. Next, we will ask you ${n_trials} similar questions.
    <br><br>
    The questions are all about rating how ${PROMPT_TYPE_MAP.get(PROMPT_TYPE[0])} particular scenarios are.
    <br>
    <p>
    ${REMINDER_MAP.get(PROMPT_TYPE[0])}
    <p>
    <h3>Your task:</h3>
    <ul>
      <li>Read each question carefully.</li>
      <li>Answer how ${PROMPT_TYPE[0]} the sentence is.</li>
      <li>You will answer using a slider.</li>
      <li>Respond as quickly as you can.</li>
    </ul>
    <h3>IMPORTANT:</h3>
    <ul>
      <li><strong>Please use the entire slider when responding.</strong></li>
      <li>Answer the questions based on what is possible given the physical laws of the real world.</li>
      <li>There are no right or wrong answers. We are simply interested in your intuitions.</li>
    </ul>
    <br>
    Once you are ready, click the button below to begin the first phase of the study.
    </div>
    <br>`
  ],
  button_label_next: "Begin Phase 1",
  allow_backward: false,
  show_clickable_nav: true
}
instructions.on_finish = function (data) {data.task_type = "instructions";};
timeline.push(instructions);

// Define the behavior of the training trials, which is identical to test trails
// except using different stimuli
var train_trial = {
  type: jsPsychHtmlSliderResponse,
  data: {},
  stimulus: function() {
    // Get last element of pre-generated order of conditions.
    CUR_CONDITION = S_COND_ORDER_TRAIN.shift();
    CUR_PROMPT = Q_COND_ORDER_TRAIN.shift();

    CUR_QUERY = get_stimulus(
      jsPsych.timelineVariable("verb_participle"), 
      jsPsych.timelineVariable("object"),
      jsPsych.timelineVariable("prep"),
      jsPsych.timelineVariable(CUR_CONDITION),
      PROMPT_TYPE_MAP.get(CUR_PROMPT),
      REMINDER_MAP.get(CUR_PROMPT),

    );
    var html = `<div style="font-size:20px;"><p>${CUR_QUERY}</p></div>`;
    return html
  },

  require_movement: true,
  min: 0,
  max: 100,
  // step: 1,
  labels: function() {
    return ["", `More ${PROMPT_TYPE_MAP.get(CUR_PROMPT)} &#8594`, ""]
  },
  slider_start: 50,
  slider_width: 400
};
train_trial.on_start = function(train_trial){
  train_trial.data = jsPsych.getAllTimelineVariables();
  train_trial.data.task_type = "training";
};
train_trial.on_finish = function(data){
  // at the end of each trial, update the progress bar
  // based on the current value and the proportion to update for each trial
  var cur_progress_bar_value = jsPsych.getProgressBarCompleted();
  jsPsych.setProgressBar(cur_progress_bar_value + (1/TRAIN_COUNT));

  // Save other variables.
  data.condition = CUR_CONDITION;
  data.prompt = CUR_PROMPT
  data.query = CUR_QUERY;
};


/* define train_trial procedure */
var train_procedure = {
  timeline: [train_trial],
  timeline_variables: train_stimuli,
  randomize_order: false
};
timeline.push(train_procedure);

/* define ready trial, which occurs between train and test */
var ready = {
  type: jsPsychInstructions,
  pages: [
    `<div class="jspsych-content" align=left style="width:1000px;text-align: left;">
    We will now commence the main study. We will ask you ${n_trials} simple questions.
    <br>
    <h3>REMINDER:</h3>
    <br>
    The questions are all about rating how ${PROMPT_TYPE_MAP.get(PROMPT_TYPE[0])} particular scenarios are.
    <br>
    <p>
    ${REMINDER_MAP.get(PROMPT_TYPE[0])}
    <p>
    <h3>Your task:</h3>
    <ul>
      <li>Read each question carefully.</li>
      <li>Answer how ${PROMPT_TYPE[0]} the sentence is.</li>
      <li>You will answer using a slider.</li>
      <li>Respond as quickly as you can.</li>
    </ul>
    <h3>IMPORTANT:</h3>
    <ul>
      <li><strong>Please use the entire slider when responding.</strong></li>
      <li>Answer the questions based on what is possible given the physical laws of the real world.</li>
      <li>There are no right or wrong answers. We are simply interested in your intuitions.</li>
    </ul>
    <br>
    Once you are ready, click the button below to begin the second phase of the study.
    </div>
    <br>`
  ],
  button_label_next: "Begin Phase 2",
  allow_backward: false,
  show_clickable_nav: true
}
ready.on_finish = function (data) {
  data.task_type = "ready";
  cur_progress_bar_value = 0;
  jsPsych.setProgressBar(0);

};
timeline.push(ready);


// define behavior of main experimental trails
var trial = {
  type: jsPsychHtmlSliderResponse,
  data: {},
  stimulus: function() {
    // Get last element of pre-generated order of conditions.
    CUR_CONDITION = S_COND_ORDER.shift();
    CUR_PROMPT = Q_COND_ORDER.shift();

    CUR_QUERY = get_stimulus(
      jsPsych.timelineVariable("verb_participle"), 
      jsPsych.timelineVariable("object"),
      jsPsych.timelineVariable("prep"),
      jsPsych.timelineVariable(CUR_CONDITION),
      PROMPT_TYPE_MAP.get(CUR_PROMPT),
      REMINDER_MAP.get(CUR_PROMPT)

    );
    var html = `<div style="font-size:20px;"><p>${CUR_QUERY}</p></div>`;
    return html
  },

  require_movement: true,
  min: 0,
  max: 100,
  // step: 1,
  labels: function() {
    return ["", `More ${PROMPT_TYPE_MAP.get(CUR_PROMPT)} &#8594`, ""]
  },
  slider_start: 50,
  slider_width: 400
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

  // Save other variables.
  // data.counterbalance = CUR_COUNTERBALANCE;
  data.condition = CUR_CONDITION;
  data.prompt = CUR_PROMPT
  data.query = CUR_QUERY;
};


/* define test procedure */
var test_procedure = {
  timeline: [trial],
  timeline_variables: test_stimuli,
  randomize_order: false
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