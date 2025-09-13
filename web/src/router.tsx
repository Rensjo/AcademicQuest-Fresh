import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from './App'
import Dashboard from '@/pages/Dashboard'
import AcademicPlanner from '@/pages/AcademicPlanner'
import SchedulePlanner from '@/pages/SchedulePlanner'
import CoursePlanner from '@/pages/CoursePlanner'
import Scholarships from '@/pages/Scholarships'
import Textbooks from '@/pages/Textbooks'
import Settings from '@/pages/Settings'
import AppLayout from '@/components/AppLayout'
import Tasks from '@/pages/Tasks'


export const router = createBrowserRouter([
{
  path: '/',
  element: <App />,
  children: [
    { path: '', element: <AppLayout><Dashboard/></AppLayout> },
    { path: 'planner', element: <AppLayout><AcademicPlanner/></AppLayout> },
    { path: 'tasks', element: <AppLayout><Tasks/></AppLayout> },
    { path: 'schedule', element: <AppLayout><SchedulePlanner/></AppLayout> },
    { path: 'course-planner', element: <AppLayout><CoursePlanner/></AppLayout> },
    { path: 'courses', element: <AppLayout><CoursePlanner/></AppLayout> },
    { path: 'gpa', element: <Navigate to="/" replace /> },
    { path: 'gpa-calculator', element: <Navigate to="/" replace /> },
    { path: 'scholarships', element: <AppLayout><Scholarships/></AppLayout> },
    { path: 'textbooks', element: <AppLayout><Textbooks/></AppLayout> },
    { path: 'settings', element: <AppLayout><Settings/></AppLayout> },
  ]
}
]) 