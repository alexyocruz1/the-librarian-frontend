// User-friendly error messages for different scenarios

export const getErrorMessage = (error: any): string => {
  // Network/CORS errors
  if (!error.response) {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return 'Unable to connect to the server. The server might be starting up. Please wait a moment and try again.';
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. The server is taking longer than usual to respond. Please try again.';
    }
    if (error.message?.includes('CORS')) {
      return 'Connection blocked. Please try refreshing the page or contact support.';
    }
    return 'Something went wrong. Please try again later.';
  }

  const status = error.response?.status;
  const errorData = error.response?.data;

  // Handle validation errors with details
  if (errorData?.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
    return errorData.details[0].msg || errorData.error || 'Validation failed';
  }

  // Handle specific error messages from the API
  if (errorData?.error) {
    return errorData.error;
  }

  // Handle HTTP status codes
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Invalid email or password. Please try again.';
    case 403:
      return 'Access denied. Your account may be pending approval or suspended.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This email is already registered. Please use a different email or try logging in.';
    case 422:
      return 'Please check your input and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later or contact support.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'Something went wrong. Please try again later.';
  }
};

export const getSuccessMessage = (action: string): string => {
  switch (action) {
    case 'login':
      return 'Welcome back! You have been successfully logged in.';
    case 'register':
      return 'Account created successfully! Please wait for admin approval.';
    case 'logout':
      return 'You have been successfully logged out.';
    case 'profile_update':
      return 'Your profile has been updated successfully.';
    case 'password_change':
      return 'Your password has been changed successfully.';
    
    // User Management
    case 'user_created':
      return 'User created successfully.';
    case 'user_updated':
      return 'User updated successfully.';
    case 'user_deleted':
      return 'User deleted successfully.';
    case 'user_approved':
      return 'User approved successfully.';
    case 'user_rejected':
      return 'User rejected successfully.';
    
    // Library Management
    case 'library_created':
      return 'Library created successfully.';
    case 'library_updated':
      return 'Library updated successfully.';
    case 'library_deleted':
      return 'Library deleted successfully.';
    case 'admin_assigned':
      return 'Admin assigned to library successfully.';
    case 'admin_removed':
      return 'Admin removed from library successfully.';
    
    // Book Management
    case 'book_created':
      return 'Book added successfully.';
    case 'book_updated':
      return 'Book updated successfully.';
    case 'book_deleted':
      return 'Book deleted successfully.';
    case 'copy_created':
      return 'Book copy added successfully.';
    case 'copy_updated':
      return 'Book copy updated successfully.';
    case 'copy_deleted':
      return 'Book copy deleted successfully.';
    case 'barcode_generated':
      return 'Barcode generated successfully.';
    
    // Borrowing System
    case 'request_created':
      return 'Borrow request submitted successfully.';
    case 'request_approved':
      return 'Borrow request approved successfully.';
    case 'request_rejected':
      return 'Borrow request rejected successfully.';
    case 'request_cancelled':
      return 'Borrow request cancelled successfully.';
    case 'book_returned':
      return 'Book returned successfully.';
    
    // CSV Operations
    case 'csv_imported':
      return 'Books imported successfully.';
    case 'csv_exported':
      return 'Books exported successfully.';
    case 'template_downloaded':
      return 'CSV template downloaded successfully.';
    
    // Reports
    case 'report_generated':
      return 'Report generated successfully.';
    case 'report_exported':
      return 'Report exported successfully.';
    
    default:
      return 'Operation completed successfully.';
  }
};

export const getInfoMessage = (action: string): string => {
  switch (action) {
    case 'pending_approval':
      return 'Your account is pending approval. You will be notified once it\'s approved.';
    case 'account_suspended':
      return 'Your account has been suspended. Please contact an administrator.';
    case 'session_expired':
      return 'Your session has expired. Please log in again.';
    case 'no_data':
      return 'No data available to display.';
    case 'loading':
      return 'Loading data, please wait...';
    case 'search_no_results':
      return 'No results found for your search. Try different keywords.';
    case 'permission_required':
      return 'You don\'t have permission to perform this action.';
    case 'confirmation_required':
      return 'Please confirm this action to continue.';
    case 'data_updated':
      return 'Data has been updated. Refresh to see changes.';
    default:
      return 'Please check the information and try again.';
  }
};
