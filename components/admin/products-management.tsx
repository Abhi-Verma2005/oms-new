'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Package,
  Tag as TagIcon
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Product {
  id: string;
  slug: string;
  header: string;
  subheader?: string;
  showOnShop2: boolean;
  showOnLinkBuilding: boolean;
  isActive: boolean;
  productTags: Array<{
    id: string;
    tag: Tag;
  }>;
}

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [pr, tr] = await Promise.all([
        fetch('/api/admin/products', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/admin/tags', { cache: 'no-store' }).then(r => r.ok ? r.json() : { tags: [] }).catch(() => ({ tags: [] })),
      ]);
      setProducts(pr.products || []);
      setTags(tr.tags || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    load(); 
  }, []);

  async function createQuick() {
    const slug = prompt('Slug? (unique)') || '';
    if (!slug) return;
    const header = prompt('Header?') || 'New Package';
    
    try {
      const res = await fetch('/api/admin/products', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          slug, 
          header, 
          subheader: '', 
          showOnShop2: false, 
          showOnLinkBuilding: false, 
          features: [] 
        }) 
      });
      
      if (res.ok) {
        toast.success('Product created successfully');
        load();
      } else {
        toast.error('Failed to create product');
      }
    } catch (error) {
      toast.error('Failed to create product');
    }
  }

  async function deleteProduct(productId: string, productName: string) {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Product deleted successfully');
        load();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete product');
      }
    } catch (error) {
      toast.error('Failed to delete product');
    }
  }

  const filteredProducts = products.filter(product =>
    product.header.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your products and packages</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your products and packages</p>
        </div>
        <Button onClick={createQuick} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-900 dark:text-white">Product</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Slug</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Shop 2</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Link Building</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Tags</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="border-gray-200 dark:border-gray-700">
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div>
                        <div className="font-semibold">{product.header}</div>
                        {product.subheader && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{product.subheader}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                      {product.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.showOnShop2 ? "default" : "secondary"}>
                        {product.showOnShop2 ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.showOnLinkBuilding ? "default" : "secondary"}>
                        {product.showOnLinkBuilding ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "destructive"}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.productTags.map((pt) => (
                          <span
                            key={pt.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white border"
                            style={{ 
                              backgroundColor: pt.tag.color || '#6B7280',
                              borderColor: pt.tag.color || '#6B7280'
                            }}
                          >
                            <TagIcon className="w-3 h-3 mr-1" />
                            {pt.tag.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/ecommerce/product/${product.slug}`} target="_blank">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/products/${product.id}`}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProduct(product.id, product.header)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first product'}
              </p>
              {!searchTerm && (
                <Button onClick={createQuick} className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Product
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
