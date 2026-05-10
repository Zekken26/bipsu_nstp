import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Clock, CheckCircle, FileText, Video, Search, Sparkles, Gauge, ChevronRight, Plus, Trash2, Save, GripVertical, Play, ArrowLeft, ArrowUp, ArrowDown, Copy, Wrench } from 'lucide-react';
import { createEmptyModule, loadAssessments, loadModules, loadStudents, safeJsonParse, saveModules, type NstpModule, type NstpModuleSection } from '../data/nstpData';

const MODULE_VISIBILITY_KEY = 'nstp-module-visibility';

const SECTION_TEMPLATES: Record<string, NstpModuleSection[]> = {
  'Community immersion pack': [
    { id: 'template-prebrief', type: 'lesson', title: 'Community Pre-briefing', duration: '25 min' },
    { id: 'template-fieldwork', type: 'lesson', title: 'Fieldwork Activity', duration: '45 min' },
    { id: 'template-reflection', type: 'reading', title: 'Reflection Journal Guide', duration: '20 min' },
  ],
  'Safety and readiness pack': [
    { id: 'template-safety-video', type: 'video', title: 'Safety Orientation', duration: '18 min' },
    { id: 'template-checklist', type: 'reading', title: 'Preparedness Checklist', duration: '15 min' },
    { id: 'template-drill', type: 'lesson', title: 'Readiness Drill', duration: '30 min' },
  ],
  'Leadership sprint pack': [
    { id: 'template-leadership', type: 'lesson', title: 'Leadership Challenge', duration: '30 min' },
    { id: 'template-teamwork', type: 'video', title: 'Team Dynamics Lab', duration: '20 min' },
    { id: 'template-feedback', type: 'reading', title: 'Peer Feedback Framework', duration: '15 min' },
  ],
};

export default function ModulesPage({ user, role = 'student', onBack }: { user: any; role?: 'student' | 'admin'; onBack?: () => void }) {
  const [modules, setModules] = useState<NstpModule[]>([]);
  const [moduleVisibility, setModuleVisibility] = useState<Record<string, boolean>>({});
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [progress, setProgress] = useState<Record<string, Record<string, boolean>>>({});
  const [editorDraft, setEditorDraft] = useState<NstpModule | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(Object.keys(SECTION_TEMPLATES)[0]);

  useEffect(() => {
    const storedModules = loadModules();
    setModules(storedModules);
    const savedVisibility = safeJsonParse<Record<string, boolean>>(localStorage.getItem(MODULE_VISIBILITY_KEY), {});
    const visibilityDefaults = storedModules.reduce<Record<string, boolean>>((acc, module) => {
      acc[module.id] = savedVisibility[module.id] ?? true;
      return acc;
    }, {});
    setModuleVisibility(visibilityDefaults);
    localStorage.setItem(MODULE_VISIBILITY_KEY, JSON.stringify(visibilityDefaults));
    if (storedModules.length > 0) {
      setSelectedModuleId(storedModules[0].id);
      setEditorDraft(storedModules[0]);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`progress-${user.id}`);
    if (saved) {
      setProgress(safeJsonParse<Record<string, Record<string, boolean>>>(saved, {}));
    }
  }, [user.id]);

  const selectedModule = useMemo(() => modules.find((module) => module.id === selectedModuleId) || null, [modules, selectedModuleId]);
  const isAdmin = role === 'admin';
  const students = useMemo(() => loadStudents(), []);

  useEffect(() => {
    if (selectedModule) {
      setEditorDraft(selectedModule);
    }
  }, [selectedModule]);

  const persistModules = (nextModules: NstpModule[]) => {
    setModules(nextModules);
    saveModules(nextModules);
    setModuleVisibility((current) => {
      const nextVisibility = nextModules.reduce<Record<string, boolean>>((acc, module) => {
        acc[module.id] = current[module.id] ?? true;
        return acc;
      }, {});
      localStorage.setItem(MODULE_VISIBILITY_KEY, JSON.stringify(nextVisibility));
      return nextVisibility;
    });
    if (selectedModuleId && !nextModules.some((module) => module.id === selectedModuleId)) {
      setSelectedModuleId(nextModules[0]?.id || null);
    }
  };

  const persistModuleVisibility = (nextVisibility: Record<string, boolean>) => {
    setModuleVisibility(nextVisibility);
    localStorage.setItem(MODULE_VISIBILITY_KEY, JSON.stringify(nextVisibility));
  };

  const completeSection = (moduleId: string, sectionId: string) => {
    const nextProgress = {
      ...progress,
      [moduleId]: {
        ...(progress[moduleId] || {}),
        [sectionId]: true,
      },
    };
    setProgress(nextProgress);
    localStorage.setItem(`progress-${user.id}`, JSON.stringify(nextProgress));
  };

  const getModuleProgress = (module: NstpModule) => {
    const completed = module.sections.filter((section) => Boolean(progress[module.id]?.[section.id])).length;
    return module.sections.length > 0 ? Math.round((completed / module.sections.length) * 100) : 0;
  };

  const isModuleUnlocked = (moduleList: NstpModule[], moduleIndex: number) => {
    if (moduleIndex === 0) return true;
    const previousModule = moduleList[moduleIndex - 1];
    return previousModule ? getModuleProgress(previousModule) === 100 : true;
  };

  const commonModules = modules.filter((module) => (module.component || 'Common') === 'Common');
  const totalHours = commonModules.reduce((accumulator, module) => accumulator + (getModuleProgress(module) === 100 ? module.hours : 0), 0);
  const plannedCommonHours = commonModules.reduce((accumulator, module) => accumulator + module.hours, 0);
  const assessments = loadAssessments();
  const publishedAssessments = assessments.filter((assessment) => assessment.status === 'published');
  const modulesWithPublishedTests = commonModules.filter((module) =>
    publishedAssessments.some((assessment) => assessment.moduleId === module.id && assessment.type !== 'exam')
  ).length;
  const hasMajorExam = publishedAssessments.some((assessment) => assessment.type === 'exam');
  const complianceReady = plannedCommonHours >= 25 && modulesWithPublishedTests >= commonModules.length && hasMajorExam;
  const completedModulesCount = commonModules.filter((module) => getModuleProgress(module) === 100).length;
  const overallProgress = commonModules.length > 0 ? Math.round((totalHours / Math.max(1, plannedCommonHours)) * 100) : 0;
  const publishedModules = modules.filter((module) => moduleVisibility[module.id] ?? true);
  const draftModules = modules.filter((module) => !(moduleVisibility[module.id] ?? true));
  const moduleCompletionRate = useMemo(() => {
    if (!selectedModule || students.length === 0) return 0;
    const completed = students.reduce((count, student) => {
      const raw = localStorage.getItem(`progress-${student.id}`);
      if (!raw) return count;
      const savedProgress = safeJsonParse<Record<string, Record<string, boolean>>>(raw, {});
      const sectionProgress = savedProgress[selectedModule.id] || {};
      const doneSections = Object.values(sectionProgress).filter(Boolean).length;
      const pct = selectedModule.sections.length > 0 ? Math.round((doneSections / selectedModule.sections.length) * 100) : 0;
      return count + (pct === 100 ? 1 : 0);
    }, 0);
    return Math.round((completed / students.length) * 100);
  }, [selectedModule, students]);

  const studentComponent = user.component || user.preferredComponent || 'Common';
  const studentVisibleModules = isAdmin
    ? modules
    : modules.filter((module) => {
      const published = moduleVisibility[module.id] ?? true;
      const moduleComponent = module.component || 'Common';
      return published && (moduleComponent === 'Common' || moduleComponent === studentComponent);
    });
  const nextRecommendedModule = studentVisibleModules.find((module, index) => isModuleUnlocked(studentVisibleModules, index) && getModuleProgress(module) < 100) || studentVisibleModules[0] || null;

  useEffect(() => {
    if (isAdmin) return;
    if (studentVisibleModules.length === 0) {
      setSelectedModuleId(null);
      return;
    }
    if (!selectedModuleId || !studentVisibleModules.some((module) => module.id === selectedModuleId)) {
      setSelectedModuleId(studentVisibleModules[0].id);
    }
  }, [isAdmin, selectedModuleId, studentVisibleModules]);

  const visibleModules = studentVisibleModules.filter((module) => {
    const text = `${module.title} ${module.description}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || module.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  useEffect(() => {
    if (visibleModules.length === 0) {
      setSelectedModuleId(null);
      if (isAdmin) setEditorDraft(null);
      return;
    }

    if (!selectedModuleId || !visibleModules.some((module) => module.id === selectedModuleId)) {
      setSelectedModuleId(visibleModules[0].id);
      if (isAdmin) {
        setEditorDraft(visibleModules[0]);
      }
    }
  }, [visibleModules, selectedModuleId, isAdmin]);

  const getDifficultyClass = (difficulty: string) => {
    if (difficulty === 'Beginner') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (difficulty === 'Intermediate') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  const updateDraft = (patch: Partial<NstpModule>) => {
    if (!editorDraft) return;
    setEditorDraft({ ...editorDraft, ...patch, updatedAt: new Date().toISOString() });
  };

  const updateSection = (sectionId: string, patch: Partial<NstpModuleSection>) => {
    if (!editorDraft) return;
    setEditorDraft({
      ...editorDraft,
      updatedAt: new Date().toISOString(),
      sections: editorDraft.sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)),
    });
  };

  const addSection = () => {
    if (!editorDraft) return;
    setEditorDraft({
      ...editorDraft,
      updatedAt: new Date().toISOString(),
      sections: [
        ...editorDraft.sections,
        { id: `section-${Math.random().toString(36).slice(2, 10)}`, type: 'lesson', title: 'New section', duration: '20 min' },
      ],
    });
  };

  const removeSection = (sectionId: string) => {
    if (!editorDraft) return;
    setEditorDraft({
      ...editorDraft,
      updatedAt: new Date().toISOString(),
      sections: editorDraft.sections.filter((section) => section.id !== sectionId),
    });
  };

  const saveDraft = () => {
    if (!editorDraft) return;
    const nextModule = { ...editorDraft, updatedAt: new Date().toISOString() };
    const existingIndex = modules.findIndex((module) => module.id === nextModule.id);
    const nextModules = existingIndex >= 0
      ? modules.map((module) => (module.id === nextModule.id ? nextModule : module))
      : [nextModule, ...modules];
    persistModules(nextModules);
    setSelectedModuleId(nextModule.id);
  };

  const deleteModule = () => {
    if (!editorDraft) return;
    const nextModules = modules.filter((module) => module.id !== editorDraft.id);
    persistModules(nextModules);
    if (nextModules[0]) {
      setSelectedModuleId(nextModules[0].id);
      setEditorDraft(nextModules[0]);
    } else {
      setSelectedModuleId(null);
      setEditorDraft(null);
    }
  };

  const createModule = () => {
    const nextModule = createEmptyModule();
    const nextModules = [nextModule, ...modules];
    persistModules(nextModules);
    setSelectedModuleId(nextModule.id);
    setEditorDraft(nextModule);
  };

  const togglePublishModule = (moduleId: string) => {
    const nextVisibility = {
      ...moduleVisibility,
      [moduleId]: !(moduleVisibility[moduleId] ?? true),
    };
    persistModuleVisibility(nextVisibility);
  };

  const bulkSetPublishState = (publish: boolean) => {
    const nextVisibility = modules.reduce<Record<string, boolean>>((acc, module) => {
      acc[module.id] = publish;
      return acc;
    }, {});
    persistModuleVisibility(nextVisibility);
  };

  const moveModule = (direction: 'up' | 'down') => {
    if (!editorDraft) return;
    const index = modules.findIndex((module) => module.id === editorDraft.id);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;
    const reordered = [...modules];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);
    persistModules(reordered);
  };

  const cloneModule = () => {
    if (!editorDraft) return;
    const cloned: NstpModule = {
      ...editorDraft,
      id: `module-${Math.random().toString(36).slice(2, 10)}`,
      title: `${editorDraft.title} (Copy)`,
      sections: editorDraft.sections.map((section) => ({
        ...section,
        id: `section-${Math.random().toString(36).slice(2, 10)}`,
      })),
      updatedAt: new Date().toISOString(),
    };
    const nextModules = [cloned, ...modules];
    persistModules(nextModules);
    setSelectedModuleId(cloned.id);
    setEditorDraft(cloned);
  };

  const addTemplateSections = () => {
    if (!editorDraft) return;
    const templateSections = SECTION_TEMPLATES[selectedTemplate] || [];
    const nextSections = templateSections.map((section) => ({
      ...section,
      id: `section-${Math.random().toString(36).slice(2, 10)}`,
    }));
    setEditorDraft({
      ...editorDraft,
      updatedAt: new Date().toISOString(),
      sections: [...editorDraft.sections, ...nextSections],
    });
  };

  if (!selectedModule && !isAdmin) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="font-semibold text-slate-900 mb-2">No modules available yet.</p>
        <p className="text-sm text-slate-600">Check back after the coordinator publishes the module library.</p>
      </div>
    );
  }

  const detailModule = editorDraft && isAdmin ? editorDraft : selectedModule;
  const navigationModules = visibleModules;
  const detailModuleIndex = detailModule ? navigationModules.findIndex((module) => module.id === detailModule.id) : -1;
  const previousModule = detailModuleIndex > 0 ? navigationModules[detailModuleIndex - 1] : null;
  const nextModule = detailModuleIndex >= 0 && detailModuleIndex < navigationModules.length - 1 ? navigationModules[detailModuleIndex + 1] : null;

  const openModule = (moduleId: string) => {
    const target = modules.find((module) => module.id === moduleId);
    if (!target) return;
    setSelectedModuleId(moduleId);
    if (isAdmin) {
      setEditorDraft(target);
    }
  };

  return (
    <div className="bento-screen grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="bento-panel p-5">
          {onBack && (
            <button
              onClick={onBack}
              className="module-btn clickable-button mb-4 px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          )}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] font-semibold text-blue-700">Module Library</p>
              <h2 className="text-xl font-bold text-slate-900">{isAdmin ? 'Manage modules' : 'Your learning path'}</h2>
            </div>
            {isAdmin && (
              <button
                onClick={createModule}
                className="module-btn-primary clickable-button px-3 py-2"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            )}
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search modules"
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div className="grid gap-3">
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            >
              <option value="all">All difficulty</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Module selection</p>
              <select
                value={detailModule?.id || ''}
                onChange={(event) => openModule(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                disabled={visibleModules.length === 0}
              >
                {visibleModules.length === 0 && <option value="">No modules match current filters</option>}
                {visibleModules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title} • {getModuleProgress(module)}%
                  </option>
                ))}
              </select>
            </div>

            {detailModule && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">{detailModule.title}</p>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getDifficultyClass(detailModule.difficulty)}`}>
                    {detailModule.difficulty}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-slate-600">{detailModule.description}</p>
                <div className="mt-3 rounded-full bg-slate-100 h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-gradient-to-r from-blue-700 to-yellow-500" style={{ width: `${getModuleProgress(detailModule)}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{detailModule.sections.length} sections</span>
                  <span>{getModuleProgress(detailModule)}% complete</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="bento-panel p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Compliance</p>
            <p className={`mt-1 text-2xl font-bold ${complianceReady ? 'text-emerald-600' : 'text-amber-600'}`}>
              {complianceReady ? 'Ready' : 'Review'}
            </p>
            <p className="mt-1 text-xs text-slate-600">{plannedCommonHours}/25 common hours, {modulesWithPublishedTests}/{commonModules.length} post-tests, {hasMajorExam ? 'major exam set' : 'major exam missing'}</p>
          </div>
          <div className="bento-panel p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Visible modules</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{visibleModules.length}</p>
          </div>
          <div className="bento-panel p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Completed modules</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{completedModulesCount}</p>
          </div>
          <div className="bento-panel p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Overall progress</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{overallProgress}%</p>
            {nextRecommendedModule && (
              <p className="mt-1 text-xs text-slate-600 line-clamp-1">Next: {nextRecommendedModule.title}</p>
            )}
          </div>
          {isAdmin && (
            <div className="bento-panel p-4 sm:col-span-3 xl:col-span-1">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Library Map</p>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">{publishedModules.length} live</span>
              </div>
              <div className="max-h-[34rem] space-y-2 overflow-auto pr-1">
                {visibleModules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => openModule(module.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                      detailModule?.id === module.id ? 'border-blue-300 bg-blue-50 text-blue-950' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{module.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${(moduleVisibility[module.id] ?? true) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {(moduleVisibility[module.id] ?? true) ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{module.hours} hrs</span>
                      <span>{module.sections.length} sections</span>
                      <span>{module.component || 'Common'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <section className="bento-scroll space-y-4">
        {!detailModule ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900 mb-2">Select a module</p>
            <p className="text-sm text-slate-600">Open any module card to start learning or editing.</p>
          </div>
        ) : isAdmin ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-700" />
                  <p className="text-xs uppercase tracking-[0.14em] font-semibold text-blue-700">Module Operations</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Published</p>
                    <p className="text-xl font-bold text-slate-900">{publishedModules.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Draft</p>
                    <p className="text-xl font-bold text-slate-900">{draftModules.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Learner completion</p>
                    <p className="text-xl font-bold text-slate-900">{moduleCompletionRate}%</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Sections</p>
                    <p className="text-xl font-bold text-slate-900">{detailModule.sections.length}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => togglePublishModule(detailModule.id)}
                    className="module-btn clickable-button px-3 py-2"
                  >
                    {moduleVisibility[detailModule.id] ?? true ? 'Unpublish module' : 'Publish module'}
                  </button>
                  <button
                    onClick={() => bulkSetPublishState(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    Publish all
                  </button>
                  <button
                    onClick={() => bulkSetPublishState(false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                  >
                    Set all to draft
                  </button>
                  <button
                    onClick={cloneModule}
                    className="module-btn clickable-button px-3 py-2"
                  >
                    <Copy className="w-4 h-4" />
                    Clone module
                  </button>
                  <button
                    onClick={() => moveModule('up')}
                    className="module-btn clickable-button px-3 py-2"
                  >
                    <ArrowUp className="w-4 h-4" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveModule('down')}
                    className="module-btn clickable-button px-3 py-2"
                  >
                    <ArrowDown className="w-4 h-4" />
                    Move down
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] font-semibold text-blue-700">Module Editor</p>
                  <h2 className="text-2xl font-bold text-slate-900">Edit module content</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveDraft}
                    className="module-btn-primary clickable-button"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={deleteModule}
                    className="module-btn clickable-button border-rose-300 text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    value={detailModule.title}
                    onChange={(event) => updateDraft({ title: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Hours</label>
                  <input
                    type="number"
                    value={detailModule.hours}
                    onChange={(event) => updateDraft({ hours: Number(event.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={detailModule.description}
                    onChange={(event) => updateDraft({ description: event.target.value })}
                    className="w-full min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                  <select
                    value={detailModule.difficulty}
                    onChange={(event) => updateDraft({ difficulty: event.target.value as NstpModule['difficulty'] })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] font-semibold text-blue-700">Sections</p>
                  <h3 className="text-xl font-bold text-slate-900">Manage module sections</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedTemplate}
                    onChange={(event) => setSelectedTemplate(event.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  >
                    {Object.keys(SECTION_TEMPLATES).map((templateName) => (
                      <option key={templateName} value={templateName}>{templateName}</option>
                    ))}
                  </select>
                  <button
                    onClick={addTemplateSections}
                    className="module-btn clickable-button"
                  >
                    <Plus className="w-4 h-4" />
                    Apply Template
                  </button>
                  <button
                    onClick={addSection}
                    className="module-btn clickable-button"
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {detailModule.sections.map((section, index) => (
                  <div key={section.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-slate-400 mt-3" />
                      <div className="flex-1 grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_120px_64px]">
                        <select
                          value={section.type}
                          onChange={(event) => updateSection(section.id, { type: event.target.value as NstpModuleSection['type'] })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        >
                          <option value="video">Video</option>
                          <option value="reading">Reading</option>
                          <option value="lesson">Lesson</option>
                        </select>
                        <input
                          value={section.title}
                          onChange={(event) => updateSection(section.id, { title: event.target.value })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                          placeholder="Section title"
                        />
                        <input
                          value={section.duration}
                          onChange={(event) => updateSection(section.id, { duration: event.target.value })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                          placeholder="20 min"
                        />
                        <button
                          onClick={() => removeSection(section.id)}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-rose-700 hover:bg-rose-50 transition-colors"
                          aria-label={`Remove section ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {!isAdmin && draftModules.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {draftModules.length} module(s) are currently in draft and hidden by the administrator.
              </div>
            )}
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700">
                  {detailModule.component || 'Common'}
                </span>
                {detailModule.courseCode && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-cyan-200 bg-cyan-50 text-xs font-semibold text-cyan-700">
                    {detailModule.courseCode}
                  </span>
                )}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getDifficultyClass(detailModule.difficulty)}`}>
                  <Gauge className="w-3 h-3 mr-1" />
                  {detailModule.difficulty}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  NSTP Learning Track
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{detailModule.title}</h1>
              <p className="text-slate-600 mb-4">{detailModule.description}</p>
              {(detailModule.schoolYear || detailModule.semester || detailModule.sourceDocument) && (
                <div className="mb-4 grid gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-950 sm:grid-cols-3">
                  <span><strong>School year:</strong> {detailModule.schoolYear || 'Unspecified'}</span>
                  <span><strong>Semester:</strong> {detailModule.semester || 'Unspecified'}</span>
                  <span><strong>Source:</strong> {detailModule.sourceDocument || 'System module'}</span>
                </div>
              )}
              {detailModule.outcomes && detailModule.outcomes.length > 0 && (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Official course outcomes</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {detailModule.outcomes.map((outcome) => (
                      <div key={outcome} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{outcome}</div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {detailModule.hours} hours
                  </span>
                  <span>{detailModule.sections.length} sections</span>
                  <span>{getModuleProgress(detailModule)}% complete</span>
                  <span>
                    {publishedAssessments.some((assessment) => assessment.moduleId === detailModule.id && assessment.type !== 'exam') ? 'Post-test available' : 'Post-test not published'}
                  </span>
                </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => previousModule && openModule(previousModule.id)}
                  disabled={!previousModule}
                  className="module-btn clickable-button py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous Module
                </button>
                <button
                  onClick={() => nextModule && openModule(nextModule.id)}
                  disabled={!nextModule}
                  className="module-btn clickable-button py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Module
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {detailModule.sections.map((section) => {
                const isCompleted = Boolean(progress[detailModule.id]?.[section.id]);
                const Icon = section.type === 'video' ? Video : section.type === 'reading' ? BookOpen : FileText;

                return (
                  <div key={section.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-slate-100'}`}>
                          <Icon className={`w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-slate-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-1">{section.title}</h3>
                          <p className="text-sm text-slate-600">{section.duration}</p>
                        </div>
                      </div>
                      {isCompleted && <CheckCircle className="w-6 h-6 text-green-600" />}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      <p className="text-sm text-slate-600 mb-3">
                        {section.type === 'video' && 'Watch the instructional video to learn about this topic.'}
                        {section.type === 'reading' && 'Read the learning materials and documentation provided.'}
                        {section.type === 'lesson' && 'Complete the interactive lesson and activities.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-700">Interactive learning content</span>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => completeSection(detailModule.id, section.id)}
                        className="module-btn-primary clickable-button px-6"
                      >
                        Mark as Complete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
