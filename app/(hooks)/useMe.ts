import { paths } from '../../apiDocs';

// type ClientType = paths['/me']['get']['responses']['200']['content']['application/json']['responseObject'];

export const useMe = (options?: { clientInfo?: any }) => {
  const me = options?.clientInfo || null;

  return { me };
};
