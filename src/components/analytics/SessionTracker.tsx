import { useInitSession } from "@/hooks/useAnalytics";

// Component that initializes visitor session tracking
export const SessionTracker: React.FC = () => {
  useInitSession();
  return null;
};

export default SessionTracker;
