import { BProgress } from '@bprogress/core';
import { useRouter } from '@bprogress/next';
import { useRouter as useNextRouter, usePathname } from 'next/navigation';

const useAppRouter = () => {
  const nextRouter = useNextRouter();
  const progressBarRouter = useRouter();
  const pathName = usePathname();
  const updateSearchParam = ({
    newParams,
    shallow = true,
    replace = false,
    showProgressBar = true,
  }: {
    newParams: Record<string, string | number>;
    shallow?: boolean;
    replace?: boolean;
    showProgressBar?: boolean;
  }) => {
    //@ts-expect-error ignore
    const params = new URLSearchParams(newParams);

    const search = `?${params.toString()}`;
    if (replace) {
      if (!shallow) {
        progressBarRouter.replace(pathName + search, { showProgress: showProgressBar });
      }
      window.history.replaceState(null, '', search);
    } else {
      if (!shallow) {
        progressBarRouter.push(pathName + search, { showProgress: showProgressBar });
      }
      window.history.replaceState(null, '', search);
    }
  };
  return { ...nextRouter, ...progressBarRouter, updateSearchParam, stopProgress: BProgress.done };
};

export default useAppRouter;
