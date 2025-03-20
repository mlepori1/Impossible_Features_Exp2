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
var STIM_COUNT = 95;
var ATTN_COUNT = 5;
var CONTEXT = true // Change to true to include contextual info in each button

// Get stimuli according to list ID.
var stimuli = test_stimuli; // test_stimuli is read from prefixes_stimuli.js
if (DEBUG) {
  STIM_COUNT = 15;
}

// For deciding when to deploy attention checks
var n_exp_trials = STIM_COUNT;
var exp_trial_progress = 0.0;
var ATTN_INCREMENT = 1 / ATTN_COUNT;
var ATTN_THRESHOLD = ATTN_INCREMENT;

var stimuli_0 = jsPsych.randomization.sampleWithReplacement(test_stimuli, STIM_COUNT); // Select stimuli for left option
var stimuli_1 = jsPsych.randomization.sampleWithReplacement(test_stimuli, STIM_COUNT); // Select stimuli for right option
var attn_check_stimuli = jsPsych.randomization.sampleWithReplacement(test_stimuli, STIM_COUNT); // Select stimuli for right option

// Updated every trial to give options for attn check
var CURR_CHOICES = '';
// Updated every attn check to verify correctness
var CORRECT_CHOICE = '';
var ATTN_CHOICE = '';
var ATTN_CHOICES = '';

var n_trials = STIM_COUNT + ATTN_COUNT; 

// Conditions.
if (CONTEXT) {
  var CONDITIONS = [
    "improbable", "impossible", "inconceivable"
  ];
} else {
  var CONDITIONS = [
    "probable", "improbable", "impossible", "inconceivable"
  ];
}

var CONCEPT = [
  "improbable", "impossible", "inconceivable"
]

var CURR_CONCEPT = jsPsych.randomization.sampleWithReplacement(CONCEPT, 1)[0];

// Iterate through stimuli_0 and stimuli_1, create a new array with both stimuli and assign conditions.
// Ensure that if the stimuli are the same, the conditions are not.
var combined_stimuli = [];

for (let i = 0; i < STIM_COUNT; i++) {

  s_0 = stimuli_0[i]["classification_prefix"];
  s_1 = stimuli_1[i]["classification_prefix"];
  attn = attn_check_stimuli[i]["classification_prefix"]

  if (s_0 == s_1){
    var conditions = jsPsych.randomization.sampleWithoutReplacement(CONDITIONS, 2);
  } else {
    var conditions = jsPsych.randomization.sampleWithReplacement(CONDITIONS, 2);
  }

  // ensure that the attention check is always distinct from the two choices
  var attn_condition = jsPsych.randomization.sampleWithReplacement(CONDITIONS, 1)[0];
  while (conditions.includes(attn_condition)){
    attn_condition = jsPsych.randomization.sampleWithReplacement(CONDITIONS, 1)[0];
  }

  combined_stimuli.push(
      {
        "stimulus_0": s_0,
        "stimulus_1": s_1,
        "attn_stimulus": attn,
        "condition_0": conditions[0],
        "condition_1": conditions[1],
        "attn_condition": attn_condition,
        "continuation_0": stimuli_0[i][conditions[0]],
        "continuation_1": stimuli_1[i][conditions[1]],
        "attn_continuation": attn_check_stimuli[i][attn_condition],
        "id_0": stimuli_0[i]["item_id"],
        "id_1": stimuli_1[i]["item_id"],
        "context_0": stimuli_0[i]["context"],
        "context_1": stimuli_1[i]["context"],
        "attn_context": attn_check_stimuli[i]["context"],
      }
    )
}

const PROMPT_TYPE_MAP = new Map() 
PROMPT_TYPE_MAP.set("improbable", "improbable")
PROMPT_TYPE_MAP.set("impossible", "impossible")
PROMPT_TYPE_MAP.set("inconceivable", "nonsensical")

const REMINDER_MAP = new Map()
REMINDER_MAP.set("improbable", 
  `<strong>Improbable</strong> means it is possible, but unlikely (e.g., "I painted the house with my hair.").`)
REMINDER_MAP.set("impossible",
  `<strong>Impossible</strong> means it cannot happen in our world given the laws of nature, but may happen in a fictional world (e.g., "I painted the house with my mind."). `)
REMINDER_MAP.set("inconceivable",
  `<strong>Nonsensical</strong> means it does not make sense due to some basic conceptual error ("I painted the house with my number."). `)

/**************************************************************************
 * HELPER FUNCTIONS
**************************************************************************/

function capitalizeFirstLetter(string) {
  console.log(string);
  return string[0].toUpperCase() + string.slice(1);
}

function get_stimulus(stimulus, continuation, context) {
  if (context === ``){
    var stim = capitalizeFirstLetter(stimulus) + " " + continuation;

  } else {
    var stim = capitalizeFirstLetter(context) + " " + stimulus + " " + continuation;
  }  
  stim = stim.replace("[POSS]", "their");
  return stim
}

/**************************************************************************
 * EXPERIMENT CODE
**************************************************************************/

/* create timeline */
var timeline = [];

// Instructions procedure
var instructions = {
  type: jsPsychHtmlKeyboardResponse,
  choices: " ",
  stimulus: `
  <div class="jspsych-content" align=left style="width:100%;text-align: left;">
  <h2>Hello, and welcome to our study!</h2>
      In this study, we will ask you to ${STIM_COUNT + ATTN_COUNT} questions.
      <p>
      In ${STIM_COUNT} of the questions, we will need your help deciding which statement is more <strong>${PROMPT_TYPE_MAP.get(CURR_CONCEPT)}</strong>.
      </p>
      ${REMINDER_MAP.get(CURR_CONCEPT)}
      <p>
      The remaining questions will check to make sure that you are paying attention to the study.
      <p>
    <h3>IMPORTANT:</h3>
    <ul>
      <li>Respond as quickly as you can.</li>
      <li>Answer the questions based on what is possible given the physical laws of the real world.</li>
      <li>There are no right or wrong answers. We are simply interested in your intuitions.</li>
      </ul>
    Once you are done reading this page, please press SPACEBAR to continue.
    </p>
  </div>
  `
}
timeline.push(instructions);


// Procedure for the trial slides
var trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `<div style="font-size:20px;"><p>Which scenario is more ${PROMPT_TYPE_MAP.get(CURR_CONCEPT)}?</p>
  Reminder: ${REMINDER_MAP.get(CURR_CONCEPT)}</div>`,
  choices: function() {
    // Get last element of pre-generated order of conditions.
    if (CONTEXT) {
      var CHOICE_0 = get_stimulus(
        jsPsych.timelineVariable("stimulus_0"),
        jsPsych.timelineVariable("continuation_0"),
        jsPsych.timelineVariable("context_0") 
      );
  
      var CHOICE_1 = get_stimulus(
        jsPsych.timelineVariable("stimulus_1"),
        jsPsych.timelineVariable("continuation_1"),
        jsPsych.timelineVariable("context_1") 
      );
    } else {
      var CHOICE_0 = get_stimulus(
        jsPsych.timelineVariable("stimulus_0"),
        jsPsych.timelineVariable("continuation_0"),
        "" 
      );
  
      var CHOICE_1 = get_stimulus(
        jsPsych.timelineVariable("stimulus_1"),
        jsPsych.timelineVariable("continuation_1"),
        "" 
      );
    }
  
    var CHOICES = [CHOICE_0, CHOICE_1];
    return CHOICES
  },
  prompt: ``,
  margin_vertical: "24px",
  data: {}
}
trial.on_start = function(trial){
  trial.data = jsPsych.getAllTimelineVariables();
  trial.data.task_type = "critical";
  trial.data.concept = CURR_CONCEPT;
};
trial.on_finish = function(data){
  // at the end of each trial, update the progress bar
  // based on the current value and the proportion to update for each trial
  var cur_progress_bar_value = jsPsych.getProgressBarCompleted();
  jsPsych.setProgressBar(cur_progress_bar_value + (1/n_trials));
  // For deciding whether to deploy an attention check
  exp_trial_progress = exp_trial_progress + (1/n_exp_trials);


  // Save other variables.
  data.response_label = data.response;
  data.provided_context = CONTEXT;
  CURR_CHOICES = trial.choices();
};

// Define Attention Check Logic
var optional_attention_check = {
  type: jsPsychHtmlButtonResponse,
  data: {},
  stimulus: `<div style="font-size:20px;"><p>Which scenario was included in the previous question?</p></div>`,
  choices: function() {
    // Get last element of pre-generated order of conditions.
    CORRECT_CHOICE = jsPsych.randomization.sampleWithReplacement(CURR_CHOICES, 1)[0]
    if (CONTEXT) {
      ATTN_CHOICE = get_stimulus(
        jsPsych.timelineVariable("attn_stimulus"),
        jsPsych.timelineVariable("attn_continuation"),
        jsPsych.timelineVariable("attn_context") 
      );
    } else {
      ATTN_CHOICE = get_stimulus(
        jsPsych.timelineVariable("attn_stimulus"),
        jsPsych.timelineVariable("attn_continuation"),
        "" 
      );
    }
  
    ATTN_CHOICES = [CORRECT_CHOICE, ATTN_CHOICE];
    ATTN_CHOICES = jsPsych.randomization.sampleWithoutReplacement(ATTN_CHOICES, 2);
    return ATTN_CHOICES
  }
};

optional_attention_check.on_start = function(optional_attention_check){
  optional_attention_check.data = jsPsych.getAllTimelineVariables();
  optional_attention_check.data.task_type = "attention_check";
  optional_attention_check.data.response_string = ATTN_CHOICES;
  optional_attention_check.data.correct = CORRECT_CHOICE;
  optional_attention_check.data.attn = ATTN_CHOICE;
};

optional_attention_check.on_finish = function(data){
  // at the end of each trial, update the progress bar
  // based on the current value and the proportion to update for each trial
  var cur_progress_bar_value = jsPsych.getProgressBarCompleted();
  jsPsych.setProgressBar(cur_progress_bar_value + (1/n_trials));  
};


var attention_bool = {
  timeline: [optional_attention_check],
  conditional_function: function(){
      if(exp_trial_progress >= ATTN_THRESHOLD){
        // Include epsilon value to handle weird rounding errors
        const epsilon = .0000001
        ATTN_THRESHOLD = ATTN_THRESHOLD + ATTN_INCREMENT - epsilon ;
        return true;
      } else {
        return false;
      }
  }
}


/* define test procedure */
var test_procedure = {
  timeline: [trial, attention_bool],
  timeline_variables: combined_stimuli,
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