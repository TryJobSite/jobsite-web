'use client';

import { CreateCustomerButton } from './create-customer-button';

// This component will be used by the layout
// The page will set up a global handler via window events or a simpler pattern
export function CustomersHeaderAction() {
  const handleClick = () => {
    // Dispatch a custom event that the page can listen to
    window.dispatchEvent(new CustomEvent('openCreateCustomerDialog'));
  };

  return <CreateCustomerButton onClick={handleClick} />;
}
