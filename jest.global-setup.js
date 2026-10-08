// Runs in the parent process, so workers inherit it (setting TZ inside a test sandbox does
// not reach the real process). Every test runs in a non-UTC zone, so code that confuses
// UTC and local days fails here instead of for users. 2026-10-08 is UTC-7 (PDT) there.
module.exports = async () => {
  process.env.TZ = 'America/Los_Angeles';
};
