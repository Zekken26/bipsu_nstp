import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import type { NstpAccount } from '../../../data/nstpData';
import FacilitatorLayout from '../components/FacilitatorLayout';
import useFacilitatorWorkspace from '../hooks/useFacilitatorWorkspace';
import type { FacilitatorPage } from '../types';
import AssignedStudentsPage from './AssignedStudentsPage';
import AttendancePage from './AttendancePage';
import DashboardOverview from './DashboardOverview';
import FacilitatorAnnouncementsPage from './FacilitatorAnnouncementsPage';
import FacilitatorAssessmentsPage from './FacilitatorAssessmentsPage';
import FacilitatorReportsPage from './FacilitatorReportsPage';
import GradebookPage from './GradebookPage';
import LearningMaterialsPage from './LearningMaterialsPage';
import SubmissionReviewPage from './SubmissionReviewPage';
import FacilitatorActivityLogPage from './FacilitatorActivityLogPage';

const facilitatorPages: FacilitatorPage[] = [
  'dashboard',
  'students',
  'attendance',
  'gradebook',
  'assessments',
  'submissions',
  'learning-materials',
  'reports',
  'announcements',
  'activity-log',
];

const pathFor = (page: FacilitatorPage) => `/facilitator/${page}`;

function pageFromPath(pathname: string): FacilitatorPage {
  const segment = pathname.replace(/^\/facilitator\/?/, '').split('/')[0] as FacilitatorPage;
  return facilitatorPages.includes(segment) ? segment : 'dashboard';
}

export default function FacilitatorDashboard({
  user,
  onLogout,
}: {
  user: NstpAccount;
  onLogout?: () => void;
  onNavigate?: (target: string) => void;
  embedded?: boolean;
}) {
  const [page, setPage] = useState<FacilitatorPage>(() => pageFromPath(window.location.pathname));
  const workspace = useFacilitatorWorkspace(user);

  useEffect(() => {
    const currentPage = pageFromPath(window.location.pathname);
    setPage(currentPage);
    if (window.location.pathname !== pathFor(currentPage)) {
      window.history.replaceState({}, '', pathFor(currentPage));
    }
    const handlePopState = () => setPage(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (target: FacilitatorPage) => {
    setPage(target);
    window.history.pushState({}, '', pathFor(target));
    window.scrollTo({ top: 0 });
  };

  const logout = () => {
    window.history.replaceState({}, '', '/');
    onLogout?.();
  };

  const notify = (message: string) => toast.success(message);

  return (
    <>
      <FacilitatorLayout user={user} page={page} pendingCount={workspace.pending.length} onNavigate={navigate} onLogout={logout}>
        {page === 'dashboard' && <DashboardOverview workspace={workspace} onNavigate={navigate} />}
        {page === 'students' && <AssignedStudentsPage workspace={workspace} notify={notify} />}
        {page === 'attendance' && <AttendancePage workspace={workspace} notify={notify} />}
        {page === 'gradebook' && <GradebookPage workspace={workspace} notify={notify} />}
        {page === 'assessments' && <FacilitatorAssessmentsPage workspace={workspace} />}
        {page === 'submissions' && <SubmissionReviewPage workspace={workspace} notify={notify} />}
        {page === 'learning-materials' && <LearningMaterialsPage workspace={workspace} notify={notify} />}
        {page === 'reports' && <FacilitatorReportsPage workspace={workspace} />}
        {page === 'announcements' && <FacilitatorAnnouncementsPage workspace={workspace} notify={notify} />}
        {page === 'activity-log' && <FacilitatorActivityLogPage workspace={workspace} />}
      </FacilitatorLayout>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
