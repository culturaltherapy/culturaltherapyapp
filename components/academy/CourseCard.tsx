import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { AcademyCourse } from "@/lib/academy/foundations";

/**
 * One card in the /academy course grid. Clicking it routes to the
 * in-app course detail page (which then links out to Teachable per lesson).
 */
export function CourseCard({ course }: { course: AcademyCourse }) {
  const moduleCount = course.modules.length;
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <Link
      href={`/academy/${course.id}`}
      className="surface p-5 sm:p-6 block hover:shadow-soft transition group"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">Course</p>
        {course.inProgress && (
          <span className="rounded-pill bg-ochre/15 border border-ochre/40 text-ink2 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider">
            In progress
          </span>
        )}
      </div>

      <h3 className="font-display text-2xl mt-2 leading-tight">{course.title}</h3>
      <p className="text-ink2 mt-2 text-[15px] leading-relaxed">{course.blurb}</p>

      <div className="mt-4 flex items-center gap-3 text-xs text-ink3 font-mono uppercase tracking-wider">
        {course.estimatedHours != null && <span>≈ {course.estimatedHours} h</span>}
        {moduleCount > 0 && (
          <span>
            {moduleCount} module{moduleCount === 1 ? "" : "s"}
            {lessonCount > 0 ? ` · ${lessonCount} lesson${lessonCount === 1 ? "" : "s"}` : ""}
          </span>
        )}
      </div>

      <p className="mt-4 inline-flex items-center gap-1.5 text-terracotta text-sm font-medium group-hover:underline">
        Open course <Icon name="arrow" size={14} />
      </p>
    </Link>
  );
}
