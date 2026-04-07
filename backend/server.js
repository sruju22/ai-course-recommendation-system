require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const axios = require("axios");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection Pool (prevents "connection closed" errors on Render)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verify pool connectivity on startup
db.query("SELECT 1", (err) => {
  if (err) {
    console.log("Database connection failed ❌", err);
  } else {
    console.log("Connected to MySQL (pool) ✅");
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});


// 📚 Get Courses
app.get("/courses", (req, res) => {
  const sql = "SELECT * FROM courses";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(result);
  });
});


// (Enroll endpoint removed - we use progress table exclusively)


// 🔐 Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (result.length > 0) {
      res.json(result[0]); // send user
    } else {
      res.status(401).json({ message: "Invalid credentials ❌" });
    }
  });
});


// 📝 Register (FIXED)
app.post("/register", (req, res) => {
  const { username, email, password, role } = req.body;

  const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";

  db.query(sql, [username, email, password, role], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error registering user ❌" });
    }

    res.json({
      success: true,
      message: "User registered successfully ✅",
      user: {
        id: result.insertId,
        username,
        email,
        role
      }
    });
  });
});


// ➕ Add Course (Admin)
app.post("/add-course", (req, res) => {
  const { title, description, category } = req.body;

  const sql = "INSERT INTO courses (title, description, category) VALUES (?, ?, ?)";

  db.query(sql, [title, description, category], (err) => {
    if (err) {
      return res.status(500).json({ message: "Error adding course ❌" });
    }
    res.json({ message: "Course added successfully ✅" });
  });
});

// 📖 Get Lessons for a Course
app.get("/lessons/:courseId", (req, res) => {
  const { courseId } = req.params;
  const sql = "SELECT * FROM lessons WHERE course_id = ? ORDER BY id ASC";
  db.query(sql, [courseId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});


// ❓ Get Quiz for a Course
app.get("/quiz/:courseId", (req, res) => {
  const { courseId } = req.params;
  const sql = "SELECT * FROM quiz WHERE course_id = ? ORDER BY id ASC";
  db.query(sql, [courseId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});


// ✅ Mark Lesson as Complete (UPSERT — no duplicates)
app.post("/progress", (req, res) => {
  const { user_id, course_id, lesson_id } = req.body;
  console.log("✅ MARK COMPLETE → user:", user_id, "course:", course_id, "lesson:", lesson_id);

  const sql = `
    INSERT INTO progress (user_id, course_id, lesson_id, completed)
    VALUES (?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE completed = 1
  `;
  db.query(sql, [user_id, course_id, lesson_id], (err) => {
    if (err) return res.status(500).json(err);
    console.log("✅ Progress saved for lesson", lesson_id);
    res.json({ message: "Progress saved ✅" });
  });
});



// 📊 Get Progress for a User in a Course
app.get("/progress/:userId/:courseId", (req, res) => {
  const { userId, courseId } = req.params;

  // Completed: COUNT(DISTINCT lesson_id) from progress
  const completedSql = `
    SELECT COUNT(DISTINCT lesson_id) as completedLessons
    FROM progress
    WHERE user_id = ? AND course_id = ? AND completed = 1
  `;
  // Total: COUNT(*) from lessons
  const totalSql = "SELECT COUNT(*) as totalLessons FROM lessons WHERE course_id = ?";
  // Also fetch raw progress data for frontend
  const dataSql = "SELECT lesson_id, MAX(completed) as completed FROM progress WHERE user_id = ? AND course_id = ? GROUP BY lesson_id";

  db.query(completedSql, [userId, courseId], (err, compRows) => {
    if (err) return res.status(500).json(err);

    db.query(totalSql, [courseId], (err2, totalRows) => {
      if (err2) return res.status(500).json(err2);

      db.query(dataSql, [userId, courseId], (err3, dataRows) => {
        if (err3) return res.status(500).json(err3);

        const completed = parseInt(compRows[0].completedLessons) || 0;
        const totalLessons = parseInt(totalRows[0].totalLessons) || 0;

        const progress = totalLessons === 0
          ? 0
          : Math.min(Math.round((completed / totalLessons) * 100), 100);

        console.log("📊 Progress → completed:", completed, "total:", totalLessons, "progress:", progress + "%");

        res.json({
          completed,
          totalLessons,
          progress,
          progressData: dataRows
        });
      });
    });
  });
});


// 🏆 Submit Quiz & Save Score
app.post("/quiz/submit", (req, res) => {
  const { userId, courseId, answers } = req.body;
  // answers = [{ questionId, selected }]
  const sql = "SELECT id, answer FROM quiz WHERE course_id = ?";
  db.query(sql, [courseId], (err, questions) => {
    if (err) return res.status(500).json(err);
    let score = 0;
    questions.forEach(q => {
      const submitted = answers.find(a => a.questionId === q.id);
      if (submitted && submitted.selected === q.answer) score++;
    });

    if (userId) {
      const checkSql = "SELECT id FROM quiz_result WHERE user_id = ? AND course_id = ?";
      db.query(checkSql, [userId, courseId], (err2, rows) => {
        if (err2) return res.status(500).json(err2);
        if (rows.length > 0) {
          return res.json({ score, total: questions.length, message: "Already submitted" });
        }
        const saveSql = "INSERT INTO quiz_result (user_id, course_id, score) VALUES (?, ?, ?)";
        db.query(saveSql, [userId, courseId, score], () => {
          res.json({ score, total: questions.length });
        });
      });
    } else {
      res.json({ score, total: questions.length });
    }
  });
});


// 📈 User Dashboard Stats & Continue Learning
app.get("/dashboard-stats/:userId", (req, res) => {
  const { userId } = req.params;
  console.log("📊 DASHBOARD-STATS called for userId:", userId);

  // Completed: COUNT(DISTINCT lesson_id) from progress only
  const completedSql = "SELECT COUNT(DISTINCT lesson_id) as completed_count FROM progress WHERE user_id = ? AND completed = 1";
  // Enrolled: COUNT(DISTINCT course_id) from progress
  const enrolledSql = "SELECT COUNT(DISTINCT course_id) as enrolled_count FROM progress WHERE user_id = ?";
  // Total lessons across enrolled courses
  const totalEnrolledLessonsSql = "SELECT COUNT(*) as total_lessons FROM lessons WHERE course_id IN (SELECT DISTINCT course_id FROM progress WHERE user_id = ?)";

  db.query(completedSql, [userId], (err, res1) => {
    if (err) return res.status(500).json(err);
    db.query(enrolledSql, [userId], (err, res2) => {
      if (err) return res.status(500).json(err);
      db.query(totalEnrolledLessonsSql, [userId], (err, res3) => {
        if (err) return res.status(500).json(err);

        const completed = parseInt(res1[0].completed_count) || 0;
        const enrolled = parseInt(res2[0].enrolled_count) || 0;
        const totalLessons = parseInt(res3[0].total_lessons) || 0;

        const progressPercent = totalLessons === 0
          ? 0
          : Math.min((completed / totalLessons) * 100, 100);

        let avgProgress = Math.round(progressPercent);

        console.log("DISTINCT completed:", completed);
        console.log("Total lessons:", totalLessons);
        console.log("📊 Stats → completed:", completed, "enrolled:", enrolled, "totalLessons:", totalLessons, "avgProgress:", avgProgress + "%");

        const lastCourseSql = "SELECT course_id FROM progress WHERE user_id = ? ORDER BY id DESC LIMIT 1";
        db.query(lastCourseSql, [userId], (err, res4) => {
          if (err) return res.status(500).json(err);
          const lastCourseId = res4.length > 0 ? res4[0].course_id : null;

          const response = {
            totalCompleted: completed,
            totalEnrolled: enrolled,
            avgProgress: avgProgress,
            lastCourseId: lastCourseId
          };
          console.log("📊 DASHBOARD-STATS response:", JSON.stringify(response));
          res.json(response);
        });
      });
    });
  });
});


// 👥 Get All Users (exclude admin)
app.get("/users", (req, res) => {
  db.query("SELECT id, username AS name, email FROM users WHERE role != 'admin' OR role IS NULL", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// 👤 Get User Details (enrolled courses + progress)
app.get("/user/:id/details", (req, res) => {
  const userId = req.params.id;
  console.log("USER DETAILS - userId:", userId);

  db.query("SELECT id, username AS name, email FROM users WHERE id = ?", [userId], (err, userRows) => {
    if (err || !userRows || userRows.length === 0) return res.status(404).json({ error: "User not found" });

    const user = userRows[0];

    // Check progress table for enrolled courses
    db.query("SELECT DISTINCT course_id FROM progress WHERE user_id = ?", [userId], (errP, progressRows) => {
      console.log("PROGRESS for user", userId, ":", progressRows ? progressRows.length : 0, "rows");

      const courseIds = progressRows ? progressRows.map(r => r.course_id) : [];
      console.log("MERGED course IDs:", courseIds);

      if (courseIds.length === 0) {
        return res.json({ user: { id: user.id, name: user.name }, courses: [] });
      }

      // Get course details with progress % (no JOIN — query progress directly)
      db.query(
        `SELECT 
            c.id AS course_id,
            c.title,
            c.category,
            COALESCE(
              LEAST(ROUND(
                (SELECT COUNT(DISTINCT p.lesson_id) FROM progress p WHERE p.user_id = ? AND p.course_id = c.id AND p.completed = 1) /
                NULLIF((SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id), 0) * 100
              ), 100), 0
            ) AS progress
          FROM courses c
          WHERE c.id IN (?)`,
        [userId, courseIds],
        (err2, courseRows) => {
          if (err2) {
            console.error("COURSE QUERY ERROR:", err2);
            return res.status(500).json(err2);
          }
          res.json({ user: { id: user.id, name: user.name }, courses: courseRows || [] });
        }
      );
    });
  });
});


// 📋 Recommendations (exclude enrolled courses)
app.get("/recommendations/:userId", (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT * FROM courses
    WHERE id NOT IN (
      SELECT DISTINCT course_id FROM progress WHERE user_id = ?
    )
    LIMIT 6
  `;
  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});


// 🤖 AI-Powered Course Recommendations
app.get("/ai-recommend/:userId", (req, res) => {
  const { userId } = req.params;

  // Step 1: Get ALL courses
  db.query("SELECT id, title, description, category FROM courses", (err, allCourses) => {
    if (err || !allCourses || allCourses.length === 0) {
      return res.json([]);
    }

    console.log("USER ID RECEIVED:", userId);

    // Step 2: Get enrolled course IDs from PROGRESS table
    db.query(
      "SELECT DISTINCT course_id FROM progress WHERE user_id = ?",
      [userId],
      (err, progressRows) => {
        const enrolledIds = (!err && progressRows) ? progressRows.map(r => r.course_id) : [];
        console.log("ENROLLED IDS:", enrolledIds);

        // Step 3: Get categories from enrolled courses
        let categories = [];
        if (enrolledIds.length > 0) {
          const enrolledCourses = allCourses.filter(c => enrolledIds.includes(c.id));
          categories = [...new Set(enrolledCourses.map(c => c.category).filter(Boolean))];
        }
        if (categories.length === 0) {
          categories = ["Programming"];
        }
        console.log("CATEGORIES:", categories);

        // Step 4: Get quiz score
        db.query(
          "SELECT AVG(score) as avg_score FROM quiz_result WHERE user_id = ?",
          [userId],
          (err2, scoreRows) => {
            const score = (!err2 && scoreRows && scoreRows[0]?.avg_score)
              ? parseFloat(scoreRows[0].avg_score) : 5;

            // Step 5: Filter — exclude enrolled, match category, limit 3
            const unenrolled = allCourses.filter(c => !enrolledIds.includes(c.id));
            const categoryMatched = unenrolled.filter(c =>
              categories.some(cat =>
                c.category && c.category.toLowerCase().includes(cat.toLowerCase())
              )
            );

            // If category match gives results, use those; otherwise fallback to any unenrolled
            let filtered = categoryMatched.length > 0
              ? categoryMatched.slice(0, 3)
              : unenrolled.slice(0, 3);

            // Clean output: only id, title, category
            const result = filtered.map(c => ({ id: c.id, title: c.title, category: c.category }));

            console.log("AI RESPONSE:", result);

            // Try ML service for better ranking, but use filtered result as guaranteed fallback
            const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:5002";
            axios.get(`${ML_URL}/recommend?user_id=${userId}`)
            .then(response => {
            const aiResult = Array.isArray(response.data) ? response.data : [];
            if (aiResult.length > 0) {
            res.json(aiResult.slice(0, 3));
            } else {
            res.json(result);
            }
            })
            .catch(() => {
            res.json(result);
            });
          }
        );
      }
    );
  });
});


// Server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});