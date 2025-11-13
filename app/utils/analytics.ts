import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';

const useAnalytics = () => {
  const init = () => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
      const sessionReplayTracking = sessionReplayPlugin({
        sampleRate: 1,
      });
      amplitude.add(sessionReplayTracking);
      amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY, undefined, {
        defaultTracking: true,
      });
    }
  };

  const setUserId = (userId: string) => {
    if (typeof window !== 'undefined') {
      amplitude.setUserId(userId);
    }
  };

  const track = (eventName: string, eventProperties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      amplitude.track(eventName, eventProperties);
    }
  };

  return { init, setUserId, track };
};

export default useAnalytics;

