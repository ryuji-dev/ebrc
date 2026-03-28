
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, History } from 'lucide-react';
import { AdminClient } from '@/components/admin/AdminClient';

export function AccountManagement() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="glass-dark border-white/5 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl text-white flex items-center gap-3 font-normal">
            <Users className="w-6 h-6 text-primary" />
            계정 발급
          </CardTitle>
          <CardDescription className="text-zinc-500 font-normal">
            새로운 교우의 계정을 생성합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <AdminClient mode="users" />
        </CardContent>
      </Card>

      <Card className="glass-dark border-white/5 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl text-white flex items-center gap-3 font-normal">
            <History className="w-6 h-6 text-orange-500" />
            비밀번호 초기화
          </CardTitle>
          <CardDescription className="text-zinc-500 font-normal">
            비밀번호를 '111111'로 초기화합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <AdminClient mode="reset-password" />
        </CardContent>
      </Card>
    </div>
  );
}
