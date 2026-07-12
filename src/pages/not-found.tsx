import { Compass, MoveLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 transition-colors duration-200">
      <div className="text-center max-w-md">
        <div className="inline-flex p-3 rounded-full bg-accent text-accent-foreground mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-bold tracking-tight mb-3">Resource Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The requested path is not mapped to any known service node or multi-tenant route. Please verify the URL or return to safety.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          <MoveLeft className="w-4 h-4" />
          Return to Dashboard Core
        </button>
      </div>
    </div>
  );
}
