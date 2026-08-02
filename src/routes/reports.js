import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { db } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { reportQueue } from '../reportQueue.js';

export const reportsRouter = Router();


// COMPLETED(PART 5): Create a pending report job with db.createReportJob().
// COMPLETED(PART 5): Send { jobId, studentId } to reportQueue.
// COMPLETED(PART 5): Return 202 with jobId, status, and statusUrl.
// COMPLETED(PART 5): Do not call generateReport() from this request handler.
reportsRouter.post('/', authenticateToken, async (req, res, next) => {
  try {

    const jobId = randomUUID();
    const studentId = req.user.sub;

    await db.createReportJob({
    id: jobId,
    studentId,
    status: "pending"
    });

    await reportQueue.send({
        jobId,
        studentId
    });

    return res.status(202).json({
        jobId,
        status: "pending",
        statusUrl: `/reports/${jobId}`
    });

  } catch (error) {
    return next(error);
  }
});

reportsRouter.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const job = await db.getReportJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not Found' });
    return res.json(job);
  } catch (error) {
    return next(error);
  }
});

void reportQueue;
