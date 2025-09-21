'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Save,
  Plus,
  X,
  Tag as TagIcon,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface Product {
  id: string;
  slug: string;
  header: string;
  subheader?: string;
  descriptionMarkdown?: string;
  pricePerMonthCents?: number;
  discountPercent?: number;
  finalPricePerMonthCents?: number;
  currency: string;
  badge?: string;
  showOnShop2: boolean;
  showOnLinkBuilding: boolean;
  isActive: boolean;
  sortOrder: number;
  features: Array<{
    id?: string;
    title: string;
    value?: string;
    icon?: string;
    sortOrder: number;
  }>;
  productTags: Array<{
    id: string;
    tagId?: string;
    tag?: Tag;
  }>;
}

interface EditProductFormProps {
  params: Promise<{ id: string }>;
}

export function EditProductForm({ params }: EditProductFormProps) {
  const router = useRouter();
  const [data, setData] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const { id } = await params;
        const [pr, tr] = await Promise.all([
          fetch(`/api/admin/products/${id}`, { cache: 'no-store' }).then(r => r.json()),
          fetch('/api/admin/tags', { cache: 'no-store' }).then(r => r.ok ? r.json() : { tags: [] }).catch(() => ({ tags: [] })),
        ]);
        setData(pr.product);
        setAllTags(tr.tags);
      } catch (error) {
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params]);

  async function save() {
    if (!data) return;
    
    setSaving(true);
    try {
      const body = {
        header: data.header,
        subheader: data.subheader,
        descriptionMarkdown: data.descriptionMarkdown,
        pricePerMonthCents: data.pricePerMonthCents ? Number(data.pricePerMonthCents) : null,
        discountPercent: data.discountPercent ? Number(data.discountPercent) : null,
        finalPricePerMonthCents: data.finalPricePerMonthCents ? Number(data.finalPricePerMonthCents) : null,
        currency: data.currency || 'USD',
        badge: data.badge,
        showOnShop2: !!data.showOnShop2,
        showOnLinkBuilding: !!data.showOnLinkBuilding,
        isActive: !!data.isActive,
        sortOrder: Number(data.sortOrder) || 0,
        features: (data.features || []).map((f, idx) => ({ 
          title: f.title, 
          value: f.value, 
          icon: f.icon, 
          sortOrder: f.sortOrder ?? idx 
        })),
        tagIds: (data.productTags || []).map((pt) => pt.tagId || pt.tag?.id).filter(Boolean),
      };
      
      const res = await fetch(`/api/admin/products/${data.id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      
      if (res.ok) {
        toast.success('Product updated successfully');
        router.push('/admin/products');
      } else {
        toast.error('Failed to update product');
      }
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  }

  function toggleTag(tagId: string) {
    if (!data) return;
    
    const exists = (data.productTags || []).some((pt) => (pt.tagId || pt.tag?.id) === tagId);
    if (exists) {
      setData({ 
        ...data, 
        productTags: (data.productTags || []).filter((pt) => (pt.tagId || pt.tag?.id) !== tagId) 
      });
    } else {
      setData({ 
        ...data, 
        productTags: [...(data.productTags || []), { id: '', tagId }] 
      });
    }
  }

  function addFeature() {
    if (!data) return;
    
    setData({ 
      ...data, 
      features: [...(data.features || []), { title: '', value: '', sortOrder: data.features.length }] 
    });
  }

  function removeFeature(index: number) {
    if (!data) return;
    
    setData({ 
      ...data, 
      features: data.features.filter((_, i) => i !== index) 
    });
  }

  function updateFeature(index: number, field: string, value: string) {
    if (!data) return;
    
    setData({ 
      ...data, 
      features: data.features.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      ) 
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Product not found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">The product you're looking for doesn't exist.</p>
        <Button variant="outline" onClick={() => router.push('/admin/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Product</h1>
          <p className="text-gray-600 dark:text-gray-400">Update product details and settings</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Basic Information</CardTitle>
              <CardDescription>Product name, description, and pricing details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="header" className="text-gray-900 dark:text-white">Product Name</Label>
                <Input
                  id="header"
                  value={data.header || ''}
                  onChange={(e) => setData({ ...data, header: e.target.value })}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  placeholder="Enter product name"
                />
              </div>
              
              <div>
                <Label htmlFor="subheader" className="text-gray-900 dark:text-white">Subheader</Label>
                <Input
                  id="subheader"
                  value={data.subheader || ''}
                  onChange={(e) => setData({ ...data, subheader: e.target.value })}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  placeholder="e.g., $1000 per month"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-gray-900 dark:text-white">Description (Markdown)</Label>
                <Textarea
                  id="description"
                  value={data.descriptionMarkdown || ''}
                  onChange={(e) => setData({ ...data, descriptionMarkdown: e.target.value })}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[120px]"
                  placeholder="Enter product description in Markdown format"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Pricing</CardTitle>
              <CardDescription>Set product pricing and discounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="text-gray-900 dark:text-white">Price (cents)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={data.pricePerMonthCents ?? ''}
                    onChange={(e) => setData({ ...data, pricePerMonthCents: e.target.value ? Number(e.target.value) : undefined })}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    placeholder="100000"
                  />
                </div>
                <div>
                  <Label htmlFor="finalPrice" className="text-gray-900 dark:text-white">Final Price (cents)</Label>
                  <Input
                    id="finalPrice"
                    type="number"
                    value={data.finalPricePerMonthCents ?? ''}
                    onChange={(e) => setData({ ...data, finalPricePerMonthCents: e.target.value ? Number(e.target.value) : undefined })}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    placeholder="850000"
                  />
                </div>
                <div>
                  <Label htmlFor="discount" className="text-gray-900 dark:text-white">Discount %</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={data.discountPercent ?? ''}
                    onChange={(e) => setData({ ...data, discountPercent: e.target.value ? Number(e.target.value) : undefined })}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label htmlFor="badge" className="text-gray-900 dark:text-white">Badge</Label>
                  <Input
                    id="badge"
                    value={data.badge || ''}
                    onChange={(e) => setData({ ...data, badge: e.target.value })}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    placeholder="Most Popular"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Features</CardTitle>
              <CardDescription>Define product features and benefits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Product Features</div>
                  <Button variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(data.features || []).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Title"
                          value={feature.title || ''}
                          onChange={(e) => updateFeature(index, 'title', e.target.value)}
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        />
                        <Input
                          placeholder="Value"
                          value={feature.value || ''}
                          onChange={(e) => updateFeature(index, 'value', e.target.value)}
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        />
                        <Input
                          placeholder="Icon (optional)"
                          value={feature.icon || ''}
                          onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Settings</CardTitle>
              <CardDescription>Control product visibility and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showOnShop2"
                    checked={!!data.showOnShop2}
                    onCheckedChange={(checked) => setData({ ...data, showOnShop2: !!checked })}
                  />
                  <Label htmlFor="showOnShop2" className="text-gray-900 dark:text-white">Show on Shop 2</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showOnLinkBuilding"
                    checked={!!data.showOnLinkBuilding}
                    onCheckedChange={(checked) => setData({ ...data, showOnLinkBuilding: !!checked })}
                  />
                  <Label htmlFor="showOnLinkBuilding" className="text-gray-900 dark:text-white">Show on Link Building</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={!!data.isActive}
                    onCheckedChange={(checked) => setData({ ...data, isActive: !!checked })}
                  />
                  <Label htmlFor="isActive" className="text-gray-900 dark:text-white">Active</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="sortOrder" className="text-gray-900 dark:text-white">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={data.sortOrder ?? 0}
                  onChange={(e) => setData({ ...data, sortOrder: Number(e.target.value) || 0 })}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Tags</CardTitle>
              <CardDescription>Assign tags to categorize this product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const isSelected = (data.productTags || []).some((pt) => (pt.tagId || pt.tag?.id) === tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                          isSelected 
                            ? 'text-white border-transparent' 
                            : 'text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:opacity-80'
                        }`}
                        style={isSelected ? {
                          backgroundColor: tag.color || '#6B7280',
                          borderColor: tag.color || '#6B7280'
                        } : {}}
                      >
                        <TagIcon className="w-3 h-3 mr-1" />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
                
                {data.productTags.length > 0 && (
                  <div className="pt-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Selected Tags:</div>
                    <div className="flex flex-wrap gap-1">
                      {data.productTags.map((pt) => (
                        <span
                          key={pt.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white border"
                          style={{ 
                            backgroundColor: pt.tag?.color || '#6B7280',
                            borderColor: pt.tag?.color || '#6B7280'
                          }}
                        >
                          <TagIcon className="w-3 h-3 mr-1" />
                          {pt.tag?.name || 'Unknown'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-3">
            <Button 
              onClick={save} 
              disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

