import { useEffect, useState, useCallback } from "react";
import { API_URL } from "./config";
import Login from "./login";
import Signup from "./Signup";
import { useMemo } from "react";
import {
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  CheckCircle2,
  XCircle,
  Loader2,
  GraduationCap,
  Tag,
  ChevronRight,
  Users,
  PlayCircle,
  CheckCheck,
  Award,
  ArrowLeft,
  Circle,
  CheckCircle,
  ClipboardList,
  Library,
  Activity,
  ArrowRight,
  Sparkles,
  Bot,
  Zap,
} from "lucide-react";

// ─── Toast ─────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";

  return (
    <div className={`fixed top-5 right-5 px-6 py-4 rounded-2xl shadow-lg border text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-5 z-50 ${isSuccess ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"
      }`}>
      {toast.message}
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────
function Navbar({ user, onLogout, onAI }) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <GraduationCap className="text-white w-5 h-5" />
        </div>
        <h1 className="font-extrabold text-xl text-slate-900 tracking-tight">LearnHub</h1>
      </div>
      <div className="flex items-center gap-3">
        {onAI && (
          <button
            onClick={onAI}
            className="flex items-center gap-1.5 text-sm font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3.5 py-2 rounded-xl border border-violet-200 transition-all hover:scale-105 active:scale-95"
          >
            <Bot className="w-4 h-4" />
            AI
          </button>
        )}
        <span className="text-sm font-medium text-slate-600">
          Hello, <span className="text-slate-900 font-bold">{user.username}</span>
        </span>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 px-3 py-2 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}

// ─── Floating AI Button ──────────────────────────
function FloatingAIButton({ onClick }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 group pointer-events-none">
      <div className="flex flex-col items-center pointer-events-auto">
        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl whitespace-nowrap shadow-xl flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI Recommendations
        </div>
        <button
          onClick={onClick}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-violet-200/50 hover:shadow-violet-300/50 hover:scale-110 active:scale-95 transition-all duration-300 animate-[bounce_3s_infinite] hover:animate-none"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ────────────────────────────
function AdminDashboard({ user, onLogout, showToast }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // ✅ FETCH COURSES
  useEffect(() => {
    fetch(`${API_URL}/courses`)
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.error(err));
  }, []);

  // ✅ ADD COURSE
  const handleAddCourse = () => {
    setLoading(true);

    fetch(`${API_URL}/add-course`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, description, category })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        showToast("success", "Course Added");

        setTitle("");
        setDescription("");
        setCategory("");

        // 🔥 REFRESH COURSES
        fetch(`${API_URL}/courses`)
          .then(res => res.json())
          .then(data => setCourses(data));
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={onLogout} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === "dashboard" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab("add")}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === "add" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            <PlusCircle className="w-5 h-5" />
            Add Course
          </button>

          <button
            onClick={() => { setActiveTab("users"); fetch(`${API_URL}/users`).then(r => r.json()).then(d => setAllUsers(d)); }}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === "users" || activeTab === "userdetails" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
        </div>

        {/* Content */}
        <div className="p-8 w-full max-w-6xl mx-auto">

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
                  <p className="text-slate-500 mt-1">Manage all your courses and categories.</p>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 mb-8 w-fit">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Courses</p>
                  <p className="text-3xl font-bold text-slate-900">{courses.length}</p>
                </div>
              </div>

              {/* COURSES LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 hover:-translate-y-1 group flex flex-col h-full">
                    <div className="flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                          <Tag className="w-3.5 h-3.5" />
                          {course.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 leading-tight">{course.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">{course.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADD COURSE */}
          {activeTab === "add" && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Add New Course</h2>
                <p className="text-slate-500 mt-1">Create a new course to appear in the platform.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Title</label>
                    <input
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow bg-slate-50 focus:bg-white text-slate-900"
                      placeholder="e.g. Advanced React Patterns"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                    <textarea
                      rows={4}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow bg-slate-50 focus:bg-white resize-none text-sm text-slate-900"
                      placeholder="Course description and details..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                    <input
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow bg-slate-50 focus:bg-white text-slate-900"
                      placeholder="e.g. Programming"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleAddCourse}
                    disabled={loading || !title || !description || !category}
                    className="w-full bg-indigo-600 text-white px-4 py-3.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-6 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding Course...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-5 h-5" />
                        Create Course
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* USERS LIST */}
          {activeTab === "users" && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">All Users</h2>
                <p className="text-slate-500 mt-1">Manage platform users and view their progress.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allUsers.map(u => (
                  <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all hover:-translate-y-1 group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {(u.name || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{u.name}</h3>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDetailsLoading(true);
                        fetch(`${API_URL}/user/${u.id}/details`)
                          .then(r => r.json())
                          .then(d => { setUserDetails(d); setSelectedUser(u); setActiveTab("userdetails"); setDetailsLoading(false); })
                          .catch(() => setDetailsLoading(false));
                      }}
                      className="w-full bg-indigo-50 text-indigo-600 py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" /> View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USER DETAILS */}
          {activeTab === "userdetails" && selectedUser && (
            <div className="animate-in fade-in duration-300">
              <button onClick={() => setActiveTab("users")} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Users
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {(selectedUser.name || "U")[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h2>
                  <p className="text-slate-500 text-sm">{selectedUser.email}</p>
                </div>
              </div>

              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : userDetails && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Library className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Total Courses</p>
                        <p className="text-2xl font-bold text-slate-900">{userDetails.courses.length}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <CheckCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Completed</p>
                        <p className="text-2xl font-bold text-slate-900">{userDetails.courses.filter(c => c.progress >= 100).length}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Avg Progress</p>
                        <p className="text-2xl font-bold text-slate-900">{userDetails.courses.length > 0 ? Math.round(userDetails.courses.reduce((a, c) => a + (Number(c.progress) || 0), 0) / userDetails.courses.length) : 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Enrolled Courses */}
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Enrolled Courses</h3>
                  {userDetails.courses.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">No courses enrolled yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {userDetails.courses.map((c, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-slate-900">{c.title}</h4>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-xs font-medium border border-slate-100 shrink-0 ml-2">
                              <Tag className="w-3 h-3" /> {c.category}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(c.progress, 100)}%` }}></div>
                          </div>
                          <p className="text-xs font-medium text-slate-500">{c.progress}% complete</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── COURSE PAGE ────────────────────────────────
function CoursePage({ course, user, onBack, onTakeQuiz }) {
  const [lessons, setLessons] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/lessons/${course.id}`)
      .then(res => res.json())
      .then(data => {
        setLessons(data);
        if (data.length > 0) setActiveLesson(data[0]);
      });

    fetch(`${API_URL}/progress/${user.id}/${course.id}`)
      .then(res => res.json())
      .then(data => {
        setProgressData(data.progressData || []);
      });
  }, [course.id, user.id]);

  const completedLessons = useMemo(() => {
    return new Set(
      (progressData || [])
        .filter(p => Number(p.completed) === 1)
        .map(p => p.lesson_id)
    );
  }, [progressData]);

  const isCompleted = (lessonId) => completedLessons.has(lessonId);

  const markComplete = async (lessonId) => {
    if (progressData.some(p => p.lesson_id === lessonId && Number(p.completed) === 1)) return; // prevent duplicate call

    setMarking(true);
    fetch(`${API_URL}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, course_id: course.id, lesson_id: lessonId }),
    })
      .then(res => res.json())
      .then(() => {
        setProgressData(prev => {
          if (prev.some(p => p.lesson_id === lessonId)) return prev;
          return [...prev, { lesson_id: lessonId, completed: 1 }];
        });
        setMarking(false);
      });
  };

  const completed = completedLessons.size;
  const total = lessons.length;
  const progressPercent = total === 0 ? 0 : Math.min(Math.round((completed / total) * 100), 100);
  const isCurrentComplete = activeLesson && isCompleted(activeLesson.id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={onBack} />

      <div className="flex flex-1 overflow-hidden">
        {/* Lesson Sidebar */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to courses
            </button>
            <h2 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2">{course.title}</h2>
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
                <span>{completed}/{total} lessons</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {lessons.map((lesson, idx) => {
              const done = isCompleted(lesson.id);
              const isActive = activeLesson?.id === lesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl mb-1 transition-all ${isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-700"
                    }`}
                >
                  {done
                    ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    : <Circle className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? "text-indigo-400" : "text-slate-300"}`} />}
                  <span className={`text-sm font-medium leading-snug ${done ? "text-slate-500" : ""}`}>
                    <span className="text-xs text-slate-400 block mb-0.5">Lesson {idx + 1}</span>
                    {lesson.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeLesson ? (
            <div className="max-w-3xl mx-auto">
              {/* Video */}
              {activeLesson.video_url && (
                <div className="rounded-2xl overflow-hidden mb-6 bg-black aspect-video shadow-lg">
                  <iframe
                    src={activeLesson.video_url}
                    className="w-full h-full"
                    allowFullScreen
                    title={activeLesson.title}
                  />
                </div>
              )}

              {/* Title + Mark Complete */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{activeLesson.title}</h1>
                  {isCurrentComplete && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mt-2">
                      <CheckCheck className="w-3.5 h-3.5" /> Completed
                    </span>
                  )}
                </div>
                <button
                  disabled={isCompleted(activeLesson.id) || marking}
                  onClick={() => markComplete(activeLesson.id)}
                  className="shrink-0 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:bg-emerald-700 transition-all active:scale-95 disabled:bg-emerald-200 disabled:cursor-default disabled:shadow-none"
                >
                  {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isCompleted(activeLesson.id) ? "Completed ✅" : "Mark as Complete"}
                </button>
              </div>

              {/* Content */}
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                {activeLesson.content}
              </div>

              {/* Take Quiz CTA */}
              {progressPercent === 100 && (
                <div className="mt-8 bg-indigo-600 text-white rounded-2xl p-6 flex items-center justify-between shadow-lg">
                  <div>
                    <h3 className="font-bold text-lg">Ready for the quiz?</h3>
                    <p className="text-indigo-200 text-sm mt-1">You've completed all lessons. Test your knowledge!</p>
                  </div>
                  <button
                    onClick={onTakeQuiz}
                    className="bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors shrink-0 flex items-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4" /> Take Quiz
                  </button>
                </div>
              )}
              {progressPercent < 100 && lessons.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onTakeQuiz}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Skip to Quiz <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <PlayCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Select a lesson to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── QUIZ PAGE ───────────────────────────────────
function QuizPage({ course, user, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/quiz/${course.id}`)
      .then(res => res.json())
      .then(data => { setQuestions(data); setLoading(false); });
  }, [course.id]);

  const handleSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = () => {
    let currentScore = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.answer) {
        currentScore += 1;
      }
    });
    setScore(currentScore);
    setSubmitted(true);

    const payload = Object.entries(answers).map(([questionId, selected]) => ({
      questionId: parseInt(questionId),
      selected,
    }));
    fetch(`${API_URL}/quiz/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, courseId: course.id, answers: payload }),
    }).catch(err => console.error(err));
  };

  const options = ["option1", "option2", "option3", "option4"];
  const optionLabels = ["A", "B", "C", "D"];
  const hasAnsweredAtLeastOne = Object.keys(answers).length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={onBack} />

      <div className="max-w-2xl mx-auto w-full px-6 py-10">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to courses
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
            <p className="text-slate-500 text-sm">Quiz — select your answers and submit</p>
          </div>
        </div>

        {/* Score Card */}
        {submitted && (
          <div className={`rounded-2xl p-8 mb-8 text-center shadow-lg ${score === questions.length ? "bg-emerald-600 text-white" :
              score >= questions.length / 2 ? "bg-indigo-600 text-white" :
                "bg-rose-500 text-white"
            }`}>
            <Award className="w-14 h-14 mx-auto mb-3" />
            <p className="text-3xl font-bold mb-2">You scored {score} / {questions.length}</p>
            <p className="text-lg font-medium opacity-90">
              {score === questions.length ? "Perfect score! 🎉" :
                score >= questions.length / 2 ? "Good job! Keep it up 💪" :
                  "Keep practicing! 📚"}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p>No quiz questions found for this course.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-sm font-semibold text-indigo-600 mb-2">Question {idx + 1}</p>
                <p className="font-semibold text-slate-900 mb-5 text-base leading-snug">{q.question}</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {options.map((opt, i) => {
                    const optionValue = q[opt];
                    if (!optionValue) return null;
                    const selected = answers[q.id] === optionValue;
                    const isCorrect = submitted && optionValue === q.answer;
                    const isWrong = submitted && selected && optionValue !== q.answer;

                    return (
                      <button
                        key={opt}
                        disabled={submitted}
                        onClick={() => handleSelect(q.id, optionValue)}
                        className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${isCorrect ? "bg-emerald-50 border-emerald-400 text-emerald-800" :
                            isWrong ? "bg-rose-50 border-rose-400 text-rose-800" :
                              selected ? "bg-indigo-50 border-indigo-400 text-indigo-800 ring-1 ring-indigo-400" :
                                "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700"
                          }`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? "bg-emerald-500 text-white" :
                            isWrong ? "bg-rose-500 text-white" :
                              selected ? "bg-indigo-500 text-white" :
                                "bg-slate-100 text-slate-600"
                          }`}>
                          {selected && !submitted ? <Circle className="w-3 h-3 fill-white" /> : optionLabels[i]}
                        </span>
                        {optionValue}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!submitted && (
              <button
                onClick={handleSubmit}
                disabled={!hasAnsweredAtLeastOne}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-base shadow-md hover:bg-indigo-700 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                <Award className="w-5 h-5" />
                {`Submit Quiz (${Object.keys(answers).length}/${questions.length} answered)`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── USER DASHBOARD ─────────────────────────────
function CourseCard({ course, user, onStart }) {
  const [progress, setProgress] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);

  useEffect(() => {
    // Use ONLY backend response - single source of truth
    fetch(`${API_URL}/progress/${user.id}/${course.id}`)
      .then(res => res.json())
      .then(data => {
        setProgress(data.completed || 0);
        setTotalLessons(data.totalLessons || 0);
      });
  }, [course.id, user.id]);

  const pct = totalLessons === 0 ? 0 : Math.min(Math.round((progress / totalLessons) * 100), 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1.5 group flex flex-col h-full">
      <div className="flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <BookOpen className="w-6 h-6" />
          </div>
          {course.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-medium border border-slate-100">
              <Tag className="w-3.5 h-3.5" />
              {course.category}
            </span>
          )}
        </div>
        <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{course.title}</h3>
        {course.description && <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{course.description}</p>}
      </div>

      {/* Progress Bar */}
      {totalLessons > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
            <span>{progress}/{totalLessons} lessons</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => onStart(course)}
          className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors"
        >
          {pct === 100 ? "Review Course" : pct > 0 ? "Continue" : "Start Learning"}
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Free</span>
      </div>
    </div>
  );
}

// ─── AI RECOMMENDATIONS PAGE ─────────────────────
function AiRecommendationsPage({ user, onBack, onStartCourse }) {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/ai-recommend/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRecommended(data);
        else if (data.data && Array.isArray(data.data)) setRecommended(data.data);
        else setRecommended([]);
        setLoading(false);
      })
      .catch(() => { setRecommended([]); setLoading(false); });
  }, [user.id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={onBack} />

      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex-1">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-200">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            🔥 Personalized For You
          </h1>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            AI-powered recommendations based on your learning activity and quiz performance.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
            <p className="text-slate-400 font-medium">Analyzing your learning pattern...</p>
          </div>
        ) : !Array.isArray(recommended) || recommended.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm text-center">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No recommendations yet</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Start learning and complete quizzes to unlock AI recommendations 🚀
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommended.map(rec => (
              <div
                key={rec.id}
                className="bg-white rounded-3xl border border-violet-100 p-6 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all duration-300 hover:-translate-y-2 cursor-pointer group relative overflow-hidden flex flex-col"
                onClick={() => onStartCourse && onStartCourse(rec)}
              >
                {/* AI Badge */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    <Sparkles className="w-3 h-3" /> AI Pick
                  </span>
                </div>

                <div className="flex-1">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-5 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                    <BookOpen className="w-6 h-6" />
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight group-hover:text-violet-600 transition-colors">
                    {rec.title}
                  </h3>

                  {/* Category */}
                  {rec.category && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-medium border border-slate-100">
                      <Tag className="w-3 h-3" /> {rec.category}
                    </span>
                  )}

                  {/* Why Recommended */}
                  <p className="text-xs text-violet-500 mt-4 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Because you learned {rec.category || "related topics"}
                  </p>
                </div>

                {/* CTA */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button className="w-full bg-violet-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors active:scale-[0.98] flex items-center justify-center gap-2">
                    <PlayCircle className="w-4 h-4" /> Start Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── USER DASHBOARD ─────────────────────────────
function UserDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ totalCompleted: 0, totalEnrolled: 0, avgProgress: 0, lastCourseId: null });
  const [recommended, setRecommended] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeView, setActiveView] = useState("dashboard"); // dashboard | course | quiz | ai

  useEffect(() => {
    fetch(`${API_URL}/courses`)
      .then(res => res.json())
      .then(data => setCourses(data));

    if (activeView === "dashboard") {
      fetch(`${API_URL}/dashboard-stats/${user.id}`)
        .then(res => res.json())
        .then(data => setStats(data));
    }
  }, [user.id, activeView]);

  const handleStartCourse = (course) => {
    setActiveCourse(course);
    setActiveView("course");
  };

  if (activeView === "course" && activeCourse) {
    return (
      <CoursePage
        course={activeCourse}
        user={user}
        onBack={() => { setActiveCourse(null); setActiveView("dashboard"); }}
        onTakeQuiz={() => setActiveView("quiz")}
      />
    );
  }

  if (activeView === "quiz" && activeCourse) {
    return (
      <QuizPage
        course={activeCourse}
        user={user}
        onBack={() => { setActiveCourse(null); setActiveView("dashboard"); }}
      />
    );
  }

  if (activeView === "ai") {
    return (
      <AiRecommendationsPage
        user={user}
        onBack={() => setActiveView("dashboard")}
        onStartCourse={(rec) => {
          const match = courses.find(c => c.id === rec.id);
          if (match) { setActiveCourse(match); setActiveView("course"); }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={onLogout} onAI={() => setActiveView("ai")} />

      <div className="max-w-7xl mx-auto w-full px-6 py-10 flex-1 space-y-12">

        {/* STATS SECTION */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Library className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Enrolled Courses</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalEnrolled}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Lessons Completed</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalCompleted}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Average Progress</p>
                <p className="text-3xl font-bold text-slate-900">{stats.avgProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* CONTINUE LEARNING SECTION */}
        {stats.lastCourseId && courses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Continue Learning</h2>
            </div>
            {(() => {
              const lastCourse = courses.find(c => c.id === stats.lastCourseId);
              if (!lastCourse) return null;
              return (
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 shadow-lg text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:shadow-xl transition-all">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium mb-4">
                      <PlayCircle className="w-3.5 h-3.5" /> Jump back in
                    </span>
                    <h3 className="text-2xl font-bold mb-2">{lastCourse.title}</h3>
                    <p className="text-indigo-100 max-w-xl line-clamp-2">{lastCourse.description}</p>
                  </div>
                  <button
                    onClick={() => handleStartCourse(lastCourse)}
                    className="shrink-0 bg-white text-indigo-900 px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm active:scale-95 group-hover:-translate-y-1"
                  >
                    Resume Learning <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* AVAILABLE COURSES SECTION */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Available Courses</h2>
              <p className="text-slate-500 text-sm mt-0.5">Explore our latest learning materials curated just for you.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map(c => (
              <CourseCard key={c.id} course={c} user={user} onStart={handleStartCourse} />
            ))}
          </div>
        </div>
      </div>

      {/* Floating AI Assist */}
      <FloatingAIButton onClick={() => setActiveView("ai")} />
    </div>
  );
}

// ─── AUTH SCREEN ────────────────────────────────
function AuthScreen({ setUser }) {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div className="relative">
      {isSignup ? <Signup setUser={setUser} /> : <Login setUser={setUser} />}

      <div className="absolute bottom-10 w-full flex justify-center pointer-events-none">
        <button
          onClick={() => setIsSignup(!isSignup)}
          className="pointer-events-auto text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors bg-white/90 backdrop-blur-sm px-6 py-2.5 rounded-full shadow-sm border border-slate-200 hover:shadow-md active:scale-95"
        >
          {isSignup ? "Already have an account? Sign In" : "New to LearnHub? Create account"}
        </button>
      </div>
    </div>
  );
}

// ─── APP ROOT ───────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  if (!user) return <AuthScreen setUser={setUser} />;

  if (user.role === "admin") {
    return <AdminDashboard user={user} onLogout={() => setUser(null)} showToast={showToast} />;
  }

  return <UserDashboard user={user} onLogout={() => setUser(null)} />;
}

export default App;