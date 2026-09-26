export interface FooterColumn {
  title: string;
  label: string,
  href: string;
  links: NavLink[];
}

export interface NavLink {
  label: string;
  href: string;
}