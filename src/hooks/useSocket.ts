import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  type: 'overdue' | 'pending_approval' | 'request_approved' | 'request_rejected' | 'book_returned' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  metadata?: Record<string, any>;
}

export interface SocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

export const useSocket = () => {
  const { user, accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Check if WebSocket is enabled (default to true for development)
    const websocketEnabled = process.env.NEXT_PUBLIC_WEBSOCKET_ENABLED !== 'false';
    if (!websocketEnabled) {
      console.log('WebSocket connection disabled via environment variable');
      return;
    }

    // Check if we're in production and on a free tier (disable WebSocket for stability)
    const isProduction = process.env.NODE_ENV === 'production';
    const isFreeTier = process.env.NEXT_PUBLIC_FREE_TIER === 'true';
    if (isProduction && isFreeTier) {
      console.log('WebSocket disabled for free tier production deployment');
      return;
    }

    // Initialize socket connection
    // Remove /api/v1 from the URL for WebSocket connection
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1')
      .replace('/api/v1', '');
    
    const newSocket = io(baseUrl, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.warn('WebSocket connection error (this is normal if WebSocket server is not available):', error.message);
      setIsConnected(false);
      // Don't show error toast for WebSocket connection issues
    });

    // Notification events
    newSocket.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      const toastOptions = {
        duration: notification.type === 'overdue' ? 8000 : 4000,
        position: 'top-right' as const,
      };

      switch (notification.type) {
        case 'overdue':
          toast.error(notification.title, toastOptions);
          break;
        case 'request_approved':
          toast.success(notification.title, toastOptions);
          break;
        case 'request_rejected':
          toast.error(notification.title, toastOptions);
          break;
        case 'pending_approval':
          toast(notification.title, {
            ...toastOptions,
            icon: '📋',
          });
          break;
        case 'book_returned':
          toast.success(notification.title, toastOptions);
          break;
        default:
          toast(notification.title, toastOptions);
      }
    });

    // Admin notification events
    newSocket.on('admin_notification', (data: any) => {
      console.log('Received admin notification:', data);
      toast(data.message, {
        duration: 6000,
        position: 'top-right',
        icon: '👨‍💼',
      });
    });

    // System events
    newSocket.on('heartbeat', (data: any) => {
      // Handle heartbeat - could be used for connection health monitoring
      console.log('Heartbeat received:', data);
    });

    newSocket.on('system_status', (data: any) => {
      console.log('System status:', data);
    });

    // User activity events
    newSocket.on('user_typing', (data: any) => {
      // Handle typing indicators
      console.log('User typing:', data);
    });

    newSocket.on('user_stopped_typing', (data: any) => {
      // Handle typing stop
      console.log('User stopped typing:', data);
    });

    newSocket.on('user_searching', (data: any) => {
      // Handle real-time search collaboration
      console.log('User searching:', data);
    });

    newSocket.on('availability_checked', (data: any) => {
      // Handle book availability updates
      console.log('Availability checked:', data);
    });

    newSocket.on('user_offline', (data: any) => {
      // Handle user going offline
      console.log('User offline:', data);
    });

    // Error handling
    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Connection error');
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, accessToken]);

  // Join library room
  const joinLibrary = (libraryId: string) => {
    if (socket && isConnected) {
      socket.emit('join_library', libraryId);
    }
  };

  // Leave library room
  const leaveLibrary = (libraryId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_library', libraryId);
    }
  };

  // Send typing indicator
  const sendTypingStart = (room: string, type: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { room, type });
    }
  };

  const sendTypingStop = (room: string, type: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { room, type });
    }
  };

  // Send search collaboration
  const sendSearchStart = (query: string, filters: any) => {
    if (socket && isConnected) {
      socket.emit('search_start', { query, filters });
    }
  };

  // Check book availability
  const checkBookAvailability = (titleId: string, libraryId: string) => {
    if (socket && isConnected) {
      socket.emit('book_availability_check', { titleId, libraryId });
    }
  };

  // Send admin notification
  const sendAdminNotification = (type: string, message: string, targetUsers?: string[]) => {
    if (socket && isConnected && (user?.role === 'admin' || user?.role === 'superadmin')) {
      socket.emit('admin_notification', { type, message, targetUsers });
    }
  };

  // Request system status
  const requestSystemStatus = () => {
    if (socket && isConnected && (user?.role === 'admin' || user?.role === 'superadmin')) {
      socket.emit('system_status_request');
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Get notifications by type
  const getNotificationsByType = (type: string) => {
    return notifications.filter(notification => notification.type === type);
  };

  // Get unread notifications
  const getUnreadNotifications = () => {
    return notifications.filter(notification => !notification.read);
  };

  return {
    socket,
    isConnected,
    notifications,
    unreadCount,
    joinLibrary,
    leaveLibrary,
    sendTypingStart,
    sendTypingStop,
    sendSearchStart,
    checkBookAvailability,
    sendAdminNotification,
    requestSystemStatus,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getNotificationsByType,
    getUnreadNotifications,
  };
};
