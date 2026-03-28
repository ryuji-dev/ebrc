'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Database, UserPlus } from 'lucide-react';

interface AdminClientProps {
  mode: 'users' | 'reset-password';
}

export function AdminClient({ mode }: AdminClientProps) {
  const [loading, setLoading] = useState(false);

  // 스테이트
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('111111');
  const [role, setRole] = useState<'user' | 'leader' | 'admin'>('user');

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === 'users' ? '/api/admin/provision' : '/api/admin/reset-password';
      const body = mode === 'users'
        ? { email, fullName: name, temporaryPassword: password, role }
        : { email };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      if (resp.ok) {
        alert(mode === 'users' ? `${name} 교우님의 계정이 발급되었습니다.` : `${email} 계정의 비밀번호가 초기화되었습니다.`);
        if (mode === 'users') {
          setEmail('');
          setName('');
        }
      } else {
        alert('처리 중 오류 발생: ' + (data.error || '알 수 없는 에러'));
      }
    } catch (err) {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'reset-password') {
    return (
      <form onSubmit={handleAction} className="space-y-6 font-normal">
        <div className="space-y-2 font-normal">
          <Label htmlFor="reset-email" className="text-xs font-normal text-zinc-500 uppercase tracking-wider ml-1">초기화할 계정 이메일</Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            className="bg-white/5 border-white/10 rounded-2xl h-12 px-5 text-white focus:ring-orange-500/20 focus:border-orange-500/50 transition-all placeholder:text-zinc-700 font-normal"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-lg transition-all flex gap-3 font-normal"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin font-normal" />
          ) : '비밀번호 초기화'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleAction} className="space-y-6 font-normal">
      <div className="space-y-5 font-normal">
        <div className="space-y-2 font-normal">
          <Label htmlFor="email" className="text-xs font-normal text-zinc-500 uppercase tracking-wider ml-1">이메일 주소</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            className="bg-white/5 border-white/10 rounded-2xl h-12 px-5 text-white focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-zinc-700 font-normal"
          />
        </div>
        <div className="space-y-2 font-normal">
          <Label htmlFor="name" className="text-xs font-normal text-zinc-500 uppercase tracking-wider ml-1">교우 이름</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="홍길동"
            className="bg-white/5 border-white/10 rounded-2xl h-12 px-5 text-white focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-zinc-700 font-normal"
          />
        </div>
        <div className="space-y-2 font-normal">
          <Label htmlFor="role" className="text-xs font-normal text-zinc-500 uppercase tracking-wider ml-1">권한 설정</Label>
          <div className="relative">
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-5 text-white focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none cursor-pointer font-normal"
            >
              <option value="user" className="bg-zinc-900">교우 (Member)</option>
              <option value="leader" className="bg-zinc-900">리더 (Leader)</option>
              <option value="admin" className="bg-zinc-900">목사님 (Pastor)</option>
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="space-y-2 font-normal">
          <Label htmlFor="pwd" className="text-xs font-normal text-zinc-500 uppercase tracking-wider ml-1">임시 비밀번호</Label>
          <Input
            id="pwd"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/5 border-white/10 rounded-2xl h-12 px-5 text-white focus:ring-primary/20 focus:border-primary/50 transition-all font-normal"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-lg shadow-lg shadow-primary/20 transition-all flex gap-3 font-normal"
      >
        <UserPlus className="w-5 h-5" />
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : '계정 발급 및 통지'}
      </Button>
      <p className="text-center text-[11px] text-zinc-600 leading-relaxed px-4 font-normal">
        * 임시 비밀번호는 기본적으로 '111111'로 세팅됩니다.<br />
        교우는 첫 로그인 시 비밀번호를 변경해야 합니다.
      </p>
    </form>
  );
}
