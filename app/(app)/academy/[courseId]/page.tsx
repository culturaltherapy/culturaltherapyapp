import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Dwennimmen } from "@/components/motifs/Motifs";
import { getAcademyCourse, type AcademyLesson, type AcademyModule } from "@/lib/academy/foundations";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = getAcademyCourse(courseId);
  if (!course) return notFound();

  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/academy" className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
        <Icon name="arrowLeft" size={14} /> Back to Academy
      </Link>

      {/* Header */}
      <section className="mt-3 surface p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 opacity-10 text-terracotta">
          <Dwennimmen size={240} />
        </div>
        <div className="relative">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="eyebrow">Peer Support Academy</p>
            {course.inProgress && (
              <span className="rounded-pill bg-ochre/15 border border-ochre/40 text-ink2 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                In progress
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight max-w-[22ch]">
            {course.title}
          </h1>
          <p className="text-ink2 mt-3 max-w-prose text-[15px] leading-relaxed">
            {course.blurb}
          </p>

          <div className="mt-4 flex items-center gap-3 text-xs text-ink3 font-mono uppercase tracking-wider">
            {course.estimatedHours != null && <span>≈ {course.estimatedHours} h</span>}
            {totalLessons > 0 && (
              <span>
                {course.modules.length} module{course.modules.length === 1 ? "" : "s"} · {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="mt-5">
            <a href={course.teachableUrl} target="_blank" rel="noopener noreferrer">
              <Button>
                Open on Teachable <Icon name="arrow" size={14} />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Modules + lessons, or empty-state */}
      {totalLessons === 0 ? (
        <section className="mt-6 surface p-6 sm:p-8 text-center">
          <p className="text-ink2 text-[15px] leading-relaxed max-w-md mx-auto">
            We're still building this. Modules will appear here as they go up
            on Teachable. In the meantime you can open the in-progress
            version on Teachable using the button above.
          </p>
        </section>
      ) : (
        <section className="mt-6 space-y-5">
          {course.modules.map((mod, mIdx) => (
            <ModuleBlock
              key={mod.id}
              ordinal={mIdx + 1}
              module={mod}
              fallbackUrl={course.teachableUrl}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function ModuleBlock({
  ordinal,
  module: mod,
  fallbackUrl,
}: {
  ordinal: number;
  module: AcademyModule;
  fallbackUrl: string;
}) {
  return (
    <article className="surface p-5 sm:p-6">
      <header className="flex items-baseline gap-3">
        <span className="text-ink3 text-xs font-mono tracking-wider">
          MODULE {ordinal}
        </span>
        <h2 className="font-display text-2xl leading-tight">{mod.title}</h2>
      </header>

      <ol className="mt-4 divide-y divide-line">
        {mod.lessons.map((lesson, lIdx) => (
          <LessonRow
            key={lesson.id}
            ordinal={lIdx + 1}
            lesson={lesson}
            fallbackUrl={fallbackUrl}
          />
        ))}
      </ol>
    </article>
  );
}

function LessonRow({
  ordinal,
  lesson,
  fallbackUrl,
}: {
  ordinal: number;
  lesson: AcademyLesson;
  fallbackUrl: string;
}) {
  const href = lesson.teachableUrl ?? fallbackUrl;
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 py-3 hover:bg-ink/[.02] -mx-2 px-2 rounded-md transition group"
      >
        <span className="mt-0.5 inline-flex items-center justify-center h-7 w-7 rounded-full bg-line text-ink3 text-xs font-mono shrink-0">
          {ordinal}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="text-[15px] text-ink group-hover:text-terracotta transition">
              {lesson.title}
            </p>
            {lesson.durationMin != null && (
              <span className="text-[11px] text-ink3 font-mono whitespace-nowrap">
                {lesson.durationMin} min
              </span>
            )}
          </div>
          {lesson.blurb && (
            <p className="text-sm text-ink2 mt-0.5 leading-snug">{lesson.blurb}</p>
          )}
        </div>
        <Icon name="arrow" size={14} className="mt-2 text-ink3 shrink-0" />
      </a>
    </li>
  );
}
