import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const dbPath = path.join(__dirname, '../server/database.sqlite');
const db = new sqlite3.Database(dbPath);

// API для отмены задания
router.post('/cancel', (req, res) => {
  if (!req.session.teamId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const teamId = req.session.teamId;

  db.get('SELECT free_cancels, current_task_id FROM teams WHERE id = ?', [teamId], (err, team) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!team.current_task_id) {
      return res.status(400).json({ error: 'Нет активного задания для отмены' });
    }

    let penalty = 0;
    
    if (team.free_cancels > 0) {
      // Бесплатная отмена
      db.run(
        'UPDATE teams SET free_cancels = free_cancels - 1, current_task_id = NULL WHERE id = ?',
        [teamId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ success: true, freeCancelsLeft: team.free_cancels - 1, penalty: 0 });
        }
      );
    } else {
      // Штрафная отмена
      db.get('SELECT reward FROM tasks WHERE id = ?', [team.current_task_id], (err, task) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        penalty = Math.floor(task.reward * 0.2);
        
        db.run(
          'UPDATE teams SET balance = balance - ?, current_task_id = NULL WHERE id = ?',
          [penalty, teamId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, freeCancelsLeft: 0, penalty });
          }
        );
      });
    }
  });
});

// API для завершения задания
router.post('/complete', (req, res) => {
  if (!req.session.teamId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const teamId = req.session.teamId;

  db.get('SELECT current_task_id FROM teams WHERE id = ?', [teamId], (err, team) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!team.current_task_id) {
      return res.status(400).json({ error: 'Нет активного задания' });
    }

    // Создаем запись о выполнении задания
    db.run(
      'INSERT INTO completed_tasks (team_id, task_id, status) VALUES (?, ?, ?)',
      [teamId, team.current_task_id, 'pending'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Сбрасываем текущее задание
        db.run(
          'UPDATE teams SET current_task_id = NULL WHERE id = ?',
          [teamId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({ success: true, message: 'Задание отправлено на модерацию' });
          }
        );
      }
    );
  });
});

// API для получения заданий на модерации
router.get('/moderation', (req, res) => {
  db.all(
    `SELECT ct.*, t.name as team_name, task.title as task_title, task.reward as task_reward
     FROM completed_tasks ct
     JOIN teams t ON ct.team_id = t.id
     JOIN tasks task ON ct.task_id = task.id
     WHERE ct.status = 'pending'`,
    (err, tasks) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(tasks);
    }
  );
});

// API для модерации задания
router.post('/moderate', (req, res) => {
  const { taskId, status } = req.body;

  db.get('SELECT * FROM completed_tasks WHERE id = ?', [taskId], (err, completedTask) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (status === 'approved') {
      // Начисляем награду
      db.get('SELECT reward FROM tasks WHERE id = ?', [completedTask.task_id], (err, task) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.run(
          'UPDATE teams SET balance = balance + ?, completed_tasks = completed_tasks + 1 WHERE id = ?',
          [task.reward, completedTask.team_id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            // Обновляем статус задания
            db.run(
              'UPDATE completed_tasks SET status = ? WHERE id = ?',
              ['approved', taskId],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                res.json({ success: true });
              }
            );
          }
        );
      });
    } else if (status === 'rejected') {
      // Просто отмечаем как отклоненное
      db.run(
        'UPDATE completed_tasks SET status = ? WHERE id = ?',
        ['rejected', taskId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ success: true });
        }
      );
    }
  });
});

export default router;