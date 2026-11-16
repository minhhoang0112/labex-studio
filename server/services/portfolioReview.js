import fs from 'node:fs';

const location = new URL('../data/portfolio-review.json', import.meta.url);
export function readPortfolioReview() {
  return JSON.parse(fs.readFileSync(location, 'utf8'));
}
export function portfolioReviewCourse() {
  const contentFields = new Set(['lessons','questions','incidents','quiz','sources','project_facts','prompt','guided_units','profile','introduction','project_story','journey','study_plan','teaching_sources','project_walkthrough']);
  return Object.fromEntries(Object.entries(readPortfolioReview()).filter(([key]) => !contentFields.has(key)));
}
