import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  MessageCircle, 
  Trash2, 
  Search, 
  RefreshCw, 
  X, 
  Eye, 
  Heart, 
  ShieldAlert, 
  Filter, 
  ZoomIn, 
  AlertTriangle,
  UserCheck,
  Award,
  Users,
  CheckCircle2
} from 'lucide-react';
import '../styles/CommunityForum.css';

export default function CommunityForum() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  
  // Thread & Comments Modal State
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadComments, setThreadComments] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);

  // Full-size Image Lightbox State
  const [zoomedImage, setZoomedImage] = useState(null);

  // Status feedback toast
  const [feedback, setFeedback] = useState(null);

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const resolveImageUrl = (url) => {
    if (!url) return null;
    return url.replace('10.0.2.2:5000', 'localhost:5000');
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (isNaN(diffInSeconds)) return 'Recently';
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/forum/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        console.error('Failed to fetch forum posts');
      }
    } catch (err) {
      console.error('Error fetching forum posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Delete Post Action
  const handleDeletePost = async (postId, postTitle) => {
    const confirmMsg = `Are you sure you want to delete this forum post?\n\n"${postTitle}"\n\nThis will permanently remove the post and all associated comments.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/forum/posts/${postId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (selectedThread?.id === postId) {
          setSelectedThread(null);
        }
        showToast('Forum post deleted successfully by Admin.');
      } else {
        alert('Failed to delete post. Server returned an error.');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Network error while deleting post.');
    }
  };

  // Open Thread and Load Comments
  const handleOpenThread = async (post) => {
    setSelectedThread(post);
    setThreadLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/forum/posts/${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setThreadComments(data.comments || []);
      }
    } catch (err) {
      console.error('Error fetching thread details:', err);
    } finally {
      setThreadLoading(false);
    }
  };

  // Delete Individual Comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/forum/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setThreadComments(prev => prev.filter(c => c.id !== commentId));
        // Update comments count in posts list
        if (selectedThread) {
          setPosts(prev => prev.map(p => {
            if (p.id === selectedThread.id) {
              const currentCount = Math.max(0, (parseInt(p.comments_count) || 1) - 1);
              return { ...p, comments_count: currentCount };
            }
            return p;
          }));
        }
        showToast('Inappropriate comment removed successfully.');
      } else {
        alert('Failed to delete comment.');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Network error while deleting comment.');
    }
  };

  // Calculate Metrics
  const totalPostsCount = posts.length;
  const totalCommentsCount = posts.reduce((sum, p) => sum + (parseInt(p.comments_count) || 0), 0);
  const farmerPostsCount = posts.filter(p => p.author_role === 'farmer').length;
  const vetPostsCount = posts.filter(p => p.author_role === 'vet').length;

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesRole = selectedRole === 'All' || post.author_role === selectedRole;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      post.title?.toLowerCase().includes(query) ||
      post.description?.toLowerCase().includes(query) ||
      post.author_name?.toLowerCase().includes(query);

    return matchesCategory && matchesRole && matchesSearch;
  });

  return (
    <div className="forum-moderation-view">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Community Forum Moderation</h2>
          <p className="page-subtitle">
            Oversee farmer-vet community discussions, monitor questions, and moderate inappropriate or unverified content.
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={fetchPosts} 
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Discussions</span>
        </button>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          backgroundColor: feedback.type === 'error' ? '#fef2f2' : '#ecfdf5',
          border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
          color: feedback.type === 'error' ? '#991b1b' : '#065f46',
          fontSize: '13.5px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Executive Summary KPI Strip */}
      <div className="forum-summary-strip">
        <div className="forum-summary-card">
          <div className="forum-summary-icon indigo">
            <MessageSquare size={22} />
          </div>
          <div className="forum-summary-content">
            <span className="forum-summary-val">{totalPostsCount}</span>
            <span className="forum-summary-lbl">Total Discussions</span>
            <span className="forum-summary-sub">Published topics</span>
          </div>
        </div>

        <div className="forum-summary-card">
          <div className="forum-summary-icon emerald">
            <MessageCircle size={22} />
          </div>
          <div className="forum-summary-content">
            <span className="forum-summary-val">{totalCommentsCount}</span>
            <span className="forum-summary-lbl">Active Replies</span>
            <span className="forum-summary-sub">Community answers</span>
          </div>
        </div>

        <div className="forum-summary-card">
          <div className="forum-summary-icon amber">
            <Users size={22} />
          </div>
          <div className="forum-summary-content">
            <span className="forum-summary-val">{farmerPostsCount}</span>
            <span className="forum-summary-lbl">Farmer Inquiries</span>
            <span className="forum-summary-sub">Grassroots livestock cases</span>
          </div>
        </div>

        <div className="forum-summary-card">
          <div className="forum-summary-icon blue">
            <Award size={22} />
          </div>
          <div className="forum-summary-content">
            <span className="forum-summary-val">{vetPostsCount}</span>
            <span className="forum-summary-lbl">Vet Advices & Alerts</span>
            <span className="forum-summary-sub">Certified medical guidance</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="forum-filter-bar">
        <div className="forum-filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
            <Filter size={16} />
            <span>Filters:</span>
          </div>

          <select 
            className="forum-select-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="General">General</option>
            <option value="Disease">Disease & Symptoms</option>
            <option value="Nutrition">Nutrition & Feed</option>
            <option value="Breeding">Breeding & Genetics</option>
            <option value="Trending">Trending</option>
          </select>

          <select 
            className="forum-select-filter"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="All">All Author Roles</option>
            <option value="farmer">Farmers Only</option>
            <option value="vet">Vets Only</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div className="forum-search-box">
          <Search size={16} className="forum-search-icon" />
          <input 
            type="text"
            className="forum-search-input"
            placeholder="Search discussion, topic, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Discussions Feed */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading community discussions...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px solid var(--border-light)'
        }}>
          <MessageSquare size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            No discussions found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
            No forum posts match your current search or category filter. Try selecting "All Categories" or clearing the search text.
          </p>
        </div>
      ) : (
        <div className="forum-posts-grid">
          {filteredPosts.map(post => {
            const authorRole = post.author_role || 'farmer';
            const roleBadgeClass = authorRole === 'vet' ? 'vet' : (authorRole === 'admin' ? 'admin' : 'farmer');
            const authorInitials = (post.author_name || 'User')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map(n => n[0])
              .join('')
              .toUpperCase();

            const imageUrl = resolveImageUrl(post.image_url);

            return (
              <div className="forum-post-card" key={post.id}>
                {/* Top Author Bar */}
                <div className="forum-card-top">
                  <div className="forum-author-block">
                    <div className={`forum-avatar ${roleBadgeClass}`}>
                      {authorInitials}
                    </div>
                    <div>
                      <h4 className="forum-author-name">{post.author_name || 'Anonymous User'}</h4>
                      <div className="forum-author-meta">
                        <span className={`forum-role-pill ${roleBadgeClass}`}>
                          {authorRole === 'vet' && 'Dr. '}
                          {authorRole}
                        </span>
                        <span className="forum-timestamp">
                          • {formatRelativeTime(post.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="forum-category-pill">
                    {post.category || 'General'}
                  </div>
                </div>

                {/* Post Title & Description */}
                <div>
                  <h3 className="forum-post-title">{post.title}</h3>
                  <p className="forum-post-desc">{post.description}</p>
                </div>

                {/* Attached Image Thumbnail */}
                {imageUrl && (
                  <div 
                    className="forum-media-container"
                    onClick={() => setZoomedImage(imageUrl)}
                    title="Click to view full image"
                  >
                    <img 
                      src={imageUrl} 
                      alt={post.title} 
                      className="forum-media-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="forum-media-zoom-overlay">
                      <ZoomIn size={14} />
                      <span>Zoom Photo</span>
                    </div>
                  </div>
                )}

                {/* Card Footer: Metrics & Moderation Actions */}
                <div className="forum-card-footer">
                  <div className="forum-metrics-group">
                    <span className="forum-metric-item">
                      <Heart size={14} style={{ color: '#ef4444' }} />
                      <span>{post.likes_count || 0} likes</span>
                    </span>
                    <span className="forum-metric-item">
                      <MessageCircle size={14} style={{ color: '#3b82f6' }} />
                      <span>{post.comments_count || 0} replies</span>
                    </span>
                  </div>

                  <div className="forum-actions-group">
                    <button 
                      className="forum-view-thread-btn"
                      onClick={() => handleOpenThread(post)}
                      title="Inspect discussion comments and replies"
                    >
                      <Eye size={14} />
                      <span>Inspect Thread & Comments ({post.comments_count || 0})</span>
                    </button>

                    <button 
                      className="forum-delete-btn"
                      onClick={() => handleDeletePost(post.id, post.title)}
                      title="Remove inappropriate or abusive post from community"
                    >
                      <Trash2 size={14} />
                      <span>Remove Post</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comments & Thread Inspection Modal */}
      {selectedThread && (
        <div className="forum-modal-backdrop" onClick={() => setSelectedThread(null)}>
          <div className="forum-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="forum-modal-header">
              <div>
                <h3 className="forum-modal-title">Thread Moderation</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Review full conversation thread and remove spam or offensive replies
                </p>
              </div>
              <button 
                onClick={() => setSelectedThread(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="forum-modal-body">
              {/* Original Post Preview */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>
                      {selectedThread.author_name}
                    </span>
                    <span className={`forum-role-pill ${selectedThread.author_role}`}>
                      {selectedThread.author_role}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {formatRelativeTime(selectedThread.created_at)}
                  </span>
                </div>

                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {selectedThread.title}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                  {selectedThread.description}
                </p>

                {selectedThread.image_url && (
                  <div style={{ marginTop: '6px' }}>
                    <img 
                      src={resolveImageUrl(selectedThread.image_url)} 
                      alt="Attached" 
                      style={{ maxHeight: '180px', borderRadius: '8px', cursor: 'pointer' }}
                      onClick={() => setZoomedImage(resolveImageUrl(selectedThread.image_url))}
                    />
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="forum-comments-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Replies & Comments ({threadComments.length})
                  </h4>
                </div>

                {threadLoading ? (
                  <div style={{ padding: '30px 0', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <span style={{ fontSize: '13px' }}>Loading replies...</span>
                  </div>
                ) : threadComments.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No comments posted yet under this discussion.
                  </div>
                ) : (
                  threadComments.map(comment => (
                    <div className="forum-comment-card" key={comment.id}>
                      <div className="forum-comment-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="forum-comment-author">{comment.author_name}</span>
                          <span className={`forum-role-pill ${comment.author_role}`}>
                            {comment.author_role}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {formatRelativeTime(comment.created_at)}
                          </span>
                        </div>

                        <button 
                          className="forum-del-comment-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                          title="Delete this comment"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>

                      <p className="forum-comment-text">{comment.comment}</p>

                      {comment.image_url && (
                        <div style={{ marginTop: '4px' }}>
                          <img 
                            src={resolveImageUrl(comment.image_url)} 
                            alt="Comment attachment" 
                            style={{ maxHeight: '120px', borderRadius: '6px', cursor: 'pointer' }}
                            onClick={() => setZoomedImage(resolveImageUrl(comment.image_url))}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="forum-modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedThread(null)}
              >
                Close Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox Modal */}
      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={() => setZoomedImage(null)}>
          <div className="image-zoom-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-zoom-close" onClick={() => setZoomedImage(null)}>
              <X size={20} />
              <span>Close</span>
            </button>
            <img src={zoomedImage} alt="Enlarged preview" className="image-zoom-img" />
          </div>
        </div>
      )}
    </div>
  );
}
