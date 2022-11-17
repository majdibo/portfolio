export interface Bio {
  firstName: string;
  lastName: string;
  about: string[];
  intro: string[];
  externalLinks: ExternalLink[];
}

export interface ExternalLink {
  link: string;
  name: string;
  logo: string;
}
