import { db } from '../database.js';
import { generateReport } from '../reportGenerator.js';
import { reportQueue } from '../reportQueue.js';

// COMPLETED(PART 5): Mark this job as "processing" with db.updateReportJob().
// COMPLETED(PART 5): Call generateReport(studentId).
// COMPLETED(PART 5): Mark it "completed" and save the downloadUrl.
// COMPLETED(PART 5): Catch generation errors, mark the job "failed", and do not crash the worker.
reportQueue.process(async (message) => {
  const { jobId, studentId } = message;

  try {
    await db.updateReportJob(jobId, {
      status: "processing"
    });

    const downloadUrl =
      await generateReport(studentId);

    await db.updateReportJob(jobId, {
      status: "completed",
      downloadUrl
    });

  } catch (err) {
    await db.updateReportJob(jobId, {
      status: "failed"
    });
  }
  
  void jobId;
  void studentId;
  void db;
  void generateReport;
});
