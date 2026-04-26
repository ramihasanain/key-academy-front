import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Features = lazy(() => import('./pages/Features'))
const Grades = lazy(() => import('./pages/Grades'))
const Teachers = lazy(() => import('./pages/Teachers'))
const TeacherProfile = lazy(() => import('./pages/TeacherProfile'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const CourseViewer = lazy(() => import('./pages/CourseViewer'))
const LessonViewer = lazy(() => import('./pages/LessonViewer'))
const CoursePreview = lazy(() => import('./pages/CoursePreview'))

const AdminLayout = lazy(() => import('./pages/hq/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminOverview = lazy(() => import('./pages/hq/AdminOverview').then(m => ({ default: m.AdminOverview })))
const AdminModelGrid = lazy(() => import('./pages/hq/AdminModelGrid').then(m => ({ default: m.AdminModelGrid })))
const AdminModelForm = lazy(() => import('./pages/hq/AdminModelForm').then(m => ({ default: m.AdminModelForm })))
const Student360View = lazy(() => import('./pages/hq/Student360View').then(m => ({ default: m.Student360View })))
const Teacher360View = lazy(() => import('./pages/hq/Teacher360View').then(m => ({ default: m.Teacher360View })))
const TA360View = lazy(() => import('./pages/hq/TA360View').then(m => ({ default: m.TA360View })))
const AdminMutedStudents = lazy(() => import('./pages/hq/AdminMutedStudents').then(m => ({ default: m.AdminMutedStudents })))
const AdminModerationHistory = lazy(() => import('./pages/hq/AdminModerationHistory').then(m => ({ default: m.AdminModerationHistory })))

const TALayout = lazy(() => import('./pages/ta/TALayout').then(m => ({ default: m.TALayout })))
const TAQA = lazy(() => import('./pages/ta/TAQA').then(m => ({ default: m.TAQA })))
const TAGroups = lazy(() => import('./pages/ta/TAGroups').then(m => ({ default: m.TAGroups })))
const TAExams = lazy(() => import('./pages/ta/TAExams').then(m => ({ default: m.TAExams })))
const TAMutedStudents = lazy(() => import('./pages/ta/TAMutedStudents').then(m => ({ default: m.TAMutedStudents })))
const TAModerationHistory = lazy(() => import('./pages/ta/TAModerationHistory').then(m => ({ default: m.TAModerationHistory })))
const TAStudentStats = lazy(() => import('./pages/ta/TAStudentStats').then(m => ({ default: m.TAStudentStats })))
const TAStudentsList = lazy(() => import('./pages/ta/TAStudentsList').then(m => ({ default: m.TAStudentsList })))
const TAStudent360 = lazy(() => import('./pages/ta/TAStudent360').then(m => ({ default: m.TAStudent360 })))
const TANotebook = lazy(() => import('./pages/ta/TANotebook').then(m => ({ default: m.TANotebook })))

const TASpyLogin = lazy(() => import('./pages/hq/TASpyLogin').then(m => ({ default: m.TASpyLogin })))
const WeeklyExamPortal = lazy(() => import('./pages/student/WeeklyExamPortal').then(m => ({ default: m.WeeklyExamPortal })))

const TeacherLayout = lazy(() => import('./pages/teacher/TeacherLayout').then(m => ({ default: m.TeacherLayout })))
const TeacherOverview = lazy(() => import('./pages/teacher/TeacherOverview').then(m => ({ default: m.TeacherOverview })))
const TeacherCourses = lazy(() => import('./pages/teacher/TeacherCourses').then(m => ({ default: m.TeacherCourses })))
const TeacherAssistants = lazy(() => import('./pages/teacher/TeacherAssistants').then(m => ({ default: m.TeacherAssistants })))
import { ProtectedRoute } from './components/ProtectedRoute'

function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])
    return null
}

function HomeRoute() {
    const userStr = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')

    if (!token || !userStr || userStr === 'undefined' || userStr === 'null') {
        return <Home />
    }

    try {
        const user = JSON.parse(userStr)
        if (user?.role === 'student') {
            return <Navigate to="/dashboard" replace />
        }
        if (user?.role === 'admin') {
            return <Navigate to="/hq" replace />
        }
        if (user?.role === 'assistant') {
            return <Navigate to="/ta" replace />
        }
        if (user?.role === 'teacher') {
            return <Navigate to="/teacher" replace />
        }
    } catch {
        // Ignore invalid cached user payload and render home
    }

    return <Home />
}

function App() {
    const location = useLocation()
    const path = location.pathname.toLowerCase()
    const hideNav = ['/login', '/signup', '/dashboard'].includes(path) || path.startsWith('/course') || path.startsWith('/lesson') || path.startsWith('/student/exam') || path.startsWith('/hq') || path.startsWith('/ta') || path.startsWith('/ta-spy') || path === '/teacher' || path.startsWith('/teacher/')

    return (
        <>
            <ScrollToTop />
            {!hideNav && <Navbar />}
            <main>
                <Suspense fallback={
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #832a96', borderRadius: '50%', animation: 'spin-react 1s linear infinite' }}></div>
                        <style>{`@keyframes spin-react { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                }>
                    <Routes location={location}>
                        <Route path="/" element={<HomeRoute />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/features" element={<Features />} />
                        <Route path="/grades" element={<Grades />} />
                        <Route path="/grades/:gradeId" element={<Grades />} />
                        <Route path="/teachers" element={<Teachers />} />
                        <Route path="/teachers/:id" element={<TeacherProfile />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/dashboard" element={
                            <ProtectedRoute allowedRoles={['student']}>
                                <StudentDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/course-preview/:courseId" element={<CoursePreview />} />
                        <Route path="/course/:courseId" element={<CourseViewer />} />
                        <Route path="/lesson/:lessonId" element={<LessonViewer />} />
                        <Route path="/student/exam/:examId" element={<WeeklyExamPortal />} />
                        
                        {/* HQ Admin Dashboard Routes */}
                        <Route path="/hq" element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<AdminOverview />} />
                            <Route path="muted-students" element={<AdminMutedStudents />} />
                            <Route path="moderation-history" element={<AdminModerationHistory />} />
                            <Route path=":model" element={<AdminModelGrid />} />
                            <Route path="students/:id/360" element={<Student360View />} />
                            <Route path="teachers/:id/360" element={<Teacher360View />} />
                            <Route path="teacherassistants/:id/360" element={<TA360View />} />
                            <Route path=":model/:id" element={<AdminModelForm />} />
                        </Route>

                        {/* Teacher Assistant Dashboard Routes */}
                        <Route path="/ta-spy/:token" element={<TASpyLogin />} />
                        <Route path="/ta" element={
                            <ProtectedRoute allowedRoles={['assistant', 'admin']}>
                                <TALayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<TAStudentStats />} />
                            <Route path="students" element={<TAStudentsList />} />
                            <Route path="qa" element={<TAQA />} />
                            <Route path="groups" element={<TAGroups />} />
                            <Route path="notes" element={<TANotebook />} />
                            <Route path="exams" element={<TAExams />} />
                            <Route path="muted" element={<TAMutedStudents />} />
                            <Route path="moderation-history" element={<TAModerationHistory />} />
                            <Route path="student/:id/360" element={<TAStudent360 />} />
                        </Route>

                        {/* Teacher Premium Dashboard Routes */}
                        <Route path="/teacher" element={
                            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                                <TeacherLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<TeacherOverview />} />
                            <Route path="courses" element={<TeacherCourses />} />
                            <Route path="courses/:courseId/students" element={<TAStudentStats />} />
                            <Route path="assistants" element={<TeacherAssistants />} />
                            <Route path="qa" element={<TAQA />} />
                            <Route path="groups" element={<TAGroups />} />
                            <Route path="students" element={<TAStudentStats />} />
                            <Route path="students/:id/360" element={<TAStudent360 />} />
                            <Route path="muted" element={<TAMutedStudents />} />
                            <Route path="moderation-history" element={<TAModerationHistory />} />
                            <Route path="*" element={<div style={{padding: '50px', textAlign: 'center'}}><h3>جاري العمل على هذه الصفحة.. ⏳</h3><p>ستتوفر قريباً في التحديث القادم.</p></div>} />
                        </Route>
                    </Routes>
                </Suspense>
            </main>
            {!hideNav && <Footer />}
        </>
    )
}

export default App
