import React from 'react'
import WelcomeBanner from './_components/WelcomeBanner'
import StatsCards from './_components/StatsCards'
import QuizOverview from './_components/QuizOverview'
import QuizReminders from './_components/QuizReminders'
import Announcements from './_components/Announcements'

function Workspace() {
  return (
    <div>
      <WelcomeBanner />
      <StatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuizOverview />
        </div>
        <div className="space-y-6">
          <QuizReminders />
          <Announcements />
        </div>
      </div>
    </div>
  )
}

export default Workspace
