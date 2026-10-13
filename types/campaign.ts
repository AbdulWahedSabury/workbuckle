/** One entry of a campaign's job list: a published job's title. */
export interface CampaignJobTitle {
  title: string;
}

/**
 * A campaign as the public API returns it. Keys follow the site's content
 * JSON (lang/*.json → pages.home.available_jobs), hence `image_alt` and
 * `jobs-list-title` rather than camelCase.
 */
export interface CampaignPayload {
  id: string;
  title: string;
  /** Storage URL, /public path or external URL; null when none was set. */
  img: string | null;
  intro: string;
  image_alt: string | null;
  /** Published jobs in the campaign, newest first. */
  "jobs-list-title": CampaignJobTitle[];
}
