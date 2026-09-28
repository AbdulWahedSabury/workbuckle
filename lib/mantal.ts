const BASE_URL =
  "https://api.manatal.com/open/v3/career-page/mavromatis-employment-bureau/jobs/";

export interface Job {
  id: number;
  position_name: string;
  city?: string;
  country?: string;
  description?: string;
  contract_type?: string;
  remote?: boolean;
}

interface JobsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}

export async function getAllJobs(): Promise<Job[]> {
  let page = 1;
  let jobs: Job[] = [];

  while (true) {
    const response = await fetch(
      `${BASE_URL}?page=${page}&page_size=100`,
      {
        next: {
          revalidate: 300, // refresh every 5 minutes
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.status}`);
    }

    const data: JobsResponse = await response.json();

    jobs.push(...data.results);

    if (!data.next) {
      break;
    }

    page++;
  }

  return jobs;
}export async function getJobById(id: string) {
  // Strip trailing slashes or format directly without extra slash:
  const res = await fetch(`${BASE_URL}${id}/`, {
    next: { revalidate: 300 }, // Optional: include revalidation like getAllJobs
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch job details for ID: ${id}`);
  }
  return res.json();
}