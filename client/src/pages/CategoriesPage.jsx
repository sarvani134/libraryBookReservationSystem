import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useResource } from '../hooks/useResource';
import { ErrorState, Skeleton } from '../components/UI';
export default function CategoriesPage() {
  const { config, configError, reloadConfig } = useLibrary();
  const stats = useResource('/stats');
  if (configError)
    return (
      <div className="page">
        <ErrorState message={configError} retry={reloadConfig} />
      </div>
    );
  if (!config)
    return (
      <div className="page">
        <Skeleton count={6} />
      </div>
    );
  return (
    <div className="page">
      <div className="page-heading">
        <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
        <h1>Browse by B.Tech subject.</h1>
        <p>From first principles to your final-year project.</p>
      </div>
      <div className="category-grid">
        {config?.subjects.map((s) => (
          <Link
            key={s.name}
            className="category-card"
            to={`/books?subject=${encodeURIComponent(s.name)}`}
          >
            <BookOpen size={22} />
            <span className="small muted">
              {s.code} · {s.semester ? `Semester ${s.semester}` : s.semesterLabel}
            </span>
            <h3>
              {s.name}
              <ArrowUpRight size={17} />
            </h3>
            <p>{s.categoryName || 'Category not specified'}</p>
            <strong>{stats.data?.subjectCounts[s.name] || 0} titles</strong>
          </Link>
        ))}
      </div>
      <div className="section-heading">
        <h2>Explore by semester</h2>
      </div>
      <div className="semester-grid light">
        {config?.semesters.map((s) => (
          <Link key={s.number} to={`/books?semester=${s.number}`}>
            <span>
              0{s.number}
              <ArrowUpRight size={18} />
            </span>
            <h3>Semester {s.number}</h3>
            <p>{s.subjects.join(' · ') || 'Courses not specified in the supplied list.'}</p>
          </Link>
        ))}
      </div>
      <p className="curriculum-note">
        {config?.curriculumNote}{' '}
        <a href={config?.curriculumSource} target="_blank" rel="noreferrer">
          Official college syllabus ↗
        </a>
      </p>
    </div>
  );
}
