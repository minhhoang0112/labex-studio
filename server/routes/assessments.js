import express from 'express';
import {createAssessmentService} from '../services/courseAssessment.js';

export function createAssessmentRouter({service = createAssessmentService()} = {}) {
  const router = express.Router();
  router.use('/assessments', (_req, res, next) => {res.set('Cache-Control', 'no-store'); next();});
  const handle = operation => (req, res, next) => {
    try { res.json(operation(req)); }
    catch (error) { if (error.status) res.status(error.status).json({error: error.message}); else next(error); }
  };
  router.get('/assessments/:id', handle(req => {
    const summary = service.summary();
    if (summary.id !== req.params.id) throw Object.assign(new Error('Không tìm thấy bài kiểm tra.'), {status: 404});
    return summary;
  }));
  router.post('/assessments/:id/attempts', handle(req => service.start(req.params.id)));
  router.get('/assessments/attempts/:attemptId', handle(req => service.get(req.params.attemptId)));
  router.put('/assessments/attempts/:attemptId/answers', handle(req => service.update(req.params.attemptId, req.body?.answers)));
  router.post('/assessments/attempts/:attemptId/submit', handle(req => service.submit(req.params.attemptId, req.body?.answers)));
  return router;
}
