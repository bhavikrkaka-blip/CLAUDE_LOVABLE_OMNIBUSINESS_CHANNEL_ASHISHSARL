import React, { useCallback } from "react";
import { useTrackClick } from "@/hooks/useAnalytics";

interface ClickTrackerProps {
  children: React.ReactNode;
  elementId: string;
  elementType: "button" | "link" | "banner" | "product" | "category" | "navigation";
  elementLabel?: string;
  className?: string;
  onClick?: () => void;
}

export const ClickTracker: React.FC<ClickTrackerProps> = ({
  children,
  elementId,
  elementType,
  elementLabel,
  className,
  onClick,
}) => {
  const trackClick = useTrackClick();

  const handleClick = useCallback(() => {
    trackClick.mutate({
      elementId,
      elementType,
      elementLabel,
    });
    onClick?.();
  }, [elementId, elementType, elementLabel, onClick, trackClick]);

  return (
    <div className={className} onClick={handleClick}>
      {children}
    </div>
  );
};

// HOC version for wrapping existing components
export function withClickTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  trackingProps: {
    elementId: string;
    elementType: ClickTrackerProps["elementType"];
    elementLabel?: string;
  }
) {
  return function TrackedComponent(props: P & { onClick?: () => void }) {
    const trackClick = useTrackClick();

    const handleClick = () => {
      trackClick.mutate({
        elementId: trackingProps.elementId,
        elementType: trackingProps.elementType,
        elementLabel: trackingProps.elementLabel,
      });
      props.onClick?.();
    };

    return <WrappedComponent {...props} onClick={handleClick} />;
  };
}

export default ClickTracker;
