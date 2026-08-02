import { Router } from 'express';
import { db } from '../database.js';
import {
  authenticateToken,
  requireRole
} from "../middleware/auth.js";

export const tasksRouter = Router();

// COMPLETED(PART 3): Replace authenticateToken with the required
// authentication and role-authorization middleware.
tasksRouter.get(
    "/",
    authenticateToken,
    (req, res) => {
      res.json({
        userId: req.user.sub,
        tasks: []
      });
    }
);


// COMPLETED(PART 4): Add the required authentication and authorization middleware.
// COMPLETED(PART 4): Query req.params.id with parameterized SQL using db.query(sql, parameters).
// COMPLETED(PART 4): Return 404 when no task exists, allow instructors, and check student ownership.
// COMPLETED(PART 4): Return 403 for another student's task; return the task on success.
// req.params.id, req.user.sub, req.user.role, db.query(), and next(error) are available here.
tasksRouter.get('/:id',
    authenticateToken,
  async (req, res, next) => {
  
    try {
      const result = await db.query(
        `SELECT *
         FROM tasks
         WHERE id = ?`,
        [req.params.id]
      );

      const task = result.rows[0];

      if (!task) {
        return res.status(404).json({
          error: "Not Found"
        });
      }

      if (req.user.role === "instructor") {
        return res.json(task);
      }

      if (task.student_id !== req.user.sub) {
        return res.status(403).json({
          error: "Forbidden"
        });
      }

      return res.json(task);
    } catch (error) {
      next(error);
    }
});


// COMPLETED(PART 3): Replace authenticateToken with authentication
// and instructor-only authorization middleware.
tasksRouter.delete(
    "/:id",
    authenticateToken,
    requireRole("instructor"),
    async (req, res, next) => {
      try {
        const result = await db.run(
            "DELETE FROM tasks WHERE id = ?",
            [req.params.id]
        );

        if (result.changes === 0) {
          return res.status(404).json({ error: "Not Found" });
        }

        return res.status(204).end();
      } catch (error) {
        return next(error);
      }
    }
);
