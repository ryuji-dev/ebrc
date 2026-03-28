'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(`${userName} 교우님의 계정을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 데이터가 삭제됩니다.`)) {
            return;
        }

        setLoading(true);
        try {
            const resp = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            const data = await resp.json();

            if (resp.ok) {
                alert('계정이 성공적으로 삭제되었습니다.');
                router.refresh();
            } else {
                alert('삭제 오류: ' + (data.error || '알 수 없는 에러'));
            }
        } catch (err) {
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
            className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
            title="계정 삭제"
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </Button>
    );
}
