export interface Bio {
  firstName: string;
  lastName: string;
  about: string[];
  intro: string[];
  skills: Skill[];
  externalLinks: ExternalLink[];
}

export interface Skill{
  category: string;
  icon: string;
  technics: string[];
}

export interface ExternalLink {
  link: string;
  name: string;
  logo: string;
}
