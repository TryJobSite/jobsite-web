'use client';

import { useState } from 'react';

export const useIsBusinessCookie = () => {
  const [isBusiness, setIsBusiness] = useState(false);

  const setIsBusinessCookie = (value: boolean) => {
    setIsBusiness(value);
  };

  return {
    isBusiness,
    setIsBusinessCookie,
  };
};

