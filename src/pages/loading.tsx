import { Loader2 } from 'lucide-react';
import { APP_METADATA } from '../common/constants';

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-200">
      <div className="flex flex-col items-center max-w-sm text-center px-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold tracking-tight mb-2 font-sans">
          Loading {APP_METADATA.title}...
        </h2>
        <p className="text-sm text-muted-foreground font-sans">
          Synchronizing enterprise database states, initializing multi-tenant profiles, and preparing secure connections.
        </p>
      </div>
    </div>
  );
}
