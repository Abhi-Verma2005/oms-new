'use client';

import { useEffect, useState } from 'react';
import { AdminCard as Card, AdminCardContent as CardContent, AdminCardDescription as CardDescription, AdminCardHeader as CardHeader, AdminCardTitle as CardTitle } from '@/components/admin/AdminCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Edit, Trash2, Bell, EyeIcon } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationType {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function NotificationTypesManagement() {
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<NotificationType | null>(null);
  const [previewType, setPreviewType] = useState<NotificationType | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: '',
    color: '',
    isActive: true
  });

  useEffect(() => {
    fetchNotificationTypes();
  }, []);

  const fetchNotificationTypes = async () => {
    try {
      const response = await fetch('/api/admin/notification-types');
      if (response.ok) {
        const data = await response.json();
        setNotificationTypes(data);
      } else {
        toast.error('Failed to fetch notification types');
      }
    } catch (error) {
      console.error('Error fetching notification types:', error);
      toast.error('Failed to fetch notification types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingType 
        ? `/api/admin/notification-types/${editingType.id}`
        : '/api/admin/notification-types';
      
      const method = editingType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingType ? 'Notification type updated' : 'Notification type created');
        fetchNotificationTypes();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save notification type');
      }
    } catch (error) {
      console.error('Error saving notification type:', error);
      toast.error('Failed to save notification type');
    }
  };

  const handleEdit = (type: NotificationType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      displayName: type.displayName,
      description: type.description || '',
      icon: type.icon || '',
      color: type.color || '',
      isActive: type.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notification-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Notification type deleted');
        fetchNotificationTypes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete notification type');
      }
    } catch (error) {
      console.error('Error deleting notification type:', error);
      toast.error('Failed to delete notification type');
    }
  };

  const handlePreview = (type: NotificationType) => {
    setPreviewType(type);
    setIsPreviewOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      icon: '',
      color: '',
      isActive: true
    });
    setEditingType(null);
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Notification Types</h2>
            <p className="text-muted-foreground">Manage notification types and their settings</p>
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
          <h2 className="text-2xl font-bold">Notification Types</h2>
          <p className="text-muted-foreground">Manage notification types and their settings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Edit Notification Type' : 'Create Notification Type'}
              </DialogTitle>
              <DialogDescription>
                {editingType 
                  ? 'Update the notification type details below.'
                  : 'Create a new notification type with the details below.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., announcement"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., Announcement"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., 🔔 or bell"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g., #3B82F6 or blue"
                />
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingType ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Manage different types of notifications that can be sent to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notificationTypes.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notification types</h3>
              <p className="text-muted-foreground mb-4">
                Create your first notification type to get started
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.displayName}</TableCell>
                    <TableCell>
                      {type.icon && (
                        <span className="text-lg">{type.icon}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? 'default' : 'secondary'}>
                        {type.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(type.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(type)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${type.displayName}"? This action cannot be undone. Note: You cannot delete a notification type that has associated notifications.`)) {
                              handleDelete(type.id);
                            }
                          }}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Notification Type Preview</DialogTitle>
            <DialogDescription>
              This is how the notification type will appear in the system
            </DialogDescription>
          </DialogHeader>
          
          {previewType && (
            <div className="space-y-4">
              {/* Type Preview */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notification Type Details</h3>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-black/5 dark:border-white/10 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {previewType.icon ? (
                        <span className="text-2xl">{previewType.icon}</span>
                      ) : (
                        <Bell className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {previewType.displayName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {previewType.description || 'No description provided'}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={previewType.isActive ? 'default' : 'secondary'}>
                          {previewType.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {previewType.color && (
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: previewType.color }}
                          ></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Example */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Usage Example</h3>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-black/5 dark:border-white/10 p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {previewType.icon ? (
                        <span className="text-lg">{previewType.icon}</span>
                      ) : (
                        <Bell className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Sample notification using this type
                        </p>
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        This is how notifications of this type will appear to users
                      </p>
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
                        {new Date().toLocaleDateString()}
                      </p>
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
    </div>
  );
}
