import { Response } from 'express';
import mongoose from 'mongoose';
import { Discussion } from '../models/Discussion';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const getDiscussions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tag } = req.query;
    const filter: any = {};

    if (tag && tag !== 'All') {
      filter.tag = tag;
    }

    const posts = await Discussion.find(filter).sort({ createdAt: -1 });
    const currentUserId = req.user?.userId;

    const formattedPosts = posts.map((p) => {
      const isLiked = currentUserId
        ? p.likes.some((id) => id.toString() === currentUserId)
        : false;

      return {
        id: p._id,
        _id: p._id,
        author: p.authorName,
        unit: p.unit,
        title: p.title,
        content: p.content,
        tag: p.tag,
        likes: p.likes.length,
        liked: isLiked,
        commentsCount: p.comments.length,
        comments: p.comments,
        createdAt: p.createdAt,
      };
    });

    res.json({ success: true, data: formattedPosts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch discussions.', error: err.message });
  }
};

export const createDiscussion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, tag } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and content are required.' });
      return;
    }

    const user = req.user!;
    const post = await Discussion.create({
      authorId: user.userId,
      authorName: user.name,
      unit: `${user.unit?.block || 'Block A'} - ${user.unit?.flat || 'Resident'}`,
      title,
      content,
      tag: tag || 'General Ideas',
      likes: [],
      comments: [],
    });

    res.status(201).json({ success: true, message: 'Discussion post created.', data: post });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create discussion post.', error: err.message });
  }
};

export const toggleLike = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const post = await Discussion.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const hasLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      data: {
        likesCount: post.likes.length,
        liked: !hasLiked,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to toggle like.', error: err.message });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
      return;
    }

    const post = await Discussion.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    const user = req.user!;
    const newComment = {
      authorId: new mongoose.Types.ObjectId(user.userId),
      authorName: user.name,
      unit: `${user.unit?.block || 'Block A'} - ${user.unit?.flat || ''}`,
      content,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    res.status(201).json({ success: true, message: 'Comment posted.', data: newComment });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to add comment.', error: err.message });
  }
};

export const deleteDiscussion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const post = await Discussion.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    const isOwner = post.authorId.toString() === req.user?.userId;
    const isAdmin = ['admin', 'superadmin', 'committee'].includes(req.user?.role || '');

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to delete this post.' });
      return;
    }

    await post.deleteOne();

    if (isAdmin && !isOwner) {
      await logAuditEvent(req, 'DISCUSSION_MODERATE_DELETE', 'Discussion', req.params.id, { title: post.title });
    }

    res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete discussion post.', error: err.message });
  }
};
