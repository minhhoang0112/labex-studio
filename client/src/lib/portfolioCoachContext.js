export const PORTFOLIO_ID='portfolio-infrastructure-review';
export function portfolioFocus(progress={},mode) {
  return {mode:mode || (progress.stage==='intro'?'intro':progress.stage==='practice'?'interview':'explain'),
    stage:progress.stage,chapter_id:progress.projectStudy?.chapter_id||'P01',unit_id:progress.unit||'U01'};
}
export function savedPortfolioContext(id) {
  if(id!==PORTFOLIO_ID)return {};
  let progress={};try{progress=JSON.parse(localStorage.getItem('labex.portfolio-review.v2')||'{}')||{};}catch{}
  return {portfolioFocus:portfolioFocus(progress)};
}
