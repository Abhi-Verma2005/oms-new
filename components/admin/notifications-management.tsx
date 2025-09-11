'use client';

import { useEffect, useState } from 'react';
import { AdminCard as Card, AdminCardContent as CardContent, AdminCardDescription as CardDescription, AdminCardHeader as CardHeader, AdminCardTitle as CardTitle } from '@/components/admin/AdminCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
// import { 
//   AlertDialog, 
//   AlertDialogAction, 
//   AlertDialogCancel, 
//   AlertDialogContent, 
//   AlertDialogDescription, 
//   AlertDialogFooter, 
//   AlertDialogHeader, 
//   AlertDialogTitle, 
//   AlertDialogTrigger 
// } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Bell, Users, Globe, Calendar, Eye, EyeIcon, Send, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationType {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  color?: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  typeId: string;
  isActive: boolean;
  isGlobal: boolean;
  targetUserIds: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  type: NotificationType;
  _count: {
    userReads: number;
  };
}

export function NotificationsManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [previewNotification, setPreviewNotification] = useState<Notification | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPushConfirmOpen, setIsPushConfirmOpen] = useState(false);
  const [notificationToPush, setNotificationToPush] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    imageUrl: '',
    typeId: '',
    isGlobal: true,
    targetUserIds: [] as string[],
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    expiresAt: '',
    isActive: true
  });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
    fetchNotificationTypes();
  }, [statusFilter]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else {
        toast.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationTypes = async () => {
    try {
      const response = await fetch('/api/admin/notification-types');
      if (response.ok) {
        const data = await response.json();
        setNotificationTypes(data);
      }
    } catch (error) {
      console.error('Error fetching notification types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent, shouldPush = false) => {
    e.preventDefault();
    
    try {
      const url = editingNotification 
        ? `/api/admin/notifications/${editingNotification.id}`
        : '/api/notifications';
      
      const method = editingNotification ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const createdNotification = await response.json();
        toast.success(editingNotification ? 'Notification updated' : 'Notification created');
        fetchNotifications();
        
        // If shouldPush is true, immediately push the notification
        if (shouldPush && createdNotification.id) {
          // Get the full notification with type for pushing
          const fullNotification = await fetch(`/api/admin/notifications/${createdNotification.id}`)
            .then(res => res.json())
            .then(data => data.notification);
          
          if (fullNotification) {
            setNotificationToPush(fullNotification);
            setIsPushConfirmOpen(true);
          }
        }
        
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save notification');
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('Failed to save notification');
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      body: notification.body,
      imageUrl: notification.imageUrl || '',
      typeId: notification.typeId,
      isGlobal: notification.isGlobal,
      targetUserIds: notification.targetUserIds,
      priority: notification.priority,
      expiresAt: notification.expiresAt ? new Date(notification.expiresAt).toISOString().split('T')[0] : '',
      isActive: notification.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Notification deleted');
        fetchNotifications();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handlePreview = (notification: Notification) => {
    setPreviewNotification(notification);
    setIsPreviewOpen(true);
  };

  const handlePushNotification = async (notification: Notification) => {
    setNotificationToPush(notification);
    setIsPushConfirmOpen(true);
  };

  const confirmPushNotification = async () => {
    if (!notificationToPush) return;
    
    try {
      const response = await fetch('/api/admin/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: notificationToPush.id }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Notification pushed to ${data.connectedClients} connected users`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to push notification');
      }
    } catch (error) {
      console.error('Error pushing notification:', error);
      toast.error('Failed to push notification');
    } finally {
      setIsPushConfirmOpen(false);
      setNotificationToPush(null);
    }
  };

  const handlePreviewPush = (notification: Notification) => {
    // Create a preview notification object for toast
    const previewData = {
      id: `preview-${notification.id}`,
      title: notification.title,
      body: notification.body,
      imageUrl: notification.imageUrl,
      typeId: notification.typeId,
      isActive: notification.isActive,
      isGlobal: notification.isGlobal,
      targetUserIds: notification.targetUserIds,
      priority: notification.priority,
      expiresAt: notification.expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: notification.type,
      isRead: false,
      readAt: null
    };

    // Trigger a preview toast notification
    if (typeof window !== 'undefined') {
      // Dispatch a custom event to show preview toast
      window.dispatchEvent(new CustomEvent('preview-notification', { 
        detail: previewData 
      }));
    }
    
    toast.success('Preview notification sent to your screen');
  };

  const handlePushAllActive = async () => {
    const activeNotifications = notifications.filter(n => n.isActive);
    
    if (activeNotifications.length === 0) {
      toast.error('No active notifications to push');
      return;
    }

    if (!confirm(`Are you sure you want to push ${activeNotifications.length} active notifications to all connected users?`)) {
      return;
    }

    try {
      const pushPromises = activeNotifications.map(notification => 
        fetch('/api/admin/notifications/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notificationId: notification.id }),
        })
      );

      const results = await Promise.allSettled(pushPromises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(`Successfully pushed ${successful} notifications`);
      }
      if (failed > 0) {
        toast.error(`Failed to push ${failed} notifications`);
      }
    } catch (error) {
      console.error('Error pushing all notifications:', error);
      toast.error('Failed to push notifications');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      imageUrl: '',
      typeId: '',
      isGlobal: true,
      targetUserIds: [],
      priority: 'NORMAL',
      expiresAt: '',
      isActive: true
    });
    setEditingNotification(null);
    setIsDialogOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'default';
      case 'NORMAL': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-muted-foreground">Manage system notifications</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">Manage system notifications</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handlePushAllActive}
            disabled={notifications.filter(n => n.isActive).length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            Push All Active
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? 'Edit Notification' : 'Create Notification'}
              </DialogTitle>
              <DialogDescription>
                {editingNotification 
                  ? 'Update the notification details below.'
                  : 'Create a new notification with the details below.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Notification title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="typeId">Type *</Label>
                  <Select
                    value={formData.typeId}
                    onValueChange={(value) => setFormData({ ...formData, typeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.icon && <span className="mr-2">{type.icon}</span>}
                          {type.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body">Body *</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Notification content"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires At</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Targeting</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isGlobal"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isGlobal">Send to all users</Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <div className="flex flex-1 gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      // Create a preview notification object
                      const previewData = {
                        id: 'preview',
                        title: formData.title,
                        body: formData.body,
                        imageUrl: formData.imageUrl,
                        typeId: formData.typeId,
                        isActive: formData.isActive,
                        isGlobal: formData.isGlobal,
                        targetUserIds: formData.targetUserIds,
                        priority: formData.priority,
                        expiresAt: formData.expiresAt,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        type: notificationTypes.find(t => t.id === formData.typeId) || {
                          id: formData.typeId,
                          name: 'preview',
                          displayName: 'Preview Type',
                          icon: '🔔',
                          color: '#3B82F6'
                        },
                        isRead: false,
                        readAt: null,
                        _count: { userReads: 0 }
                      };
                      setPreviewNotification(previewData as any);
                      setIsPreviewOpen(true);
                    }}
                    disabled={!formData.title || !formData.body || !formData.typeId}
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={!formData.title || !formData.body || !formData.typeId}
                  >
                    {editingNotification ? 'Update' : 'Create'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="default"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={!formData.title || !formData.body || !formData.typeId}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {editingNotification ? 'Update & Push' : 'Create & Push'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notifications</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Manage system notifications sent to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground mb-4">
                Create your first notification to get started
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reads</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {notification.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {notification.type.icon && (
                          <span>{notification.type.icon}</span>
                        )}
                        <span>{notification.type.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {notification.isGlobal ? (
                          <>
                            <Globe className="h-4 w-4" />
                            <span>All Users</span>
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4" />
                            <span>{notification.targetUserIds.length} Users</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{notification._count.userReads}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={notification.isActive ? 'default' : 'secondary'}>
                        {notification.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(notification)}
                          title="Edit notification"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(notification)}
                          title="Preview notification"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        {notification.isActive && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreviewPush(notification)}
                              title="Preview push notification"
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Zap className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePushNotification(notification)}
                              title="Push notification now"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Push
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${notification.title}"? This action cannot be undone.`)) {
                              handleDelete(notification.id);
                            }
                          }}
                          title="Delete notification"
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notification Preview</DialogTitle>
            <DialogDescription>
              This is how the notification will appear to users
            </DialogDescription>
          </DialogHeader>
          
          {previewNotification && (
            <div className="space-y-4">
              {/* Preview Header */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notification Dropdown Preview</h3>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-black/5 dark:border-white/10 p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {previewNotification.type.icon ? (
                        <span className="text-lg">{previewNotification.type.icon}</span>
                      ) : (
                        <Bell className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {previewNotification.title}
                        </p>
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {previewNotification.body}
                      </p>
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(previewNotification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Notification Preview */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Full Notification Page Preview</h3>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-black/5 dark:border-white/10 p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {previewNotification.type.icon ? (
                        <span className="text-2xl">{previewNotification.type.icon}</span>
                      ) : (
                        <Bell className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {previewNotification.title}
                            </h3>
                            <Badge variant={getPriorityColor(previewNotification.priority)}>
                              {previewNotification.priority}
                            </Badge>
                            <Badge variant="default" className="bg-blue-500">
                              New
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                            {previewNotification.body}
                          </p>

                          {/* Image */}
                          {previewNotification.imageUrl && (
                            <div className="mb-4">
                              <img 
                                src={previewNotification.imageUrl} 
                                alt={previewNotification.title}
                                className="max-w-full h-auto rounded-lg border"
                              />
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(previewNotification.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {previewNotification.isGlobal ? (
                                <>
                                  <Globe className="h-4 w-4" />
                                  <span>All Users</span>
                                </>
                              ) : (
                                <>
                                  <Users className="h-4 w-4" />
                                  <span>{previewNotification.targetUserIds.length} Users</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {previewNotification.type.displayName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Push Confirmation Dialog */}
      <Dialog open={isPushConfirmOpen} onOpenChange={setIsPushConfirmOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              Push Notification
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to push this notification to all connected users? This action will immediately send the notification to all users currently online.
            </DialogDescription>
          </DialogHeader>
          
          {notificationToPush && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {notificationToPush.type.icon ? (
                    <span className="text-lg">{notificationToPush.type.icon}</span>
                  ) : (
                    <Bell className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {notificationToPush.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {notificationToPush.body}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant={getPriorityColor(notificationToPush.priority)} className="text-xs">
                      {notificationToPush.priority}
                    </Badge>
                    <Badge variant="default" className="bg-blue-500 text-xs">
                      {notificationToPush.isGlobal ? 'All Users' : `${notificationToPush.targetUserIds.length} Users`}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPushConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmPushNotification}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Push Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
