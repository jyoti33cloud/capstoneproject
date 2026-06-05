import { createContext, useContext, useEffect, useState } from 'react';

const LangContext = createContext(null);

const dict = {
  en: {
    // common
    appName: 'Asha',
    back: 'Back',
    confirm: 'Confirm',
    cancel: 'Cancel',
    submit: 'Submit',
    loading: 'Loading...',
    error: 'Something went wrong',

    // bottom nav
    nav_home: 'Home',
    nav_learn: 'Learn',
    nav_community: 'Community',
    nav_profile: 'Profile',

    // auth
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    name: 'Your Name',
    city: 'City',
    no_account: "Don't have an account?",
    has_account: 'Already have an account?',

    // home
    greeting: 'Namaste, {name}',
    home_subtitle: 'Your sanctuary of clarity and support for the journey ahead.',
    tile_learn: 'Learn',
    tile_community: 'Community',
    tile_findhelp: 'Find Help',
    tile_book: 'Book Appointment',
    tile_routine: 'Daily Routine',
    tile_aac: 'AAC Tool',
    tile_disability: 'Disability ID',

    // learn
    learn_title: 'Learning Centre',
    learn_subtitle: 'Simple guides for every day.',
    learn_understanding: 'Understanding Autism',
    learn_communication: 'Communication Tips',
    learn_behavior: 'Behavior Support',
    learn_nutrition: 'Nutrition',
    effective_comm: 'Effective Communication',
    tip1: 'Use Simple Sentences',
    tip2: 'Use Visual Aids / Pictures',
    tip3: 'Wait for a Response (10 Secs)',

    // Learning content - Understanding Autism
    learn_understanding_guidance: 'Autism Spectrum Disorder (ASD) is a lifelong developmental condition that affects how a person communicates and interacts with others.',
    learn_understanding_points: 'Key Points|Every child with autism is unique|Autism affects communication, social interaction, and behavior|Early support makes a significant difference',

    // Learning content - Communication Tips
    learn_communication_guidance: 'Effective communication is the foundation of understanding. Here are practical strategies to improve communication with your child.',
    learn_communication_points: 'Use simple, clear language|Give extra time to process|Use visual supports like pictures or signs|Be patient and consistent|Celebrate small progress',

    // Learning content - Behavior Support
    learn_behavior_guidance: 'Behavior challenges are often a form of communication. Understanding the root cause helps you respond appropriately.',
    learn_behavior_points: 'Identify triggers|Create predictable routines|Use positive reinforcement|Stay calm and patient|Seek professional help when needed',

    // Learning content - Nutrition
    learn_nutrition_guidance: 'Proper nutrition supports overall development and well-being. Some children with autism have specific dietary preferences or sensitivities.',
    learn_nutrition_points: 'Maintain balanced diet|Be mindful of food sensitivities|Make mealtimes calm and structured|Offer variety gradually|Consult a nutritionist if needed',

    // community
    community_title: 'Community Support',
    community_subtitle: 'You are not alone. Connect with other parents.',
    ask_question: 'Ask Question',
    all_posts: 'All Posts',
    cat_behavior: 'Behavior',
    cat_schooling: 'Schooling',
    cat_therapy: 'Therapy',
    reply: 'Reply',
    new_post_title: 'Title',
    new_post_body: 'Share your story or question...',
    post_submit: 'Post',

    // find help
    findhelp_title: 'Find Help',
    search_placeholder: 'Search doctors or centers...',
    all_resources: 'All Resources',
    therapy_centers: 'Therapy Centers',
    specialists: 'Specialists',
    book: 'Book',

    // appointment
    book_session: 'Book a Session',
    book_session_sub: 'Find the right support for your journey.',
    select_specialist: 'Select Specialist',
    pick_date: 'Pick a Date',
    select_time: 'Select Time',
    reminder_note: 'A reminder will be sent 1 hour before the session.',
    booked: 'Appointment booked!',

    // routine
    routine_title: 'Daily Routine',
    routine_subtitle: 'Daily plan',
    progress_today: 'Progress Today',
    tasks: 'Tasks',
    task_brushing: 'Brushing Teeth',
    task_breakfast: 'Breakfast',
    task_school: 'School',
    task_play: 'Play Time',
    task_sleep: 'Sleep',

    // aac
    aac_title: 'Communication Board',
    aac_subtitle: 'Tap an icon below to express a need.',
    aac_eat: 'Eat',
    aac_drink: 'Drink',
    aac_play: 'Play',
    aac_sleep: 'Sleep',
    aac_help_title: 'Need Help?',
    aac_help_body: 'Long press any card to hear the sound or see more options.',

    // profile
    profile_title: 'Profile',
    my_appointments: 'My Appointments',
    no_appointments: 'No appointments yet.',
    upload_picture: 'Upload Picture',
    uploading: 'Uploading...',
  },

  ne: {
    appName: 'आशा',
    back: 'पछाडि',
    confirm: 'पक्का गर्नुहोस्',
    cancel: 'रद्द गर्नुहोस्',
    submit: 'पठाउनुहोस्',
    loading: 'लोड हुँदै...',
    error: 'केहि गल्ती भयो',

    nav_home: 'गृह',
    nav_learn: 'सिक्नुहोस्',
    nav_community: 'समुदाय',
    nav_profile: 'प्रोफाइल',

    login: 'लगइन',
    register: 'दर्ता',
    logout: 'लगआउट',
    email: 'इमेल',
    password: 'पासवर्ड',
    name: 'तपाईंको नाम',
    city: 'सहर',
    no_account: 'खाता छैन?',
    has_account: 'पहिले नै खाता छ?',

    greeting: 'नमस्ते, {name}',
    home_subtitle: 'तपाईंको यात्राको लागि स्पष्टता र सहयोगको स्थान।',
    tile_learn: 'सिक्नुहोस्',
    tile_community: 'समुदाय',
    tile_findhelp: 'मद्दत खोज्नुहोस्',
    tile_book: 'भेटघाट बुक गर्नुहोस्',
    tile_routine: 'दैनिक तालिका',
    tile_aac: 'कुराकानी साधन',
    tile_disability: 'अक्षमता परिचयपत्र',

    learn_title: 'सिकाई केन्द्र',
    learn_subtitle: 'दैनिक जीवनका लागि सरल मार्गदर्शन।',
    learn_understanding: 'अटिजम बुझ्दै',
    learn_communication: 'सञ्चारका सुझावहरू',
    learn_behavior: 'व्यवहार सहयोग',
    learn_nutrition: 'पोषण',
    effective_comm: 'प्रभावकारी सञ्चार',
    tip1: 'साधारण वाक्यहरू प्रयोग गर्नुहोस्',
    tip2: 'तस्विरहरू र दृश्य सामग्री प्रयोग गर्नुहोस्',
    tip3: 'प्रतिक्रियाको लागि १० सेकेन्ड पर्खनुहोस्',

    // Learning content - Understanding Autism
    learn_understanding_guidance: 'अटिजम स्पेक्ट्रम विकार (ASD) एक दीर्घकालीन विकासात्मक अवस्था हो जसले व्यक्तिको कुराकानी र अन्य मानिसहरूसँग अन्तरक्रिया गर्ने तरिकालाई असर गर्छ।',
    learn_understanding_points: 'मुख्य बिन्दुहरु|अटिजम भएको प्रत्येक बच्चा अनौठो हुन्छ|अटिजमले सञ्चार, सामाजिक अन्तरक्रिया र व्यवहारलाई असर गर्छ|प्रारम्भिक सहायता महत्त्वपूर्ण फर्क पार्छ',

    // Learning content - Communication Tips
    learn_communication_guidance: 'प्रभावकारी सञ्चार बोझ्नमान्य भेदको आधार हो। यहाँ तपाईंको बच्चासँग सञ्चार सुधार गर्न व्यावहारिक रणनीतिहरू छन्।',
    learn_communication_points: 'सरल, स्पष्ट भाषा प्रयोग गर्नुहोस्|प्रक्रिया गर्नको लागि अतिरिक्त समय दिनुहोस्|तस्विर वा चिन्हको जस्तो दृश्य सहायता प्रयोग गर्नुहोस्|धैर्यवान र सुसंगत हुनुहोस्|साना प्रगतिको जश्न मनाउनुहोस्',

    // Learning content - Behavior Support
    learn_behavior_guidance: 'व्यवहार चुनौतीहरू प्राय: कुराकानीको रूप हुन्छन्। मूल कारण बोझ्नुले तपाईंलाई उपयुक्त रूपमा जवाफ दिन मद्दत गर्छ।',
    learn_behavior_points: 'ट्रिगरहरु पहिचान गर्नुहोस्|पूर्वानुमानीय दिनचर्या बनाउनुहोस्|सकारात्मक सुदृढीकरण प्रयोग गर्नुहोस्|शान्त र धैर्यवान रहनुहोस्|आवश्यक भएमा पेशेवार मद्दत लिनुहोस्',

    // Learning content - Nutrition
    learn_nutrition_guidance: 'सही पोषण समग्र विकास र कल्याणलाई समर्थन गर्छ। अटिजम भएका केही बच्चाको विशेष आहार प्राथमिकता वा संवेदनशीलता हुन सक्छ।',
    learn_nutrition_points: 'संतुलित आहार बनाए राख्नुहोस्|खाना संवेदनशीलतालाई ध्यानमा राख्नुहोस्|खाना समय शान्त र संरचित गर्नुहोस्|क्रमशः विविधता प्रदान गर्नुहोस्|आवश्यक भएमा पोषण विज्ञानीको सल्लाह लिनुहोस्',

    community_title: 'सामुदायिक सहयोग',
    community_subtitle: 'तपाईं एक्लो हुनुहुन्न। अन्य अभिभावकहरूसँग जोडिनुहोस्।',
    ask_question: 'प्रश्न सोध्नुहोस्',
    all_posts: 'सबै पोस्ट',
    cat_behavior: 'व्यवहार',
    cat_schooling: 'विद्यालय',
    cat_therapy: 'थेरापी',
    reply: 'जवाफ',
    new_post_title: 'शीर्षक',
    new_post_body: 'आफ्नो कथा वा प्रश्न लेख्नुहोस्...',
    post_submit: 'पोस्ट गर्नुहोस्',

    findhelp_title: 'मद्दत खोज्नुहोस्',
    search_placeholder: 'डाक्टर वा केन्द्र खोज्नुहोस्...',
    all_resources: 'सबै स्रोतहरू',
    therapy_centers: 'थेरापी केन्द्रहरू',
    specialists: 'विशेषज्ञहरू',
    book: 'बुक गर्नुहोस्',

    book_session: 'भेटघाट बुक गर्नुहोस्',
    book_session_sub: 'तपाईंको यात्राको लागि सही सहयोग खोज्नुहोस्।',
    select_specialist: 'विशेषज्ञ छान्नुहोस्',
    pick_date: 'मिति छान्नुहोस्',
    select_time: 'समय छान्नुहोस्',
    reminder_note: 'सेसन सुरु हुनु १ घण्टा अघि सम्झना पठाइनेछ।',
    booked: 'भेटघाट बुक भयो!',

    routine_title: 'दैनिक तालिका',
    routine_subtitle: 'दैनिकी योजना',
    progress_today: 'आजको प्रगति',
    tasks: 'काम',
    task_brushing: 'दाँत माझ्ने',
    task_breakfast: 'बिहानको खाजा',
    task_school: 'विद्यालय',
    task_play: 'खेल्ने समय',
    task_sleep: 'सुत्ने',

    aac_title: 'सञ्चार बोर्ड',
    aac_subtitle: 'आवश्यकता व्यक्त गर्न तलको आइकन थिच्नुहोस्।',
    aac_eat: 'खानु',
    aac_drink: 'पिउनु',
    aac_play: 'खेल्नु',
    aac_sleep: 'सुत्नु',
    aac_help_title: 'मद्दत चाहिन्छ?',
    aac_help_body: 'आवाज सुन्न वा थप विकल्प हेर्न कुनै कार्डलाई लामो थिच्नुहोस्।',

    profile_title: 'प्रोफाइल',
    my_appointments: 'मेरा भेटघाटहरू',
    no_appointments: 'कुनै भेटघाट छैन।',
    upload_picture: 'तस्विर अपलोड गर्नुहोस्',
    uploading: 'अपलोड हुँदै...',
  },
};

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('asha_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('asha_lang', lang);
  }, [lang]);

  const t = (key, vars = {}) => {
    let s = dict[lang]?.[key] ?? dict.en[key] ?? key;
    Object.keys(vars).forEach((k) => {
      s = s.replace(`{${k}}`, vars[k]);
    });
    return s;
  };

  // Get the OTHER language's text (for showing both at once)
  const tBoth = (key, vars = {}) => ({
    en: dict.en[key] ?? key,
    ne: dict.ne[key] ?? key,
    primary: t(key, vars),
    secondary: lang === 'en' ? (dict.ne[key] ?? '') : (dict.en[key] ?? ''),
  });

  const toggle = () => setLang((l) => (l === 'en' ? 'ne' : 'en'));

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, t, tBoth }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
