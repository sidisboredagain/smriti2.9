// Shared static-UI translation table for the patient app and the
// caregiver's Therapy session screen (the one caregiver-facing screen
// that displays a patient's actual session, so it follows the patient's
// language too). This only covers the app's own button labels, headings,
// and status/error messages -- it never touches actual patient data
// (memory titles/content, transcripts) or already-localized
// backend-generated text (game questions and instructions, which
// ai_game_generator.py already builds per-language, and Teach Me's
// Gemini replies, which are asked to reply in the patient's language).
//
// Honesty note: the Hindi and Bengali text below was written directly
// (not machine-translated), but was not reviewed by a native speaker
// before shipping. The Assamese text is the least certain of the three --
// English and Bengali are far more common in most translators' training
// and reference material than Assamese, so treat the Assamese strings as
// a first draft that a native or fluent Assamese speaker should check
// before this is relied on with a real patient. If any of the three
// reads wrong, the fix is just editing the values in this one file --
// nothing else in the app needs to change.
//
// A handful of values are intentionally left untranslated everywhere:
// the "SMRITI AI" brand name, and the patient's language name itself
// (e.g. showing "Patient language: Hindi" rather than translating the
// word "Hindi") -- those are treated as proper nouns/labels, not prose.

export const SUPPORTED_LANGUAGES = ["English", "Hindi", "Bengali", "Assamese"];

const EN = {
  // Shared top bar / navigation labels
  topbar_play: "Play",
  topbar_remember: "Remember",
  topbar_memories: "Your Memories",
  topbar_comfort: "Comfort",
  topbar_teach_me: "Teach Me",
  go_home_aria: "Go home",

  // Home screen
  greeting_morning: "Good morning",
  greeting_afternoon: "Good afternoon",
  greeting_evening: "Good evening",
  hello_name: "Hello, {name}",
  home_play_title: "Play",
  home_play_subtitle: "A gentle memory game",
  home_remember_title: "Remember",
  home_remember_subtitle: "Tell me a memory",
  home_memories_title: "Memories",
  home_memories_subtitle: "Look at your memories",
  home_comfort_title: "Comfort",
  home_comfort_subtitle: "A familiar memory",
  home_teach_me_title: "Teach Me",
  home_teach_me_subtitle: "Tell Smriti about a memory",

  // Memories screen
  memories_loading: "Loading your memories...",
  memories_empty: "No memories yet.",
  listen: "Listen",

  // Play screen
  play_getting_ready: "Getting your game ready...",
  play_try_again: "Try again",
  play_ready_to_try_again: "Ready to try again",
  play_later: "Later",
  play_wonderful_work: "Wonderful work today",
  play_finished_all: "You finished all of your memories for today.",
  play_play_again: "Play again",
  play_gentle_correct: "Wonderful! That was a special memory.",
  play_gentle_try_again: "That's okay. Let's try another memory.",
  play_finish: "Finish",
  play_next: "Next",

  // Comfort screen / ComfortCard
  comfort_default_message: "A familiar memory for you.",
  comfort_show_another: "Show me another",
  comfort_default_text: "That's okay. Let's take a little moment.",
  comfort_photo_failed: "This photo couldn't be loaded right now.",
  comfort_fallback_text: "You are doing wonderfully. Take all the time you need.",

  // Remember screen
  remember_prompt: "Tell me about a memory. Speak whenever you are ready.",
  remember_listening: "Listening",
  remember_record: "Record",
  remember_one_moment: "One moment",
  remember_stop: "Stop",
  remember_thank_you: "Thank you for sharing that.",
  remember_err_generic: "Something went wrong. Let's try again.",
  remember_err_no_audio: "I didn't hear anything. Let's try again.",
  remember_err_mic_permission: "I need permission to use the microphone to hear you.",
  remember_err_save_failed: "I couldn't save that. Let's try again.",

  // Teach Me screen
  teach_me_pick_prompt: "Pick a memory, and tell me all about it.",
  teach_me_no_memories_title: "No memories yet.",
  teach_me_no_memories_body: "Add a memory first using Remember, then come back here.",
  teach_me_one_moment_ellipsis: "One moment...",
  teach_me_tell_me_more: "Tell me more",
  teach_me_smriti_listening: "Smriti is listening",
  teach_me_done_for_now: "I'm done for now",
  teach_me_back_home: "Back to Home",
  teach_me_err_load_memories: "Could not load your memories.",
  teach_me_err_trouble: "I'm having trouble right now. Let's try again.",
  teach_me_err_hear: "I couldn't quite hear that. Let's try again.",

  // Therapy screen (caregiver-facing, but shows the patient's session)
  therapy_title: "Today's Therapy Session",
  therapy_description: "A gentle cognitive activity created from familiar memories. Take your time and enjoy the memory.",
  therapy_loading_patient_language: "Loading patient language...",
  therapy_patient_language_label: "Patient language: {language}",
  therapy_creating_session: "Creating 6-question session...",
  therapy_start_session: "Start 6-Question Session",
  therapy_loading_language: "Loading language...",
  therapy_question_of: "Question {current} of {total}",
  therapy_completed_count: "{completed} / {total} completed",
  therapy_memory_about: "This question is about the memory:",
  therapy_listen_to_question: "Listen to Question",
  therapy_speaking: "Speaking...",
  therapy_correct: "✓ Correct! Great job.",
  therapy_try_look_again: "Take another look at the memory. You can continue when ready.",
  therapy_saving_progress: "Saving progress...",
  therapy_finish_session: "Finish Session",
  therapy_next_question: "Next Question",
  therapy_session_complete: "Therapy Session Complete",
  therapy_completed_all: "You completed all 6 personalized questions. Great work!",
  therapy_questions_completed: "{completed} of {total} questions completed",
  therapy_starting: "Starting...",
  therapy_start_another: "Start Another Session",
  therapy_adaptive: "Adaptive",
  therapy_comfort_mode: "Comfort Mode",

  game_type_multiple_choice: "Memory Recall",
  game_type_true_false: "Memory Check",
  game_type_fill_blank: "Recall Challenge",
  game_type_attention: "Attention Challenge",
  game_type_routine_recall: "Routine Recall",
  game_type_pattern_recognition: "Pattern Recognition",
  game_type_object_recognition: "Object Recognition",
  game_type_emotional_engagement: "Personal Memory",
  game_type_memory_match: "Memory Match",
  game_type_memory_sequence: "Memory Sequence",
  game_type_visual_recall: "Object & Visual Recall",
  game_type_attention_focus: "Attention Focus",
  game_type_default: "Cognitive Activity",
};

const HI = {
  topbar_play: "खेलें",
  topbar_remember: "याद करें",
  topbar_memories: "आपकी यादें",
  topbar_comfort: "सुकून",
  topbar_teach_me: "मुझे सिखाएं",
  go_home_aria: "घर जाएं",

  greeting_morning: "सुप्रभात",
  greeting_afternoon: "नमस्ते",
  greeting_evening: "शुभ संध्या",
  hello_name: "नमस्ते, {name}",
  home_play_title: "खेलें",
  home_play_subtitle: "एक सरल याददाश्त खेल",
  home_remember_title: "याद करें",
  home_remember_subtitle: "मुझे एक याद बताएं",
  home_memories_title: "यादें",
  home_memories_subtitle: "अपनी यादें देखें",
  home_comfort_title: "सुकून",
  home_comfort_subtitle: "एक जानी-पहचानी याद",
  home_teach_me_title: "मुझे सिखाएं",
  home_teach_me_subtitle: "स्मृति को अपनी याद के बारे में बताएं",

  memories_loading: "आपकी यादें लोड हो रही हैं...",
  memories_empty: "अभी तक कोई याद नहीं है।",
  listen: "सुनें",

  play_getting_ready: "आपका खेल तैयार हो रहा है...",
  play_try_again: "फिर से कोशिश करें",
  play_ready_to_try_again: "फिर से कोशिश करने के लिए तैयार",
  play_later: "बाद में",
  play_wonderful_work: "आज शानदार काम रहा",
  play_finished_all: "आपने आज की सभी यादें पूरी कर लीं।",
  play_play_again: "फिर से खेलें",
  play_gentle_correct: "शानदार! यह एक खास याद थी।",
  play_gentle_try_again: "कोई बात नहीं। चलिए एक और याद आजमाएं।",
  play_finish: "समाप्त करें",
  play_next: "अगला",

  comfort_default_message: "आपके लिए एक जानी-पहचानी याद।",
  comfort_show_another: "कोई और दिखाएं",
  comfort_default_text: "कोई बात नहीं। आइए एक पल रुकते हैं।",
  comfort_photo_failed: "यह फोटो अभी लोड नहीं हो सकी।",
  comfort_fallback_text: "आप बहुत अच्छा कर रहे हैं। जितना समय चाहिए लीजिए।",

  remember_prompt: "मुझे एक याद के बारे में बताइए। जब आप तैयार हों तब बोलिए।",
  remember_listening: "सुन रही हूं",
  remember_record: "रिकॉर्ड",
  remember_one_moment: "एक पल",
  remember_stop: "रोकें",
  remember_thank_you: "इसे साझा करने के लिए धन्यवाद।",
  remember_err_generic: "कुछ गलत हो गया। फिर से कोशिश करें।",
  remember_err_no_audio: "मुझे कुछ सुनाई नहीं दिया। फिर से कोशिश करें।",
  remember_err_mic_permission: "आपकी आवाज सुनने के लिए मुझे माइक्रोफोन की अनुमति चाहिए।",
  remember_err_save_failed: "मैं इसे सहेज नहीं सका। फिर से कोशिश करें।",

  teach_me_pick_prompt: "एक याद चुनें, और मुझे उसके बारे में सब कुछ बताएं।",
  teach_me_no_memories_title: "अभी तक कोई याद नहीं है।",
  teach_me_no_memories_body: "पहले 'याद करें' से एक याद जोड़ें, फिर यहां वापस आएं।",
  teach_me_one_moment_ellipsis: "एक पल...",
  teach_me_tell_me_more: "और बताएं",
  teach_me_smriti_listening: "स्मृति सुन रही है",
  teach_me_done_for_now: "अभी के लिए बस",
  teach_me_back_home: "घर वापस जाएं",
  teach_me_err_load_memories: "आपकी यादें लोड नहीं हो सकीं।",
  teach_me_err_trouble: "अभी मुझे थोड़ी परेशानी हो रही है। फिर से कोशिश करें।",
  teach_me_err_hear: "मुझे ठीक से सुनाई नहीं दिया। फिर से कोशिश करें।",

  therapy_title: "आज का थेरेपी सत्र",
  therapy_description: "जानी-पहचानी यादों से बनी एक सरल स्मृति-गतिविधि। अपना समय लें और याद का आनंद लें।",
  therapy_loading_patient_language: "मरीज़ की भाषा लोड हो रही है...",
  therapy_patient_language_label: "मरीज़ की भाषा: {language}",
  therapy_creating_session: "6-प्रश्न सत्र बनाया जा रहा है...",
  therapy_start_session: "6-प्रश्न सत्र शुरू करें",
  therapy_loading_language: "भाषा लोड हो रही है...",
  therapy_question_of: "प्रश्न {current} से {total}",
  therapy_completed_count: "{completed} / {total} पूरे",
  therapy_memory_about: "यह प्रश्न इस याद के बारे में है:",
  therapy_listen_to_question: "प्रश्न सुनें",
  therapy_speaking: "बोल रहा है...",
  therapy_correct: "✓ सही! बहुत खूब।",
  therapy_try_look_again: "याद को दोबारा देखें। तैयार होने पर जारी रख सकते हैं।",
  therapy_saving_progress: "प्रगति सहेजी जा रही है...",
  therapy_finish_session: "सत्र समाप्त करें",
  therapy_next_question: "अगला प्रश्न",
  therapy_session_complete: "थेरेपी सत्र पूरा",
  therapy_completed_all: "आपने सभी 6 व्यक्तिगत प्रश्न पूरे किए। बहुत खूब!",
  therapy_questions_completed: "{completed} में से {total} प्रश्न पूरे",
  therapy_starting: "शुरू हो रहा है...",
  therapy_start_another: "एक और सत्र शुरू करें",
  therapy_adaptive: "अनुकूल",
  therapy_comfort_mode: "सुकून मोड",

  game_type_multiple_choice: "याददाश्त स्मरण",
  game_type_true_false: "याददाश्त जांच",
  game_type_fill_blank: "स्मरण चुनौती",
  game_type_attention: "ध्यान चुनौती",
  game_type_routine_recall: "दिनचर्या स्मरण",
  game_type_pattern_recognition: "पैटर्न पहचान",
  game_type_object_recognition: "वस्तु पहचान",
  game_type_emotional_engagement: "निजी याद",
  game_type_memory_match: "याददाश्त मिलान",
  game_type_memory_sequence: "याददाश्त क्रम",
  game_type_visual_recall: "वस्तु और दृश्य स्मरण",
  game_type_attention_focus: "ध्यान केंद्रण",
  game_type_default: "स्मृति-गतिविधि",
};

const BN = {
  topbar_play: "খেলুন",
  topbar_remember: "মনে করুন",
  topbar_memories: "আপনার স্মৃতি",
  topbar_comfort: "সান্ত্বনা",
  topbar_teach_me: "আমাকে শেখাও",
  go_home_aria: "বাড়ি যান",

  greeting_morning: "শুভ সকাল",
  greeting_afternoon: "শুভ বিকাল",
  greeting_evening: "শুভ সন্ধ্যা",
  hello_name: "হ্যালো, {name}",
  home_play_title: "খেলুন",
  home_play_subtitle: "একটি সহজ স্মৃতি খেলা",
  home_remember_title: "মনে করুন",
  home_remember_subtitle: "আমাকে একটি স্মৃতি বলুন",
  home_memories_title: "স্মৃতি",
  home_memories_subtitle: "আপনার স্মৃতি দেখুন",
  home_comfort_title: "সান্ত্বনা",
  home_comfort_subtitle: "একটি চেনা স্মৃতি",
  home_teach_me_title: "আমাকে শেখাও",
  home_teach_me_subtitle: "স্মৃতিকে একটি স্মৃতি সম্পর্কে বলুন",

  memories_loading: "আপনার স্মৃতি লোড হচ্ছে...",
  memories_empty: "এখনো কোনো স্মৃতি নেই।",
  listen: "শুনুন",

  play_getting_ready: "আপনার খেলা প্রস্তুত হচ্ছে...",
  play_try_again: "আবার চেষ্টা করুন",
  play_ready_to_try_again: "আবার চেষ্টা করতে প্রস্তুত",
  play_later: "পরে",
  play_wonderful_work: "আজ চমৎকার কাজ হয়েছে",
  play_finished_all: "আজকের জন্য আপনার সব স্মৃতি শেষ করেছেন।",
  play_play_again: "আবার খেলুন",
  play_gentle_correct: "চমৎকার! এটি একটি বিশেষ স্মৃতি ছিল।",
  play_gentle_try_again: "কোনো অসুবিধা নেই। আসুন আরেকটি স্মৃতি দেখি।",
  play_finish: "শেষ করুন",
  play_next: "পরবর্তী",

  comfort_default_message: "আপনার জন্য একটি চেনা স্মৃতি।",
  comfort_show_another: "আরেকটি দেখান",
  comfort_default_text: "কোনো অসুবিধা নেই। আসুন একটু সময় নিই।",
  comfort_photo_failed: "এই ছবিটি এখন লোড করা যায়নি।",
  comfort_fallback_text: "আপনি খুব ভালো করছেন। যতটা সময় দরকার নিন।",

  remember_prompt: "আমাকে একটি স্মৃতি সম্পর্কে বলুন। যখন প্রস্তুত তখন কথা বলুন।",
  remember_listening: "শোনা হচ্ছে",
  remember_record: "রেকর্ড",
  remember_one_moment: "এক মুহূর্ত",
  remember_stop: "থামুন",
  remember_thank_you: "এটি শেয়ার জন্য ধন্যবাদ।",
  remember_err_generic: "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।",
  remember_err_no_audio: "আমি কিছু শুনতে পাইনি। আবার চেষ্টা করুন।",
  remember_err_mic_permission: "আপনার কথা শুনতে আমার মাইক্রোফোনের অনুমতি প্রয়োজন।",
  remember_err_save_failed: "এটি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।",

  teach_me_pick_prompt: "একটি স্মৃতি বেছে নিন এবং এটি সম্পর্কে আমাকে সব কিছু বলুন।",
  teach_me_no_memories_title: "এখনো কোনো স্মৃতি নেই।",
  teach_me_no_memories_body: "প্রথমে 'মনে করুন'-এ একটি স্মৃতি যোগ করুন, তারপর এখানে ফিরে আসুন।",
  teach_me_one_moment_ellipsis: "এক মুহূর্ত...",
  teach_me_tell_me_more: "আরও বলুন",
  teach_me_smriti_listening: "স্মৃতি শুনছে",
  teach_me_done_for_now: "আপাতত এই পর্যন্ত",
  teach_me_back_home: "বাড়িতে ফিরে যান",
  teach_me_err_load_memories: "আপনার স্মৃতি লোড করা যায়নি।",
  teach_me_err_trouble: "এই মুহূর্তে অসুবিধা হচ্ছে। আবার চেষ্টা করুন।",
  teach_me_err_hear: "ভালোভাবে শোনা যায়নি। আবার চেষ্টা করুন।",

  therapy_title: "আজকের থেরাপি সেশন",
  therapy_description: "চেনা স্মৃতি থেকে তৈরি একটি সহজ জ্ঞানীয় কাজ। সময় নিয়ে স্মৃতি উপভোগ করুন।",
  therapy_loading_patient_language: "রোগীর ভাষা লোড হচ্ছে...",
  therapy_patient_language_label: "রোগীর ভাষা: {language}",
  therapy_creating_session: "6-প্রশ্নের সেশন তৈরি হচ্ছে...",
  therapy_start_session: "6-প্রশ্নের সেশন শুরু করুন",
  therapy_loading_language: "ভাষা লোড হচ্ছে...",
  therapy_question_of: "প্রশ্ন {current} / {total}",
  therapy_completed_count: "{completed} / {total} সম্পন্ন",
  therapy_memory_about: "এই প্রশ্নটি এই স্মৃতি সম্পর্কে:",
  therapy_listen_to_question: "প্রশ্ন শুনুন",
  therapy_speaking: "বলছে...",
  therapy_correct: "✓ সঠিক! খুব ভালো।",
  therapy_try_look_again: "স্মৃতিটি আবার দেখুন। প্রস্তুত হলে এগিয়ে যেতে পারেন।",
  therapy_saving_progress: "অগ্রগতি সংরক্ষণ হচ্ছে...",
  therapy_finish_session: "সেশন শেষ করুন",
  therapy_next_question: "পরবর্তী প্রশ্ন",
  therapy_session_complete: "থেরাপি সেশন সম্পন্ন",
  therapy_completed_all: "আপনি সব 6টি ব্যক্তিগত প্রশ্ন সম্পন্ন করেছেন। খুব ভালো!",
  therapy_questions_completed: "{total}-এর মধ্যে {completed}টি প্রশ্ন সম্পন্ন",
  therapy_starting: "শুরু হচ্ছে...",
  therapy_start_another: "আরেকটি সেশন শুরু করুন",
  therapy_adaptive: "অভিযোজিত",
  therapy_comfort_mode: "সান্ত্বনা মোড",

  game_type_multiple_choice: "স্মৃতি পুনরুদ্ধার",
  game_type_true_false: "স্মৃতি পরীক্ষা",
  game_type_fill_blank: "স্মরণ চ্যালেঞ্জ",
  game_type_attention: "মনোযোগ চ্যালেঞ্জ",
  game_type_routine_recall: "দৈনন্দিন স্মরণ",
  game_type_pattern_recognition: "প্যাটার্ন সনাক্তকরণ",
  game_type_object_recognition: "বস্তু সনাক্তকরণ",
  game_type_emotional_engagement: "ব্যক্তিগত স্মৃতি",
  game_type_memory_match: "স্মৃতি মিল",
  game_type_memory_sequence: "স্মৃতি ক্রম",
  game_type_visual_recall: "বস্তু ও দৃশ্য স্মরণ",
  game_type_attention_focus: "মনোযোগ কেন্দ্রীকরণ",
  game_type_default: "জ্ঞানীয় কাজ",
};

// As noted at the top of this file, the Assamese strings below are a
// first-pass, unreviewed draft -- please have a native or fluent
// Assamese speaker check these before relying on them with a real
// patient. Where a natural Assamese phrasing wasn't confident, the
// nearest correct rendering was used rather than guessing further.
const AS = {
  topbar_play: "খেলা",
  topbar_remember: "মনত ৰাখক",
  topbar_memories: "আপোনাৰ স্মৃতি",
  topbar_comfort: "সান্ত্বনা",
  topbar_teach_me: "মোক শিকাওক",
  go_home_aria: "ঘৰলৈ যাওক",

  greeting_morning: "শুভ ৰাতিপুৱা",
  greeting_afternoon: "শুভ দুপৰ",
  greeting_evening: "শুভ সন্ধিয়া",
  hello_name: "নমস্কাৰ, {name}",
  home_play_title: "খেলা",
  home_play_subtitle: "এটা সহজ স্মৃতি খেল",
  home_remember_title: "মনত ৰাখক",
  home_remember_subtitle: "মোক এটা স্মৃতি কওক",
  home_memories_title: "স্মৃতি",
  home_memories_subtitle: "আপোনাৰ স্মৃতিবোৰ চাওক",
  home_comfort_title: "সান্ত্বনা",
  home_comfort_subtitle: "এটা চিনাকি স্মৃতি",
  home_teach_me_title: "মোক শিকাওক",
  home_teach_me_subtitle: "স্মৃতিক এটা স্মৃতিৰ কথা কওক",

  memories_loading: "আপোনাৰ স্মৃতি ল্বোড হৈ আছে...",
  memories_empty: "এতিয়ালৈকে কোনো স্মৃতি নাই।",
  listen: "শুনক",

  play_getting_ready: "আপোনাৰ খেল সাজু কৰা হৈ আছে...",
  play_try_again: "আকৌ এবাৰ চেষ্টা কৰক",
  play_ready_to_try_again: "পুনৰ চেষ্টাৰ বাবে সাজু",
  play_later: "পিছত",
  play_wonderful_work: "আজি অসাধাৰণ কাম হ'ল",
  play_finished_all: "আজিৰ বাবে আপুনি আপোনাৰ সকলো স্মৃতি শেষ কৰিলে।",
  play_play_again: "আকৌ এবাৰ খেলক",
  play_gentle_correct: "অসাধাৰণ! এইটো এটা বিশেষ স্মৃতি আছিল।",
  play_gentle_try_again: "ঠিক আছে। আহক আন এটা স্মৃতি চাওঁ।",
  play_finish: "শেষ কৰক",
  play_next: "পৰৱৰ্তী",

  comfort_default_message: "আপোনাৰ বাবে এটা চিনাকি স্মৃতি।",
  comfort_show_another: "আন এটা দেখুৱাওক",
  comfort_default_text: "ঠিক আছে। আহক এটা মুহূর্ত সময় লওঁ।",
  comfort_photo_failed: "এই ফটোখন এতিয়া ল'ড কৰিব পৰা নাই।",
  comfort_fallback_text: "আপুনি অতি ভালদৰে কৰি আছে। যিমান সময় লাগে লওক।",

  remember_prompt: "মোক এটা স্মৃতিৰ কথা কওক। যেতিয়া সাজু হয়, কথা কওক।",
  remember_listening: "শুনি আছোঁ",
  remember_record: "ৰেকৰ্ড",
  remember_one_moment: "এক মুহূর্ত",
  remember_stop: "ৰখাওক",
  remember_thank_you: "এইটো শ্বেয়াৰ কৰাৰ বাবে ধন্যবাদ।",
  remember_err_generic: "এটা ভুল হৈছে। আকৌ এবাৰ চেষ্টা কৰক।",
  remember_err_no_audio: "মই একো শুনা নাপালোঁ। আকৌ এবাৰ চেষ্টা কৰক।",
  remember_err_mic_permission: "আপোনাৰ কথা শুনিবলৈ মোক মাইক্ৰ'ফোনৰ অনুমতি লাগে।",
  remember_err_save_failed: "এইটো সংৰক্ষণ কৰিব পৰা নগ'ল। আকৌ এবাৰ চেষ্টা কৰক।",

  teach_me_pick_prompt: "এটা স্মৃতি বাছি লওক, আৰু তাৰ বিষয়ে মোক সকলো কওক।",
  teach_me_no_memories_title: "এতিয়ালৈকে কোনো স্মৃতি নাই।",
  teach_me_no_memories_body: "প্ৰথমে 'মনত ৰাখক'ৰে এটা স্মৃতি যোগ কৰক, তাৰপিছত ইয়ালৈ ঘূৰি আহক।",
  teach_me_one_moment_ellipsis: "এক মুহূর্ত...",
  teach_me_tell_me_more: "আৰু কওক",
  teach_me_smriti_listening: "স্মৃতিয়ে শুনি আছে",
  teach_me_done_for_now: "আপাততে এইটোৱেই যথেষ্ট",
  teach_me_back_home: "ঘৰলৈ ঘূৰি যাওক",
  teach_me_err_load_memories: "আপোনাৰ স্মৃতি ল'ড কৰিব পৰা নগ'ল।",
  teach_me_err_trouble: "এতিয়া অসুবিধা হৈছে। আকৌ এবাৰ চেষ্টা কৰক।",
  teach_me_err_hear: "ভালদৰে শুনা নাপালোঁ। আকৌ এবাৰ চেষ্টা কৰক।",

  therapy_title: "আজিৰ থেৰাপী ছেশ্বন",
  therapy_description: "চিনাকি স্মৃতিৰপৰা সৃষ্টি হোৱা এটা সহজ বৌদ্ধিক কাম। সময় লওক আৰু স্মৃতিটো উপভোগ কৰক।",
  therapy_loading_patient_language: "ৰোগীৰ ভাষা ল'ড হৈ আছে...",
  therapy_patient_language_label: "ৰোগীৰ ভাষা: {language}",
  therapy_creating_session: "6-প্ৰশ্নৰ ছেশ্বন সাজু কৰা হৈ আছে...",
  therapy_start_session: "6-প্ৰশ্নৰ ছেশ্বন আৰম্ভ কৰক",
  therapy_loading_language: "ভাষা ল'ড হৈ আছে...",
  therapy_question_of: "প্ৰশ্ন {current} ৰ {total}",
  therapy_completed_count: "{completed} / {total} সম্পূর্ণ",
  therapy_memory_about: "এই প্ৰশ্নটো এই স্মৃতিৰ বিষয়ে:",
  therapy_listen_to_question: "প্ৰশ্নটো শুনক",
  therapy_speaking: "কৈ আছে...",
  therapy_correct: "✓ শুদ্ধ! বহুত ভাল।",
  therapy_try_look_again: "স্মৃতিটো আকৌ এবাৰ চাওক। সাজু হ'লে আগবাঢ়িব পাৰে।",
  therapy_saving_progress: "অগ্ৰগতি সংৰক্ষণ কৰা হৈ আছে...",
  therapy_finish_session: "ছেশ্বন শেষ কৰক",
  therapy_next_question: "পৰৱৰ্তী প্ৰশ্ন",
  therapy_session_complete: "থেৰাপী ছেশ্বন সম্পূর্ণ",
  therapy_completed_all: "আপুনি সকলো 6টা ব্যক্তিগত প্ৰশ্ন সম্পূর্ণ কৰিলে। বহুত ভাল!",
  therapy_questions_completed: "{total}ৰ ভিতৰত {completed}টা প্ৰশ্ন সম্পূর্ণ",
  therapy_starting: "আৰম্ভ হৈছে...",
  therapy_start_another: "আন এটা ছেশ্বন আৰম্ভ কৰক",
  therapy_adaptive: "অভিযোজিত",
  therapy_comfort_mode: "সান্ত্বনা ম'ড",

  game_type_multiple_choice: "স্মৃতি পুনৰুদ্ধাৰ",
  game_type_true_false: "স্মৃতি পৰীক্ষা",
  game_type_fill_blank: "স্মৰণ প্ৰত্যাহ্বান",
  game_type_attention: "মনোযোগ প্ৰত্যাহ্বান",
  game_type_routine_recall: "দৈনন্দিন স্মৰণ",
  game_type_pattern_recognition: "পেটাৰ্ন চিনাক্তকৰণ",
  game_type_object_recognition: "বস্তু চিনাক্তকৰণ",
  game_type_emotional_engagement: "ব্যক্তিগত স্মৃতি",
  game_type_memory_match: "স্মৃতি মিলাওক",
  game_type_memory_sequence: "স্মৃতি ক্রম",
  game_type_visual_recall: "বস্তু আৰু দৃশ্য স্মৰণ",
  game_type_attention_focus: "মনোযোগ কেন্দ্ৰীকৰণ",
  game_type_default: "বৌদ্ধিক কাম",
};

const UI_TEXT = {
  English: EN,
  Hindi: HI,
  Bengali: BN,
  Assamese: AS,
};

// Looks up `key` in the table for `language`, falling back to English
// for any key a language's table doesn't have (so an incomplete
// translation never renders blank), and substitutes any {placeholder}
// values passed in `vars` (e.g. translate(lang, "hello_name", { name:
// "Asha" })).
export function translate(language, key, vars) {
  const table = UI_TEXT[language] || UI_TEXT.English;
  let text = table[key] ?? UI_TEXT.English[key] ?? key;

  if (vars) {
    Object.keys(vars).forEach((varKey) => {
      text = text.split(`{${varKey}}`).join(String(vars[varKey]));
    });
  }

  return text;
}
