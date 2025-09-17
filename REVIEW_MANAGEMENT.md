# Review Management System

This document explains the smart review management system implemented for the ecommerce flow.

## Overview

The review management system allows admins to create and manage reviews that can be intelligently displayed across different products based on tags and other criteria. This provides a flexible way to showcase customer feedback without being limited to product-specific reviews.

## Features

### Admin Features
- **Review Management**: Full CRUD operations for reviews
- **Smart Filtering**: Filter reviews by product, tags, approval status, and search terms
- **Tag-based Visibility**: Assign tags to reviews to control which products they appear on
- **Product Association**: Link reviews to specific products or make them global
- **Approval System**: Control which reviews are visible to customers
- **Display Ordering**: Control the order in which reviews appear

### Customer Features
- **Smart Review Display**: Reviews automatically appear on relevant products based on tags
- **Global Reviews**: Reviews without product association can appear on multiple products
- **Tag-based Filtering**: Only reviews with matching tags appear on products
- **Responsive Design**: Mobile-friendly review display

## Database Schema

The system uses the following key models:

### Review Model
```prisma
model Review {
  id              String   @id @default(cuid())
  productId       String?  @map("product_id")  // Optional - null for global reviews
  authorName      String   @map("author_name")
  rating          Int      // 1-5 stars
  bodyMarkdown    String   @map("body_markdown")
  isApproved      Boolean  @default(true) @map("is_approved")
  displayOrder    Int      @default(0) @map("display_order")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  product         Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  reviewTags      ReviewTag[]
}
```

### ReviewTag Model (Many-to-Many)
```prisma
model ReviewTag {
  id        String  @id @default(cuid())
  reviewId  String  @map("review_id")
  tagId     String  @map("tag_id")
  assignedAt DateTime @default(now()) @map("assigned_at")
  
  review    Review  @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)
}
```

## Usage

### Admin Interface

1. **Access**: Navigate to `/admin/reviews` in the admin panel
2. **Create Review**: Click "Add Review" to create a new review
3. **Configure Visibility**:
   - Select a specific product (optional)
   - Assign tags to control which products the review appears on
   - Set approval status
   - Configure display order

### Product Integration

Use the `ReviewsDisplay` component on product pages:

```tsx
import { ReviewsDisplay } from '@/components/reviews-display'

// On a product page
<ReviewsDisplay 
  productId={product.id}
  productTags={product.productTags?.map(pt => pt.tag.id) || []}
  maxReviews={10}
  showGlobalReviews={true}
/>
```

### API Endpoints

#### Admin API (`/api/admin/reviews`)
- `GET` - List reviews with filtering
- `POST` - Create new review
- `PUT` - Update existing review
- `DELETE` - Delete review

#### Public API (`/api/reviews`)
- `GET` - Get reviews for public display with smart filtering

## Smart Filtering Logic

### Review Visibility Rules

1. **Product-Specific Reviews**: Reviews with a `productId` only appear on that specific product
2. **Global Reviews**: Reviews without a `productId` can appear on multiple products based on tags
3. **Tag Matching**: Reviews only appear on products that have matching tags
4. **Approval Status**: Only approved reviews are visible to customers
5. **Display Order**: Reviews are sorted by `displayOrder` then by creation date

### Example Scenarios

**Scenario 1: Product-Specific Review**
- Review has `productId: "product-123"`
- Review appears only on that specific product
- Tags are ignored for product-specific reviews

**Scenario 2: Global Review with Tags**
- Review has `productId: null` and tags: `["premium", "seo"]`
- Review appears on any product that has either "premium" or "seo" tags
- Review also appears on products with no tags if `showGlobalReviews=true`

**Scenario 3: Global Review without Tags**
- Review has `productId: null` and no tags
- Review appears on all products if `showGlobalReviews=true`

## Configuration

### Component Props

```tsx
interface ReviewsDisplayProps {
  productId?: string                    // Specific product ID
  productTags?: string[]               // Array of product tag IDs
  maxReviews?: number                  // Maximum number of reviews to show (default: 10)
  showGlobalReviews?: boolean          // Show global reviews (default: true)
}
```

### Admin Filtering

The admin interface supports filtering by:
- **Search**: Author name or review content
- **Product**: Specific product
- **Tag**: Specific tag
- **Status**: Approved/Pending
- **Pagination**: Page-based navigation

## Best Practices

1. **Tag Strategy**: Use consistent tag naming and assign relevant tags to both products and reviews
2. **Review Quality**: Ensure reviews are well-written and provide value to customers
3. **Display Order**: Use display order to highlight the most important reviews
4. **Global Reviews**: Use global reviews for general testimonials that apply to multiple products
5. **Product-Specific Reviews**: Use product-specific reviews for detailed feedback about specific features

## Future Enhancements

Potential improvements to consider:
- Review analytics and metrics
- Review moderation workflow
- Customer review submission form
- Review rating aggregation
- Review search and filtering for customers
- Review export functionality
- Review templates for common scenarios
