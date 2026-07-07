// Display copy for each category. The source of truth for which categories
// exist is the `categories` table in Supabase — this file only supplies the
// human-readable description shown on /topics/[slug] when one isn't set
// in the database yet.
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  news: "Daily reporting, civic updates and the stories shaping public conversation.",
  breaking: "Fast-moving developments with clear context and follow-up coverage.",
  lifestyle: "People, habits, homes, relationships and everyday culture.",
  stories: "Narrative pieces with characters, scenes and human detail.",
  articles: "Thoughtful articles that explain what matters and why.",
  features: "Longer reported pieces, profiles and premium magazine storytelling.",
  editorial: "The Insight desk's position on the issues shaping the moment.",
  opinion: "Argument, analysis and perspective from contributors and columnists.",
  spotlight: "People, projects and places deserving sharper attention.",
  business: "Companies, creators, local enterprise, markets and strategy.",
  technology: "Startups, platforms, products and the systems changing work.",
  ai: "Artificial intelligence, tools, policy, prompts and the future of knowledge work.",
  education: "Schools, learning, students, universities and the future of study.",
  health: "Health systems, wellness, public safety and practical care.",
  entertainment: "Film, creators, events, comedy, celebrity and screen culture.",
  sports: "Games, athletes, teams, tournaments and sporting culture.",
  travel: "Places, movement, guides, hospitality and discovery.",
  culture: "Taste, identity, media, style and the signals shaping society.",
  politics: "Power, policy, elections, public office and civic accountability.",
  environment: "Climate, ecology, conservation and the places we share.",
  fashion: "Style, designers, streetwear, beauty and the business of taste.",
  food: "Restaurants, recipes, local kitchens and the culture of eating.",
  music: "Artists, songs, scenes, playlists and the business of sound.",
  videos: "Watchable explainers, interviews, shorts and documentary storytelling.",
  campus: "Student life, campus news, unions, hostels, academics and community voices.",
  history: "Archives, old photographs, institutional memory and the stories communities forget.",
  ijebu: "Local reporting, culture, business and civic life across Ijebu.",
  "ogun-state": "Statewide news, politics, development, people and places.",
  nigeria: "National reporting, business, politics, culture and public life.",
  africa: "Continental ideas, innovation, culture, cities and power.",
  world: "Global affairs, international culture, technology and public life."
};
