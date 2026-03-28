import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { ReadingClient } from "@/components/reading/ReadingClient";

interface ReadingPageProps {
  params: Promise<{ year: string }>;
}

export default async function ReadingPage({ params }: ReadingPageProps) {
  const { year } = await params;
  const parsedYear = parseInt(year);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 사용자의 해당 연도 통독 플랜 가져오기
  const { data: userPlan } = await supabase
    .from("user_reading_plans")
    .select("*, reading_plan_templates(title, description)")
    .eq("user_id", user.id)
    .eq("year", parsedYear)
    .single() as any;

  if (!userPlan) {
    // 아직 배포용 템플릿만 선택하거나 전체 목록을 가져옵니다
    const { data: templates } = await supabase
      .from('reading_plan_templates')
      .select('id, title, description')
      .eq('year', parsedYear) as { data: { id: string, title: string, description: string | null }[] | null };

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl mb-6">{parsedYear}년 성경 통독 플랜</h1>
        <Card>
          <CardHeader>
            <CardTitle>통독 플랜이 없습니다</CardTitle>
            <CardDescription>아래 템플릿 중 하나를 선택하여 통독을 시작해보세요.</CardDescription>
          </CardHeader>
          <CardContent>
            {templates && templates.length > 0 ? (
              <div className="grid gap-4">
                {templates.map(t => (
                  <div key={t.id} className="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                      <h3>{t.title}</h3>
                      <p className="text-sm text-gray-500">{t.description}</p>
                    </div>
                    <ReadingClient mode="create" templateId={t.id} year={parsedYear} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">등록된 성경 통독 템플릿이 없습니다. 관리자에게 문의하세요.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 통독 상세 일정 가져오기
  const { data: templateItems } = await supabase
    .from("reading_plan_template_items")
    .select("*")
    .eq("template_id", userPlan.template_id)
    .order("date", { ascending: true }) as any;

  // 사용자의 완료 기록 가져오기
  const { data: completions } = await supabase
    .from("user_reading_completions")
    .select("date")
    .eq("plan_id", userPlan.id) as any;

  const completedDates = completions?.map((c: any) => c.date) || [];
  const progress = Math.round((completedDates.length / (templateItems?.length || 365)) * 100);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {userPlan.reading_plan_templates.title}
          </h1>
          <p className="text-gray-600 mt-1">{parsedYear}년 통독 여정</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">진행률</p>
            <p className="text-2xl text-primary">{progress}%</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-primary/10 flex items-center justify-center relative">
            <div
              className="absolute inset-0 rounded-full border-4 border-primary"
              style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
            />
            <span className="text-[10px]">{completedDates.length}일</span>
          </div>
        </div>
      </div>

      <ReadingClient
        mode="view"
        planId={userPlan.id}
        items={templateItems || []}
        completedDates={completedDates}
      />
    </div>
  );
}
