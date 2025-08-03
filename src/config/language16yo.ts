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

  // Status labels
  status: {
    completed: "Klart! ✅",
    current: "Gör nu 👉",
    upcoming: "Snart 📅"
  },

  // Common UI elements
  ui: {
    buttons: {
      start: "Kör igång! 🚀",
      continue: "Fortsätt 👉",
      complete: "Jag är klar! ✅",
      skip: "Hoppa över",
      back: "Tillbaka",
      save: "Spara",
      next: "Nästa",
      previous: "Föregående",
      view_results: "Se mina resultat 👀",
      try_again: "Försök igen",
      get_help: "Behöver hjälp? 🤔"
    },
    loading: {
      analyzing: "Stefan kollar dina svar...",
      creating: "Skapar dina uppgifter...",
      saving: "Sparar...",
      loading: "Laddar..."
    },
    success: {
      assessment_done: "Bra jobbat! 🎉",
      tasks_created: "Dina uppgifter är redo! ✨",
      progress_saved: "Framsteg sparat! 💾",
      milestone_reached: "Du nådde ett mål! 🏆"
    },
    errors: {
      something_wrong: "Något gick snett 😅",
      try_again: "Försök igen, det brukar funka",
      contact_help: "Om det inte funkar, fråga oss!"
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