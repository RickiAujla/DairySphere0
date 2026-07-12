import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorPageProps {
  error?: Error;
  reset?: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const handleReload = () => {
    if (reset) {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 transition-colors duration-200">
      <div className="bg-card border border-border p-8 rounded-lg max-w-md w-full shadow-lg text-center">
        <div className="inline-flex p-3 rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          An Unexpected Error Occurred
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {error?.message || "We encountered a runtime pipeline disruption. The systems have isolated the fault and are prepared to recover safely."}
        </p>
        <button
          onClick={handleReload}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Attempt Service Recovery
        </button>
      </div>
    </div>
  );
}
