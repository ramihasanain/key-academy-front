import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GlobalLoader from "./components/core/GlobalLoader";
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const Grades = lazy(() => import("./pages/Grades"));
const Teachers = lazy(() => import("./pages/Teachers"));
const TeacherProfile = lazy(() => import("./pages/TeacherProfile"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ParentLogin = lazy(() => import("./pages/parent/ParentLogin"));
const ParentChangePassword = lazy(() => import("./pages/parent/ParentChangePassword"));
const ParentSelectStudent = lazy(() => import("./pages/parent/ParentSelectStudent"));
const ParentLayout = lazy(() => import("./pages/parent/ParentLayout"));
const ParentPerformance = lazy(() => import("./pages/parent/ParentPerformance"));
const ParentWeeklyExams = lazy(() => import("./pages/parent/ParentWeeklyExams"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const CourseViewer = lazy(() => import("./pages/CourseViewer"));
const LessonViewer = lazy(() => import("./pages/LessonViewer"));
const CoursePreview = lazy(() => import("./pages/CoursePreview"));

const AdminLayout = lazy(() =>
  import("./pages/hq/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminOverview = lazy(() =>
  import("./pages/hq/AdminOverview").then((m) => ({
    default: m.AdminOverview,
  })),
);
const AdminModelGrid = lazy(() =>
  import("./pages/hq/AdminModelGrid").then((m) => ({
    default: m.AdminModelGrid,
  })),
);
const AdminModelForm = lazy(() =>
  import("./pages/hq/AdminModelForm").then((m) => ({
    default: m.AdminModelForm,
  })),
);
const Student360View = lazy(() =>
  import("./pages/hq/Student360View").then((m) => ({
    default: m.Student360View,
  })),
);
const Teacher360View = lazy(() =>
  import("./pages/hq/Teacher360View").then((m) => ({
    default: m.Teacher360View,
  })),
);
const TA360View = lazy(() =>
  import("./pages/hq/TA360View").then((m) => ({ default: m.TA360View })),
);
const AdminMutedStudents = lazy(() =>
  import("./pages/hq/AdminMutedStudents").then((m) => ({
    default: m.AdminMutedStudents,
  })),
);
const AdminModerationHistory = lazy(() =>
  import("./pages/hq/AdminModerationHistory").then((m) => ({
    default: m.AdminModerationHistory,
  })),
);
const TAManagerDashboard = lazy(() =>
  import("./pages/hq/TAManagerDashboard").then((m) => ({
    default: m.TAManagerDashboard,
  })),
);
const TwoFactorSetup = lazy(() => import("./pages/hq/TwoFactorSetup"));
const AdminQuickFillCourses = lazy(() =>
  import("./pages/hq/AdminQuickFillCourses").then((m) => ({
    default: m.AdminQuickFillCourses,
  })),
);
const AdminCopyLesson = lazy(() =>
  import("./pages/hq/AdminCopyLesson").then((m) => ({
    default: m.AdminCopyLesson,
  })),
);

const TALayout = lazy(() =>
  import("./pages/ta/TALayout").then((m) => ({ default: m.TALayout })),
);
const TAQA = lazy(() =>
  import("./pages/ta/TAQA").then((m) => ({ default: m.TAQA })),
);
const TAGroups = lazy(() =>
  import("./pages/ta/TAGroups").then((m) => ({ default: m.TAGroups })),
);
const TAExams = lazy(() =>
  import("./pages/ta/TAExams").then((m) => ({ default: m.TAExams })),
);
const TAExamGradingWorkspace = lazy(() =>
  import("./pages/ta/TAExamGradingWorkspace").then((m) => ({ default: m.TAExamGradingWorkspace })),
);
const TAMutedStudents = lazy(() =>
  import("./pages/ta/TAMutedStudents").then((m) => ({
    default: m.TAMutedStudents,
  })),
);
const TAModerationHistory = lazy(() =>
  import("./pages/ta/TAModerationHistory").then((m) => ({
    default: m.TAModerationHistory,
  })),
);
const TAStudentStats = lazy(() =>
  import("./pages/ta/TAStudentStats").then((m) => ({
    default: m.TAStudentStats,
  })),
);
const TAActivitiesList = lazy(() =>
  import("./pages/ta/TAActivitiesList").then((m) => ({
    default: m.TAActivitiesList,
  })),
);
const TAStudentsList = lazy(() =>
  import("./pages/ta/TAStudentsList").then((m) => ({
    default: m.TAStudentsList,
  })),
);
const TAStudent360 = lazy(() =>
  import("./pages/ta/TAStudent360").then((m) => ({ default: m.TAStudent360 })),
);
const TANotebook = lazy(() =>
  import("./pages/ta/TANotebook").then((m) => ({ default: m.TANotebook })),
);
const TALectures = lazy(() =>
  import("./pages/ta/TALectures").then((m) => ({ default: m.TALectures })),
);

const TASpyLogin = lazy(() =>
  import("./pages/hq/TASpyLogin").then((m) => ({ default: m.TASpyLogin })),
);
const AssistantWizard = lazy(() =>
  import("./pages/hq/AssistantWizard").then((m) => ({
    default: m.AssistantWizard,
  })),
);
const WeeklyExamPortal = lazy(() =>
  import("./pages/student/WeeklyExamPortal").then((m) => ({
    default: m.WeeklyExamPortal,
  })),
);

const TeacherLayout = lazy(() =>
  import("./pages/teacher/TeacherLayout").then((m) => ({
    default: m.TeacherLayout,
  })),
);
const TeacherOverview = lazy(() =>
  import("./pages/teacher/TeacherOverview").then((m) => ({
    default: m.TeacherOverview,
  })),
);
const TeacherCourses = lazy(() =>
  import("./pages/teacher/TeacherCourses").then((m) => ({
    default: m.TeacherCourses,
  })),
);
const TeacherLectures = lazy(() =>
  import("./pages/teacher/TeacherLectures").then((m) => ({
    default: m.TeacherLectures,
  })),
);
const TeacherAssistants = lazy(() =>
  import("./pages/teacher/TeacherAssistants").then((m) => ({
    default: m.TeacherAssistants,
  })),
);
import { ProtectedRoute } from "./components/ProtectedRoute";

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Prevent the browser from restoring the previous scroll position on refresh/history navigation.
    if (!("scrollRestoration" in window.history)) return;

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search, hash]);

  return null;
}

function HomeRoute() {
  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("access_token");

  if (!token || !userStr || userStr === "undefined" || userStr === "null") {
    return <Home />;
  }

  try {
    const user = JSON.parse(userStr);
    if (user?.role === "student") {
      return <Navigate to="/dashboard" replace />;
    }
    if (user?.role === "admin") {
      return <Navigate to="/hq" replace />;
    }
    if (user?.role === "assistant") {
      return <Navigate to="/ta" replace />;
    }
    if (user?.role === "teacher") {
      return <Navigate to="/teacher" replace />;
    }
    if (user?.role === "parent") {
      return <Navigate to="/parent/features" replace />;
    }
  } catch {
    // Ignore invalid cached user payload and render home
  }

  return <Home />;
}

function App() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const hideNav =
    ["/login", "/signup"].includes(path) ||
    path.startsWith("/parent") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/course") ||
    path.startsWith("/lesson") ||
    path.startsWith("/student/exam") ||
    path.startsWith("/hq") ||
    path.startsWith("/ta") ||
    path.startsWith("/ta-spy") ||
    path === "/teacher" ||
    path.startsWith("/teacher/");

  return (
    <>
      <ScrollToTop />
      {!hideNav && <Navbar />}
      <main>
        <Suspense fallback={<GlobalLoader />}>
          <Routes location={location}>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/grades/:gradeId" element={<Grades />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/teachers/:id" element={<TeacherProfile />} />
            <Route path="/faq" element={<FAQ />} />
            <Route
              path="/login"
              element={<Login />}
              // element={
              //   <GoogleReCaptchaProvider
              //     reCaptchaKey={
              //       import.meta.env.VITE_GOOGLE_RECAPTCHA_KEY
              //     }
              //   >
              //     <Login />
              //   </GoogleReCaptchaProvider>
              // }
            />
            <Route path="/signup" element={<Signup />} />
            <Route path="/parent/login" element={<ParentLogin />} />
            <Route path="/parent/change-password" element={<ParentChangePassword />} />
            <Route path="/parent/select-student" element={<ParentSelectStudent />} />
            <Route path="/parent" element={<ParentLayout />}>
              <Route index element={<Navigate to="/parent/features" replace />} />
              <Route path="features" element={<Features />} />
              <Route path="about" element={<Navigate to="/parent/features" replace />} />
              <Route path="teachers" element={<Teachers profilePathPrefix="/parent/teachers" />} />
              <Route path="teachers/:id" element={<TeacherProfile readOnlyParent />} />
              <Route path="performance" element={<ParentPerformance />} />
              <Route path="weekly-exams" element={<ParentWeeklyExams />} />
            </Route>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <Navigate to="/dashboard/my-courses" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:tab"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course-preview/:slug"
              element={<CoursePreview />}
            />
            <Route path="/course/:slug" element={<CourseViewer />} />
            <Route path="/lesson/:lessonId" element={<LessonViewer />} />
            <Route
              path="/student/exam/:examId"
              element={<WeeklyExamPortal />}
            />

            {/* HQ 2FA — خارج AdminLayout لتجنب حلقة التوجيه والريكوستات المتكررة */}
            <Route
              path="/hq/2fa-setup"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <TwoFactorSetup />
                </ProtectedRoute>
              }
            />

            {/* HQ Admin Dashboard Routes */}
            <Route
              path="/hq"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="muted-students" element={<AdminMutedStudents />} />
              <Route
                path="moderation-history"
                element={<AdminModerationHistory />}
              />
              <Route path="students/:id/360" element={<Student360View />} />
              <Route path="ta-manager" element={<TAManagerDashboard />} />
              <Route path="teachers/:id/360" element={<Teacher360View />} />
              <Route path="teacherassistants/new" element={<AssistantWizard />} />
              <Route path="teacherassistants/:id/360" element={<TA360View />} />
              <Route path="quick-courses" element={<AdminQuickFillCourses />} />
              <Route path="copy-lesson" element={<AdminCopyLesson />} />
              <Route path=":model" element={<AdminModelGrid />} />
              <Route path=":model/:id" element={<AdminModelForm />} />
            </Route>

            {/* Teacher Assistant Dashboard Routes */}
            <Route path="/ta-spy/:token" element={<TASpyLogin />} />
            <Route
              path="/ta"
              element={
                <ProtectedRoute allowedRoles={["assistant", "admin"]}>
                  <TALayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TAStudentStats />} />
              <Route path="activities" element={<TAActivitiesList />} />
              <Route path="students" element={<TAStudentsList />} />
              <Route path="qa" element={<TAQA />} />
              <Route path="groups" element={<TAGroups />} />
              <Route path="notes" element={<TANotebook />} />
              <Route path="exams" element={<TAExams />} />
              <Route path="exams/grade/:submissionId" element={<TAExamGradingWorkspace />} />
              <Route path="muted" element={<TAMutedStudents />} />
              <Route
                path="moderation-history"
                element={<TAModerationHistory />}
              />
              <Route path="student/:id/360" element={<TAStudent360 />} />
              <Route path="lectures" element={<TALectures />} />
            </Route>

            {/* Teacher Premium Dashboard Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <TeacherLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TeacherOverview />} />
              <Route path="courses" element={<TeacherCourses />} />
              <Route
                path="courses/:courseId/students"
                element={<TAStudentStats />}
              />
              <Route path="assistants" element={<TeacherAssistants />} />
              <Route path="lectures" element={<TeacherLectures />} />
              <Route path="qa" element={<TAQA />} />
              <Route path="groups" element={<TAGroups />} />
              <Route path="students" element={<TAStudentStats />} />
              <Route path="students/:id/360" element={<TAStudent360 />} />
              <Route path="muted" element={<TAMutedStudents />} />
              <Route
                path="moderation-history"
                element={<TAModerationHistory />}
              />
              <Route
                path="*"
                element={
                  <div style={{ padding: "50px", textAlign: "center" }}>
                    <h3>جاري العمل على هذه الصفحة.. ⏳</h3>
                    <p>ستتوفر قريباً في التحديث القادم.</p>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </main>
      {!hideNav && <Footer />}
    </>
  );
}

export default App;
