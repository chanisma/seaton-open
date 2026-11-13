import { useNavigate } from 'react-router-dom';
import { Button } from '@components/common/Button';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">페이지를 찾을 수 없습니다</p>
        <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
      </div>
    </div>
  );
};
