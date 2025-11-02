import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@mono/ui";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export function StudentDashboard() {
  const navigate = useNavigate();

  // Fetch lessons accessible to this student
  const { data: lessons = [] } = useQuery(
    convexQuery(api.lessons.getStudentLessons, {}),
  );

  return (
    <div className="space-y-8">
      {/* Lessons Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">My Lessons</h2>
          <p className="text-sm text-muted-foreground">
            Lessons shared with you by your teachers
          </p>
        </div>

        {lessons.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No lessons available yet. Your teacher will share lessons with
              you!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => (
              <Card
                key={lesson._id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate({ to: `/lesson/${lesson._id}` })}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-1">{lesson.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    by {lesson.teacherDisplayName}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                    {lesson.description || "No description"}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Shared {new Date(lesson.sharedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
