/**
 * 🎯 CENTRALIZED 16YO-FRIENDLY LANGUAGE CONFIG
 * 
 * SCRUM Team Guidelines:
 * - Product Manager: Use action words, immediate benefits
 * - UX Designer: Max 8 words per button, clear value prop
 * - Behavioral Expert: Motivating, not overwhelming
 * - QA: Consistent terminology across all components
 */

export const LANGUAGE_16YO = {
  // Journey Steps - Main progression
  journey: {
    start: "Kom igång med din utveckling",
    progress: "Du gör framsteg!",
    complete: "Grattis! Du har slutfört denna del",
    next_step: "Nästa steg i din resa",
    pillar_principle: "Fokusera på ett område i taget för bästa resultat",
    welcome_assessment: {
      title: "Kolla läget! 📊",
      description: "Svara på enkla frågor om ditt liv så förstår vi vad du behöver",
      estimatedTime: "15 min",
      principle: "Börja där du är idag"
    },
    ai_analysis: {
      title: "Stefan kollar dina svar 🤖",
      description: "AI:n går igenom allt och hittar vad du är bra på och vad du kan bli bättre på",
      estimatedTime: "2 min",
      principle: "AI hjälper dig förstå dig själv"
    },
    pillar_selection: {
      title: "Välj vad du vill bli bättre på 🎯",
      description: "Välj de områden du vill satsa på först - du bestämmer helt själv",
      estimatedTime: "5 min",
      principle: "Du styr din egen utveckling"
    },
    task_creation: {
      title: "Få konkreta saker att göra ✅",
      description: "AI:n skapar enkla uppgifter som faktiskt hjälper dig framåt",
      estimatedTime: "3 min",
      principle: "Små steg leder till stora förändringar"
    },
    habit_formation: {
      title: "Börja träna din hjärna 🧠💪",
      description: "21 dagar av smarta övningar som bygger nya bra vanor",
      estimatedTime: "10 min/dag",
      principle: "Repetition gör att hjärnan lär sig"
    }
  },

  // Actionables & Scheduling - New section
  actionables: {
    title: "Dina saker att göra 📝",
    empty_state: "Inga saker att göra än! 🎉",
    add_to_calendar: "Lägg in i kalendern 📅",
    schedule_smart: "Stefan planerar åt dig ⚡",
    time_picker: "Välj när du vill göra det ⏰",
    duration: "Hur lång tid tar det?",
    priority: {
      low: "Chill 😌",
      medium: "Viktigt 👍", 
      high: "Viktigt nu! 🔥",
      critical: "AKUT! 🚨"
    },
    status: {
      pending: "Ska göras 📝",
      in_progress: "Gör nu 🏃‍♂️",
      completed: "Klart! ✅",
      paused: "Pausad 😴"
    },
    schedule_options: {
      now: "Nu direkt 🚀",
      today: "Senare idag 📅",
      tomorrow: "Imorgon 🌅",
      this_week: "Denna vecka 📆",
      custom: "Jag väljer själv 🎯"
    }
  },

  // Calendar integration
  calendar: {
    title: "Din planering 📅",
    today: "Idag",
    tomorrow: "Imorgon", 
    this_week: "Denna vecka",
    month_view: "Månad",
    week_view: "Vecka",
    day_view: "Dag",
    add_event: "Lägg till något 📝",
    move_task: "Flytta till annan dag",
    time_blocked: "Upptaget 🚫",
    free_time: "Ledig tid ✨"
  },

  // Status labels
  status: {
    ready: "Redo att börja",
    not_started: "Inte påbörjat",
    in_progress: "Pågående",
    completed: "Klart! ✅",
    expired: "Gått ut",
    pending: "Väntar",
    current: "Gör nu 👉",
    upcoming: "Snart 📅"
  },

  // Common UI elements
  ui: {
    buttons: {
      start: "Börja",
      continue: "Fortsätt", 
      complete: "Slutför",
      save: "Spara",
      cancel: "Avbryt",
      next: "Nästa",
      previous: "Föregående",
      submit: "Skicka",
      restart: "Börja om",
      skip: "Hoppa över",
      back: "Tillbaka",
      view_results: "Se mina resultat 👀",
      try_again: "Försök igen",
      get_help: "Behöver hjälp? 🤔",
      schedule: "Planera in 📅",
      schedule_now: "Gör nu 🚀",
      schedule_later: "Gör senare ⏰",
      move_task: "Flytta 📦"
    },
    start_now: "Börja nu - det går snabbt! 🚀",
    continue: "Fortsätt testet 🎯",
    restart: "Börja om från början",
    take_again: "Gör om bedömningen",
    loading: {
      analyzing: "Stefan kollar dina svar...",
      creating: "Skapar dina uppgifter...",
      saving: "Sparar...",
      loading: "Laddar...",
      scheduling: "Planerar in i kalendern..."
    },
    success: {
      assessment_done: "Bra jobbat! 🎉",
      tasks_created: "Dina uppgifter är redo! ✨",
      progress_saved: "Framsteg sparat! 💾",
      milestone_reached: "Du nådde ett mål! 🏆",
      scheduled: "Inplanerat! 📅",
      moved: "Flyttat! 📦"
    },
    errors: {
      something_wrong: "Något gick snett 😅",
      try_again: "Försök igen, det brukar funka",
      contact_help: "Om det inte funkar, fråga oss!",
      scheduling_failed: "Kunde inte planera in 😕"
    }
  },

  // Help and explanations
  help: {
    why_assessment: "Vi behöver veta lite om dig för att kunna hjälpa dig bäst möjligt",
    why_ai_analysis: "Stefan är smart och kan hitta mönster i dina svar som hjälper dig",
    why_pillars: "Genom att fokusera på bara några områden blir du bättre snabbare",
    why_tasks: "Små konkreta saker är lättare att faktiskt göra än stora mål",
    why_21_days: "Hjärnan behöver cirka 3 veckor för att lära sig nya bra vanor"
  },

  // Motivation and encouragement
  motivation: {
    keep_going: "Du gör bra ifrån dig! 💪",
    almost_done: "Nästan klar nu! 🏁",
    good_choice: "Smart val! 🧠",
    progress_made: "Du har kommit längre än du tror! 📈",
    new_level: "Du har låst upp en ny nivå! 🆙"
  },

  // Time indicators (16yo-friendly)
  time: {
    quick: "Snabbt",
    medium: "Tar lite tid",
    longer: "Ta dig tid",
    daily: "Varje dag",
    weekly: "En gång i veckan"
  }
} as const;

// Helper functions for consistent language use
export const get16YoText = (category: keyof typeof LANGUAGE_16YO, key: string) => {
  // Type-safe getter for 16yo language
  return (LANGUAGE_16YO[category] as any)?.[key] || key;
};

export const formatTimeFor16YO = (minutes: number): string => {
  if (minutes <= 5) return "⚡ Supersnabbt";
  if (minutes <= 15) return "🏃 Snabbt";
  if (minutes <= 30) return "⏰ Tar lite tid";
  return "📚 Ta dig tid";
};