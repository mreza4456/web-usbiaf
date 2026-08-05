'use server';

import { createClient, getAuthenticatedUser, isAdmin } from "@/config/supabase-server";
import { revalidatePath } from 'next/cache';

interface CreateCommentData {
  user_id: string;
  order_items_id: string;
  message: string;
  rating: string;
}

// ============================================
// CREATE COMMENT/REVIEW
// ============================================
export async function createComment(commentData: CreateCommentData) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    console.log('💬 COMMENT DEBUG - Creating comment:', {
      user_id: commentData.user_id,
      order_items_id: commentData.order_items_id,
      rating: commentData.rating
    });

    // Verify user
    if (user.id !== commentData.user_id) {
      return {
        success: false,
        message: 'Unauthorized: User ID mismatch'
      };
    }

    // Validate rating
    const validRatings = ['1', '2', '3', '4', '5'];
    if (!validRatings.includes(commentData.rating)) {
      return {
        success: false,
        message: 'Invalid rating. Must be between 1 and 5'
      };
    }

    // Validate message
    if (!commentData.message || commentData.message.trim().length === 0) {
      return {
        success: false,
        message: 'Comment message is required'
      };
    }

    if (commentData.message.trim().length > 500) {
      return {
        success: false,
        message: 'Comment message must not exceed 500 characters'
      };
    }

    // Check if order_item exists
    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .select('id, category_name, order_id')
      .eq('id', commentData.order_items_id)
      .single();

    if (orderItemError || !orderItem) {
      console.error('❌ Order item not found:', orderItemError);
      return {
        success: false,
        message: 'Order item not found'
      };
    }

    // Verify that the order belongs to the user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderItem.order_id)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return {
        success: false,
        message: 'Order not found'
      };
    }

    if (order.user_id !== user.id) {
      return {
        success: false,
        message: 'Unauthorized: You can only review your own orders'
      };
    }

    // Check if user already reviewed this order item
    const { data: existingComment } = await supabase
      .from('comment')
      .select('id')
      .eq('order_items_id', commentData.order_items_id)
      .eq('user_id', commentData.user_id)
      .single();

    if (existingComment) {
      return {
        success: false,
        message: 'You have already reviewed this item'
      };
    }

    // Create comment
    const { data, error } = await supabase
      .from('comment')
      .insert([{
        user_id: commentData.user_id,
        order_items_id: commentData.order_items_id,
        message: commentData.message.trim(),
        rating: commentData.rating
      }])
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          avatar_url
        ),
        order_items (
          id,
          category_name,
          package_name,
          categories_id
        )
      `)
      .single();

    if (error) {
      console.error('❌ Comment creation error:', error);
      return {
        success: false,
        message: `Failed to create comment: ${error.message}`
      };
    }

    // Revalidate paths
    revalidatePath('/myorder');
    revalidatePath(`/categories/${data.order_items.categories_id}`);
    revalidatePath('/');

    console.log('✅ Comment created successfully:', data.id);

    return {
      success: true,
      message: 'Review submitted successfully',
      data
    };

  } catch (error: any) {
    console.error('❌ CREATE COMMENT EXCEPTION:', error);
    return {
      success: false,
      message: error.message || 'Failed to create comment'
    };
  }
}

// ============================================
// GET COMMENTS BY ORDER ITEM
// ============================================
export async function getCommentsByOrderItem(orderItemId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('comment')
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          avatar_url
        ),
        order_items (
          id,
          category_name,
          package_name,
          categories_id
        )
      `)
      .eq('order_items_id', orderItemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Get comments error:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error: any) {
    console.error('❌ GET COMMENTS EXCEPTION:', error);
    return {
      success: false,
      message: error.message || 'Failed to get comments',
      data: []
    };
  }
}

// ============================================
// GET COMMENTS BY CATEGORY
// ============================================
export async function getCommentsByCategory(categoryId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('comment')
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          avatar_url
        ),
        order_items!inner (
          id,
          category_name,
          package_name,
          categories_id
        )
      `)
      .eq('order_items.categories_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Get comments by category error:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error: any) {
    console.error('❌ GET COMMENTS BY CATEGORY EXCEPTION:', error);
    return {
      success: false,
      message: error.message || 'Failed to get comments',
      data: []
    };
  }
}

// ============================================
// GET COMMENTS BY USER
// ============================================
export async function getCommentsByUser(userId: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // Verify user
    if (user.id !== userId) {
      return {
        success: false,
        message: 'Unauthorized: User ID mismatch',
        data: []
      };
    }

    const { data, error } = await supabase
      .from('comment')
      .select(`
        *,
        users (
          id,
          email,
          full_name
        ),
        order_items (
          id,
          category_name,
          package_name,
          categories_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Get user comments error:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error: any) {
    console.error('❌ GET USER COMMENTS EXCEPTION:', error);
    return {
      success: false,
      message: error.message || 'Failed to get comments',
      data: []
    };
  }
}

// ============================================
// GET ALL COMMENTS (ADMIN ONLY)
// ============================================
export async function getAllComments() {
  try {
    const user = await getAuthenticatedUser();
    const adminCheck = await isAdmin(user.id);

    if (!adminCheck) {
      return {
        success: false,
        message: 'Access denied. Admin only.',
        data: []
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('comment')
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          avatar_url
        ),
        order_items (
          id,
          category_name,
          package_name,
          categories_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Get all comments error:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error: any) {
    console.error('❌ GET ALL COMMENTS EXCEPTION:', error);
    return {
      success: false,
      message: error.message || 'Failed to get comments',
      data: []
    };
  }
}

// ============================================
// UPDATE COMMENT (USER ONLY - OWN COMMENTS)
// ============================================
export async function updateComment(
  commentId: string,
  updateData: {
    message?: string;
    rating?: string;
  }
) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // Check if comment exists and belongs to user
    const { data: existingComment, error: checkError } = await supabase
      .from('comment')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (checkError || !existingComment) {
      return {
        success: false,
        message: 'Comment not found'
      };
    }

    // Verify ownership
    if (existingComment.user_id !== user.id) {
      return {
        success: false,
        message: 'Unauthorized: You can only edit your own comments'
      };
    }

    // Validate rating if provided
    if (updateData.rating) {
      const validRatings = ['1', '2', '3', '4', '5'];
      if (!validRatings.includes(updateData.rating)) {
        return {
          success: false,
          message: 'Invalid rating. Must be between 1 and 5'
        };
      }
    }

    // Validate message if provided
    if (updateData.message !== undefined) {
      if (!updateData.message || updateData.message.trim().length === 0) {
        return {
          success: false,
          message: 'Comment message cannot be empty'
        };
      }

      if (updateData.message.trim().length > 500) {
        return {
          success: false,
          message: 'Comment message must not exceed 500 characters'
        };
      }
    }

    // Prepare update payload
    const updatePayload: any = {};
    if (updateData.message !== undefined) {
      updatePayload.message = updateData.message.trim();
    }
    if (updateData.rating !== undefined) {
      updatePayload.rating = updateData.rating;
    }

    // Update comment
    const { data, error } = await supabase
      .from('comment')
      .update(updatePayload)
      .eq('id', commentId)
      .eq('user_id', user.id) // double check ownership
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          avatar_url
        ),
        order_items (
          id,
          category_name,
          package_name,
          categories_id
        )
      `)
      .single();

    if (error) {
      console.error('❌ Update comment error:', error);
      return {
        success: false,
        message: error.message
      };
    }

    // Revalidate paths
    revalidatePath('/myorder');
    revalidatePath(`/categories/${data.order_items.categories_id}`);

    console.log('✅ Comment updated successfully:', data.id);

    return {
      success: true,
      message: 'Comment updated successfully',
      data
    };

  } catch (error: any) {
    console.error('❌ UPDATE COMMENT EXCEPTION:', error);
    return {
      success: false,
      message: error.message || 'Failed to update comment'
    };
  }
}

// ============================================
// DELETE COMMENT
// ============================================
export async function deleteComment(commentId: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // Check if comment exists
    const { data: existingComment, error: checkError } = await supabase
      .from('comment')
      .select(`
        id, 
        user_id,
        order_items (
          categories_id
        )
      `)
      .eq('id', commentId)
      .single();

    if (checkError || !existingComment) {
      return {
        success: false,
        message: 'Comment not found'
      };
    }

    // Check if user is admin or comment owner
    const adminCheck = await isAdmin(user.id);
    const isOwner = existingComment.user_id === user.id;

    if (!adminCheck && !isOwner) {
      return {
        success: false,
        message: 'Unauthorized: You can only delete your own comments'
      };
    }

    // Delete comment
    const { error: deleteError } = await supabase
      .from('comment')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('❌ Delete comment error:', deleteError);
      return {
        success: false,
        message: `Failed to delete comment: ${deleteError.message}`
      };
    }

    

    console.log('✅ Comment deleted successfully:', commentId);

    return {
      success: true,
      message: 'Comment deleted successfully'
    };

  } catch (error: any) {
    console.error('❌ DELETE COMMENT EXCEPTION:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete comment'
    };
  }
}

// ============================================
// GET COMMENT STATISTICS BY CATEGORY
// ============================================
export async function getCategoryCommentStats(categoryId: string) {
  try {
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from('comment')
      .select(`
        rating,
        order_items!inner (
          categories_id
        )
      `)
      .eq('order_items.categories_id', categoryId);

    if (error) {
      console.error('❌ Get comment stats error:', error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }

    if (!comments || comments.length === 0) {
      return {
        success: true,
        data: {
          total_reviews: 0,
          average_rating: 0,
          rating_distribution: {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
          }
        }
      };
    }

    // Calculate statistics
    const totalReviews = comments.length;
    const ratingDistribution = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    };

    let totalRating = 0;

    comments.forEach(comment => {
      const rating = comment.rating;
      if (rating && ratingDistribution[rating as keyof typeof ratingDistribution] !== undefined) {
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
        totalRating += parseInt(rating);
      }
    });

    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;

    return {
      success: true,
      data: {
        total_reviews: totalReviews,
        average_rating: parseFloat(averageRating as string),
        rating_distribution: ratingDistribution
      }
    };

  } catch (error: any) {
    console.error('❌ GET COMMENT STATS EXCEPTION:', error);
    return {
      success: false,
      message: error.message || 'Failed to get comment statistics',
      data: null
    };
  }
}

// ============================================
// CHECK IF USER HAS REVIEWED AN ORDER ITEM
// ============================================
export async function hasUserReviewedOrderItem(userId: string, orderItemId: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // Verify user
    if (user.id !== userId) {
      return {
        success: false,
        message: 'Unauthorized: User ID mismatch',
        hasReviewed: false
      };
    }

    const { data, error } = await supabase
      .from('comment')
      .select('id')
      .eq('user_id', userId)
      .eq('order_items_id', orderItemId)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Check review error:', error);
      return {
        success: false,
        message: error.message,
        hasReviewed: false
      };
    }

    return {
      success: true,
      hasReviewed: !!data,
      commentId: data?.id || null
    };

  } catch (error: any) {
    console.error('❌ CHECK USER REVIEW EXCEPTION:', error);
    return {
      success: false,
      message: error.message || 'Failed to check user review',
      hasReviewed: false
    };
  }
}