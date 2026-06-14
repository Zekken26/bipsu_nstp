import { useState } from 'react';
import { Anchor, BookOpen, CalendarDays, CheckCircle, Heart, Shield, Sparkles, Users } from 'lucide-react';
import RoleShell from '../components/layout/RoleShell';

const NSTP_COMPONENTS = [
  {
    id: 'cwts',
    name: 'CWTS',
    fullName: 'Civic Welfare Training Service',
    description: 'Activities contributory to the general welfare and betterment of life for the members of the community.',
    icon: Heart,
    color: 'bg-green-600',
    benefits: [
      'Community development projects',
      'Health and education programs',
      'Environmental initiatives',
      'Social welfare activities'
    ]
  },
  {
    id: 'cwts-coastguard',
    name: 'CWTS-Coastguard',
    fullName: 'Civic Welfare Training Service - Coastguard',
    description: 'Maritime civic welfare track for coastal safety, rescue readiness, and community preparedness.',
    icon: Anchor,
    color: 'bg-blue-600',
    benefits: [
      'Maritime safety orientation',
      'Coastal service activities',
      'Rescue-readiness drills',
      'Water safety awareness'
    ]
  },
  {
    id: 'cwts-sunday',
    name: 'CWTS-Sunday',
    fullName: 'Civic Welfare Training Service - Sunday',
    description: 'Sunday schedule option for CWTS learners who cannot attend regular Saturday sessions.',
    icon: CalendarDays,
    color: 'bg-cyan-600',
    benefits: [
      'Shared CWTS learning materials',
      'Shared CWTS assessment structure',
      'Independent Sunday attendance',
      'Separate grades and reports'
    ]
  },
  {
    id: 'lts',
    name: 'LTS',
    fullName: 'Literacy Training Service',
    description: 'Programs designed to train students to become teachers of literacy and numeracy skills.',
    icon: BookOpen,
    color: 'bg-indigo-600',
    benefits: [
      'Teaching literacy to communities',
      'Educational outreach programs',
      'Tutorial and mentorship activities',
      'Learning material development'
    ]
  },
  {
    id: 'mts',
    name: 'MTS',
    fullName: 'Military Training Service',
    description: 'Military preparedness program for discipline, leadership, readiness, and national defense support.',
    icon: Shield,
    color: 'bg-orange-600',
    benefits: [
      'Military discipline and training',
      'Leadership development',
      'Physical fitness programs',
      'National defense preparation'
    ]
  }
];

export default function EnrollmentPage({ user, onEnroll, onLogout }: { user: any; onEnroll: (component: string) => void; onLogout: () => void }) {
  // Show completion message
  const hasCompletedGeneralEd = user.generalEducationComplete;
  const [selectedComponent, setSelectedComponent] = useState<any>(null);

  const handleEnroll = () => {
    if (selectedComponent) {
      onEnroll(selectedComponent.name);
    }
  };

  return (
    <RoleShell
      user={user}
      onLogout={onLogout}
      eyebrow="Student Workspace"
      title="Select Your NSTP Component"
      description="Choose the National Service Training Program component that aligns with your interests and career goals."
      sidebarTitle="Enrollment Status"
      sidebarItems={[
        { label: 'General Education', value: hasCompletedGeneralEd ? 'Completed' : 'In progress', tone: 'success' },
        { label: 'Selected Component', value: selectedComponent ? selectedComponent.name : 'Not selected yet', tone: 'warning' },
        { label: 'Next Step', value: 'Complete component enrollment', tone: 'info' },
      ]}
    >
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
            <p className="text-xs uppercase tracking-[0.16em] font-semibold text-amber-700 mb-2">Enrollment Stage</p>
            <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-slate-100">Choose your NSTP component</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Your selected component determines your specialized modules, activities, and deployment context.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
            <p className="text-xs uppercase tracking-[0.16em] font-semibold text-emerald-700 mb-2">Readiness</p>
            <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-slate-100">General Education completed</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">You can now officially enroll in CWTS, CWTS-Coastguard, CWTS-Sunday, LTS, or MTS.</p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          {hasCompletedGeneralEd && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl mb-4 dark:bg-green-500/15 dark:text-green-100">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">General Education Complete - 25 Hours</span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-slate-900 mb-3 dark:text-slate-100">Select Your NSTP Component</h1>
          <p className="text-slate-600 max-w-2xl mx-auto dark:text-slate-300">
            Choose the National Service Training Program component that aligns with your interests and career goals.
            Each component includes specialized training and community service.
          </p>
        </div>

        {/* Component Cards */}
        <div className="grid grid-cols-1 gap-5 mb-8 md:grid-cols-2 xl:grid-cols-5">
          {NSTP_COMPONENTS.map((component) => {
            const Icon = component.icon;
            const isSelected = selectedComponent?.id === component.id;

            return (
              <article
                key={component.id}
                className={`flex min-h-[28rem] flex-col rounded-2xl border-2 p-5 transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 shadow-lg dark:border-amber-400 dark:bg-amber-500/10'
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-amber-400'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`${component.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{component.name}</h3>
                      {isSelected && <CheckCircle className="w-5 h-5 text-amber-600" />}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{component.fullName}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-700 mb-4 dark:text-slate-300">{component.description}</p>

                <div className="flex-1 space-y-2">
                  {component.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                      {benefit}
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-2">
                  <button type="button" onClick={() => setSelectedComponent(component)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800">
                    <Users className="h-4 w-4" />
                    Learn More
                  </button>
                  <button type="button" onClick={() => { setSelectedComponent(component); onEnroll(component.name); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
                    <Sparkles className="h-4 w-4" />
                    Enter Module
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Enroll Button */}
        {selectedComponent && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1 dark:text-slate-100">
                  Ready to enroll in {selectedComponent.name}?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  You'll get access to all modules, assessments, and learning materials.
                </p>
              </div>
              <button
                onClick={handleEnroll}
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-3 rounded-xl hover:opacity-95 transition-opacity font-medium inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Complete Enrollment
              </button>
            </div>
          </div>
        )}
      </div>
    </RoleShell>
  );
}
