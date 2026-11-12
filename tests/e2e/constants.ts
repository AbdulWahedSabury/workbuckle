// Shared by the seed (tsx) and the browser tests (Playwright).
export const E2E = {
  admin: { email: 'admin@e2e.test', password: 'E2E-admin-password-1' },
  employer: { email: 'employer@e2e.test', password: 'E2E-employer-pass-1' },
  chef: 'E2E Head Chef', // 2 positions
  waiter: 'E2E Waiter', // 1 position
  otherClientJob: 'E2E Resort Lifeguard', // belongs to a second client
};
