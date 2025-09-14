'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Users, 
  DollarSign,
  Calendar,
  Tag as TagIcon,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface Tag {
  id: string
  name: string
  color: string
}

interface BonusGrant {
  id: string
  amount: number
  grantedAt: string
  grantedBy: {
    name: string
    email: string
  }
  user: {
    id: string
    name: string
    email: string
  }
  notes?: string
}

interface BonusRule {
  id: string
  name: string
  description?: string
  tagId?: string
  tag?: Tag
  filters: any
  bonusAmount: number
  maxUsers?: number
  isActive: boolean
  startsAt?: string
  expiresAt?: string
  createdAt: string
  createdBy: {
    name: string
    email: string
  }
  _count: {
    bonusGrants: number
  }
}

export function BonusManagement() {
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<BonusRule | null>(null)
  const [executingRuleId, setExecutingRuleId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tagId: 'none',
    bonusAmount: 0,
    maxUsers: '',
    isActive: true,
    startsAt: '',
    expiresAt: '',
    filters: {
      createdAfter: '',
      createdBefore: '',
      minOrderCount: '',
      maxOrderCount: '',
      minTotalSpent: '',
      maxTotalSpent: '',
      orderStatuses: [] as string[]
    }
  })

  const fetchBonusRules = async () => {
    try {
      const response = await fetch('/api/admin/bonus-rules')
      if (!response.ok) throw new Error('Failed to fetch bonus rules')
      const data = await response.json()
      setBonusRules(data.bonusRules || [])
    } catch (error) {
      console.error('Error fetching bonus rules:', error)
      toast.error('Failed to fetch bonus rules')
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags')
      if (!response.ok) throw new Error('Failed to fetch tags')
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  useEffect(() => {
    fetchBonusRules()
    fetchTags()
  }, [])

  const handleCreateRule = async () => {
    if (!formData.name.trim() || !formData.bonusAmount) {
      toast.error('Name and bonus amount are required')
      return
    }

    try {
      const response = await fetch('/api/admin/bonus-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : null,
          tagId: formData.tagId === 'none' ? null : formData.tagId || null,
          startsAt: formData.startsAt || null,
          expiresAt: formData.expiresAt || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create bonus rule')
      }

      toast.success('Bonus rule created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
      fetchBonusRules()
    } catch (error: any) {
      console.error('Error creating bonus rule:', error)
      toast.error(error.message || 'Failed to create bonus rule')
    }
  }

  const handleUpdateRule = async () => {
    if (!editingRule || !formData.name.trim() || !formData.bonusAmount) {
      toast.error('Name and bonus amount are required')
      return
    }

    try {
      const response = await fetch(`/api/admin/bonus-rules/${editingRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : null,
          tagId: formData.tagId === 'none' ? null : formData.tagId || null,
          startsAt: formData.startsAt || null,
          expiresAt: formData.expiresAt || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update bonus rule')
      }

      toast.success('Bonus rule updated successfully')
      setEditingRule(null)
      resetForm()
      fetchBonusRules()
    } catch (error: any) {
      console.error('Error updating bonus rule:', error)
      toast.error(error.message || 'Failed to update bonus rule')
    }
  }

  const handleDeleteRule = async (rule: BonusRule) => {
    if (!confirm(`Are you sure you want to delete the bonus rule "${rule.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/bonus-rules/${rule.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete bonus rule')
      }

      toast.success('Bonus rule deleted successfully')
      fetchBonusRules()
    } catch (error: any) {
      console.error('Error deleting bonus rule:', error)
      toast.error(error.message || 'Failed to delete bonus rule')
    }
  }

  const handleExecuteRule = async (rule: BonusRule) => {
    if (!confirm(`Are you sure you want to execute the bonus rule "${rule.name}"? This will grant bonuses to eligible users.`)) {
      return
    }

    setExecutingRuleId(rule.id)
    try {
      const response = await fetch(`/api/admin/bonus-rules/${rule.id}/execute`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to execute bonus rule')
      }

      const data = await response.json()
      toast.success(`${data.message}. Total amount: $${(data.totalAmount / 100).toFixed(2)}`)
      fetchBonusRules()
    } catch (error: any) {
      console.error('Error executing bonus rule:', error)
      toast.error(error.message || 'Failed to execute bonus rule')
    } finally {
      setExecutingRuleId(null)
    }
  }

  const openEditDialog = (rule: BonusRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description || '',
      tagId: rule.tagId || 'none',
      bonusAmount: rule.bonusAmount,
      maxUsers: rule.maxUsers?.toString() || '',
      isActive: rule.isActive,
      startsAt: rule.startsAt ? new Date(rule.startsAt).toISOString().slice(0, 16) : '',
      expiresAt: rule.expiresAt ? new Date(rule.expiresAt).toISOString().slice(0, 16) : '',
      filters: rule.filters || {
        createdAfter: '',
        createdBefore: '',
        minOrderCount: '',
        maxOrderCount: '',
        minTotalSpent: '',
        maxTotalSpent: '',
        orderStatuses: []
      }
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tagId: 'none',
      bonusAmount: 0,
      maxUsers: '',
      isActive: true,
      startsAt: '',
      expiresAt: '',
      filters: {
        createdAfter: '',
        createdBefore: '',
        minOrderCount: '',
        maxOrderCount: '',
        minTotalSpent: '',
        maxTotalSpent: '',
        orderStatuses: []
      }
    })
  }

  const closeDialogs = () => {
    setIsCreateDialogOpen(false)
    setEditingRule(null)
    resetForm()
  }

  const getRuleStatus = (rule: BonusRule) => {
    if (!rule.isActive) {
      return { status: 'inactive', label: 'Inactive', icon: <Pause className="w-3 h-3 mr-1" /> }
    }

    const now = new Date()
    if (rule.startsAt && new Date(rule.startsAt) > now) {
      return { status: 'pending', label: 'Pending', icon: <Clock className="w-3 h-3 mr-1" /> }
    }

    if (rule.expiresAt && new Date(rule.expiresAt) < now) {
      return { status: 'expired', label: 'Expired', icon: <XCircle className="w-3 h-3 mr-1" /> }
    }

    return { status: 'active', label: 'Active', icon: <CheckCircle className="w-3 h-3 mr-1" /> }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bonus System</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage bonus rules for users</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Bonus Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Bonus Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <Label htmlFor="bonusAmount">Bonus Amount (credits)</Label>
                  <Input
                    id="bonusAmount"
                    type="number"
                    value={formData.bonusAmount}
                    onChange={(e) => setFormData({ ...formData, bonusAmount: parseInt(e.target.value) || 0 })}
                    placeholder="Enter bonus amount"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter rule description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tag">Based on Tag (Optional)</Label>
                <Select value={formData.tagId} onValueChange={(value) => setFormData({ ...formData, tagId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tag (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No tag filter</SelectItem>
                    {tags.map(tag => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span>{tag.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxUsers">Max Users (Optional)</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startsAt">Start Date (Optional)</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Filters</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label htmlFor="createdAfter">Created After</Label>
                    <Input
                      id="createdAfter"
                      type="date"
                      value={formData.filters.createdAfter}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, createdAfter: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="createdBefore">Created Before</Label>
                    <Input
                      id="createdBefore"
                      type="date"
                      value={formData.filters.createdBefore}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, createdBefore: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minTotalSpent">Min Total Spent ($)</Label>
                    <Input
                      id="minTotalSpent"
                      type="number"
                      value={formData.filters.minTotalSpent}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, minTotalSpent: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxTotalSpent">Max Total Spent ($)</Label>
                    <Input
                      id="maxTotalSpent"
                      type="number"
                      value={formData.filters.maxTotalSpent}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        filters: { ...formData.filters, maxTotalSpent: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={closeDialogs}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule} className="bg-violet-600 hover:bg-violet-700">
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bonus Rules Table */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <CardTitle className="flex items-center font-semibold text-gray-800 dark:text-gray-100">
            <Gift className="w-5 h-5 mr-2" />
            Bonus Rules ({bonusRules.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Bonus Amount</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grants</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonusRules.map((rule) => {
                  const status = getRuleStatus(rule)
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          {rule.description && (
                            <div className="text-sm text-gray-500">{rule.description}</div>
                          )}
                          {rule.tag && (
                            <div className="flex items-center space-x-1 mt-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: rule.tag.color }}
                              />
                              <span className="text-xs text-gray-500">{rule.tag.name}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">{formatCurrency(rule.bonusAmount)}</span>
                        </div>
                        {rule.maxUsers && (
                          <div className="text-xs text-gray-500">Max {rule.maxUsers} users</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {rule.filters?.createdAfter && (
                            <div>Created after: {new Date(rule.filters.createdAfter).toLocaleDateString()}</div>
                          )}
                          {rule.filters?.minTotalSpent && (
                            <div>Min spent: ${rule.filters.minTotalSpent}</div>
                          )}
                          {Object.keys(rule.filters || {}).length === 0 && (
                            <div className="text-gray-500">No additional filters</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          status.status === 'active' ? 'default' : 
                          status.status === 'expired' ? 'destructive' : 
                          status.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {status.icon}
                          {status.label}
                        </Badge>
                        {rule.startsAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Starts: {new Date(rule.startsAt).toLocaleDateString()}
                          </div>
                        )}
                        {rule.expiresAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Expires: {new Date(rule.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{rule._count.bonusGrants}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: {formatCurrency(rule._count.bonusGrants * rule.bonusAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(rule.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {rule.createdBy.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExecuteRule(rule)}
                            disabled={executingRuleId === rule.id || status.status !== 'active'}
                          >
                            {executingRuleId === rule.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRule(rule)}
                            disabled={rule._count.bonusGrants > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {bonusRules.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No bonus rules created yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bonus Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Rule Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter rule name"
                />
              </div>
              <div>
                <Label htmlFor="edit-bonusAmount">Bonus Amount (credits)</Label>
                <Input
                  id="edit-bonusAmount"
                  type="number"
                  value={formData.bonusAmount}
                  onChange={(e) => setFormData({ ...formData, bonusAmount: parseInt(e.target.value) || 0 })}
                  placeholder="Enter bonus amount"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter rule description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-tag">Based on Tag (Optional)</Label>
              <Select value={formData.tagId} onValueChange={(value) => setFormData({ ...formData, tagId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tag (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No tag filter</SelectItem>
                  {tags.map(tag => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-maxUsers">Max Users (Optional)</Label>
                <Input
                  id="edit-maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRule} className="bg-violet-600 hover:bg-violet-700">
                Update Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
