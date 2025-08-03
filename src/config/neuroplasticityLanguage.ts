/**
 * NEUROPLASTICITET KOMMUNIKATION FÖR 16-ÅRINGAR
 * 
 * Behavioral Scientist: Evidensbaserad kommunikation utan skrämma bort
 * UX Designer: 16-årings-vänliga förklaringar som behåller vetenskaplig grund
 * Product Manager: Bygg trovärdighet genom förenkling, inte dumma ner
 * 
 * WORLD-CLASS EXECUTION: Vetenskaplig grund + ungdomlig kommunikation
 */

// HUVUDSTRATEGI: Förklara VARFÖR det fungerar utan att använda svåra ord

export const NEUROPLASTICITY_TRANSLATIONS = {
  // ISTÄLLET FÖR "neuroplastisk" - använd dessa:
  original: "neuroplastisk",
  alternatives: {
    primary: "hjärnvänlig",        // Enkel, positiv, förstås direkt
    secondary: "smarta hjärnan",   // Mer personlig, snäll ton
    scientific: "vetensbaserad"    // När man vill vara seriös
  },

  // FÖRKLARINGAR som bygger trovärdighet:
  explanations: {
    simple: "Din hjärna blir starkare när du tränar den - precis som en muskel! 🧠💪",
    detailed: "Forskare har upptäckt att hjärnan skapar nya kopplingar när vi övar på saker. Det kallas neuroplasticitet, men vi kallar det 'hjärnvänlig träning'",
    credibility: "Baserat på 30+ års hjärnforskning från Stanford, Harvard och MIT"
  },

  // PRAKTISKA EXEMPEL för olika sammanhang:
  contextualReplacements: {
    tasks: {
      old: "Neuroplastiska uppgifter",
      new: "Hjärnvänliga uppgifter som faktiskt fungerar"
    },
    progress: {
      old: "Neuroplastisk progress", 
      new: "Så här växer din hjärna"
    },
    principles: {
      old: "Neuroplastisk princip",
      new: "Vetensbaserad metod"
    },
    journey: {
      old: "Neuroplastiska utvecklingsresa",
      new: "Din smarta utvecklingsresa"
    },
    generator: {
      old: "Neuroplastisk Uppgiftsgenerator",
      new: "Smarta Uppgifts-AI:n (baserat på hjärnforskning)"
    }
  }
} as const;

// TOOLTIP-TEXTER för att förklara vetenskapen enkelt:
export const NEUROPLASTICITY_TOOLTIPS = {
  // Kort förklaring
  simple: "Din hjärna blir starkare när du tränar den - precis som en muskel! 🧠💪",
  
  // Medellång med trovärdighet  
  detailed: "Forskare har visat att hjärnan skapar nya kopplingar när vi övar. Det kallas neuroplasticitet - vi kallar det 'hjärnvänlig träning'",
  
  // Lång med full förklaring
  complete: "Neuroplasticitet betyder att din hjärna kan förändras och blir starkare genom träning. Forskare från Stanford och Harvard har visat att specifika övningar hjälper hjärnan skapa nya kopplingar. Vi använder denna forskning för att designa uppgifter som verkligen fungerar! 🧬✨",

  // För specifika sammanhang:
  taskContext: "Dessa uppgifter är designade enligt hjärnforskning för att hjälpa dig lära och växa på riktigt. Små steg → stora förändringar! 🚀",
  
  progressContext: "Vi mäter hur din hjärna utvecklas genom små, konkreta framsteg baserat på vetenskaplig forskning 📊🧠"
} as const;

// IMPLEMENTERING: Gradvis övergång med tooltips
export const IMPLEMENTATION_STRATEGY = {
  phase1: "Behåll 'neuroplastisk' men lägg till tooltips som förklarar",
  phase2: "Börja använda 'hjärnvänlig' på nya ställen", 
  phase3: "Gradvis ersätt gamla instanser med bättre alternativ",
  
  // När ska vi använda vilken variant?
  usage: {
    userFacing: "hjärnvänlig", // I UI för användare
    scientific: "neuroplastisk", // I admin/coach-interfaces
    tooltips: "förklarande text", // Alltid förklara vetenskapen
    marketing: "vetensbaserad" // För trovärdighet
  }
} as const;