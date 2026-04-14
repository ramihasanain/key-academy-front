import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Features from './pages/Features'
import Grades from './pages/Grades'
import SubjectTeachers from './pages/SubjectTeachers'
import Teachers from './pages/Teachers'
import TeacherProfile from './pages/TeacherProfile'
import FAQ from './pages/FAQ'
import Login from './pages/Login'
import Signup from './pages/Signup'
import StudentDashboard from './pages/StudentDashboard'
import CourseViewer from './pages/CourseViewer'
import LessonViewer from './pages/LessonViewer'
import CoursePreview from './pages/CoursePreview'
import VirtualLabs from './pages/VirtualLabs'
import { useEffect } from 'react'
import { AdminLayout } from './pages/hq/AdminLayout'
import { AdminOverview } from './pages/hq/AdminOverview'
import { AdminModelGrid } from './pages/hq/AdminModelGrid'
import { AdminModelForm } from './pages/hq/AdminModelForm'
import { Student360View } from './pages/hq/Student360View'
import { Teacher360View } from './pages/hq/Teacher360View'
import { TA360View } from './pages/hq/TA360View'
import { AdminMutedStudents } from './pages/hq/AdminMutedStudents'
import { AdminModerationHistory } from './pages/hq/AdminModerationHistory'
import { TALayout } from './pages/ta/TALayout'
import { TAQA } from './pages/ta/TAQA'
import { TAGroups } from './pages/ta/TAGroups'
import { TAExams } from './pages/ta/TAExams'
import { TAMutedStudents } from './pages/ta/TAMutedStudents'
import { TAModerationHistory } from './pages/ta/TAModerationHistory'
import { TAStudentStats } from './pages/ta/TAStudentStats'
import { TAStudentsList } from './pages/ta/TAStudentsList'
import { TAStudent360 } from './pages/ta/TAStudent360'
import { TANotebook } from './pages/ta/TANotebook'
import { TASpyLogin } from './pages/hq/TASpyLogin'
import { WeeklyExamPortal } from './pages/student/WeeklyExamPortal'
import { TeacherLayout } from './pages/teacher/TeacherLayout'
import { TeacherOverview } from './pages/teacher/TeacherOverview'
import { TeacherCourses } from './pages/teacher/TeacherCourses'
import { TeacherAssistants } from './pages/teacher/TeacherAssistants'
import { ProtectedRoute } from './components/ProtectedRoute'

function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])
    return null
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
                <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/grades" element={<Grades />} />
                    <Route path="/grades/:gradeId" element={<Grades />} />
                    <Route path="/grades/:gradeId/subject/:subjectName" element={<SubjectTeachers />} />
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
                    <Route path="/virtual-labs" element={<VirtualLabs />} />
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
            </main>
            {!hideNav && <Footer />}
        </>
    )
}

export default App
