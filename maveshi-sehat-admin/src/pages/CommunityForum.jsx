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
  CheckCircle2,
  LayoutGrid,
  List,
  Sparkles,
  Flame,
  ImageIcon
} from 'lucide-react';
import '../styles/CommunityForum.css';

export default function CommunityForum() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  
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

  const getCategoryClass = (category) => {
    const c = (category || '').toLowerCase();
    if (c.includes('trend')) return 'trending';
    if (c.includes('disease') || c.includes('symptom')) return 'disease';
    if (c.includes('nutri') || c.includes('feed')) return 'nutrition';
    if (c.includes('breed') || c.includes('genet')) return 'breeding';
    return 'general';
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
      <div className="forum-page-header">
        <div className="forum-header-left">
          <h2 className="forum-header-title">Community Forum Moderation</h2>
          <p className="forum-header-subtitle">
            Oversee farmer-vet discussions, monitor questions, and moderate inappropriate or unverified content.
          </p>
        </div>

        <div className="forum-header-right">
          {/* View Toggle */}
          <div className="forum-view-mode-pill">
            <button 
              className={`forum-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid of moderation cards"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
            <button 
              className={`forum-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Dense administrative table view"
            >
              <List size={14} />
              <span>Table</span>
            </button>
          </div>

          <button 
            className="forum-refresh-btn" 
            onClick={fetchPosts} 
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          backgroundColor: feedback.type === 'error' ? '#fef2f2' : '#ecfdf5',
          border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
          color: feedback.type === 'error' ? '#991b1b' : '#065f46',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={16} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Executive Summary KPI Strip */}
      <div className="forum-summary-strip">
        <div className="forum-summary-card">
          <div className="forum-summary-icon indigo">
            <MessageSquare size={20} />
          </div>
          <div className="forum-summary-content">
            <span className="forum-summary-val">{totalPostsCount}</span>
            <span className="forum-summary-lbl">Total Discussions</span>
            <span className="forum-summary-sub">Published topics</span>
          </div>
        </div>

        <div className="forum-summary-card">
          <div className="forum-summary-icon emerald">
            <MessageCircle size={20} />
          </div>
          <div className="forum-summary-content">
            <span className="forum-summary-val">{totalCommentsCount}</span>
            <span className="forum-summary-lbl">Active Replies</span>
            <span className="forum-summary-sub">Community answers</span>
          </div>
        </div>

        <div className="forum-summary-card">
          <div className="forum-summary-icon amber">
            <Users size={20} />
          </div>
          <div className="forum-summary-content">
            <span className="forum-summary-val">{farmerPostsCount}</span>
            <span className="forum-summary-lbl">Farmer Inquiries</span>
            <span className="forum-summary-sub">Grassroots livestock cases</span>
          </div>
        </div>

        <div className="forum-summary-card">
          <div className="forum-summary-icon blue">
            <Award size={20} />
          </div>
          <div className="forum-summary-content">
            <span className="forum-summary-val">{vetPostsCount}</span>
            <span className="forum-summary-lbl">Vet Advices</span>
            <span className="forum-summary-sub">Certified medical guidance</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="forum-filter-bar">
        <div className="forum-filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12.5px', fontWeight: 700 }}>
            <Filter size={15} />
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
            <option value="All">All Roles</option>
            <option value="farmer">Farmers</option>
            <option value="vet">Veterinarians</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="forum-search-box">
          <Search size={15} className="forum-search-icon" />
          <input 
            type="text"
            className="forum-search-input"
            placeholder="Search discussion, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content Area: Loading / Empty / Cards / Table */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
          <p style={{ fontSize: '13.5px', fontWeight: 600 }}>Loading community discussions...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '50px 20px',
          textAlign: 'center',
          border: '1px solid var(--border-light)'
        }}>
          <MessageSquare size={42} style={{ color: '#cbd5e1', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            No discussions found
          </h3>
          <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '380px', margin: '0 auto' }}>
            No forum posts match your current search or category filter. Try clearing the filters.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* High-Density Moderation Table View */
        <div className="forum-table-card">
          <table className="forum-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Discussion Topic & Preview</th>
                <th>Category</th>
                <th>Media</th>
                <th>Engagement</th>
                <th>Posted</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
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
                const categoryClass = getCategoryClass(post.category);

                return (
                  <tr key={post.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className={`forum-avatar ${roleBadgeClass}`}>
                          {authorInitials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{post.author_name || 'Anonymous'}</div>
                          <span className={`forum-role-pill ${roleBadgeClass}`}>
                            {authorRole === 'vet' && 'Dr. '}{authorRole}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ maxWidth: '340px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px', lineHeight: 1.3 }}>
                        {post.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.description}
                      </div>
                    </td>

                    <td>
                      <span className={`forum-category-pill ${categoryClass}`}>
                        {post.category || 'General'}
                      </span>
                    </td>

                    <td>
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="Thumbnail" 
                          className="forum-thumb-mini"
                          onClick={() => setZoomedImage(imageUrl)}
                          title="Click to zoom image"
                        />
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>None</span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Heart size={13} style={{ color: '#ef4444' }} /> {post.likes_count || 0}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MessageCircle size={13} style={{ color: '#3b82f6' }} /> {post.comments_count || 0}
                        </span>
                      </div>
                    </td>

                    <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatRelativeTime(post.created_at)}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          className="forum-view-thread-btn"
                          onClick={() => handleOpenThread(post)}
                          title="Inspect discussion comments and replies"
                        >
                          <Eye size={13} />
                          <span>Inspect ({post.comments_count || 0})</span>
                        </button>

                        <button 
                          className="forum-delete-btn"
                          onClick={() => handleDeletePost(post.id, post.title)}
                          title="Remove post"
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Compact 2-Column Responsive Card Grid */
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
            const categoryClass = getCategoryClass(post.category);

            return (
              <div className="forum-post-card" key={post.id}>
                <div>
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

                    <div className={`forum-category-pill ${categoryClass}`}>
                      {categoryClass === 'trending' && <Flame size={12} />}
                      <span>{post.category || 'General'}</span>
                    </div>
                  </div>

                  {/* Post Title & Description */}
                  <div className="forum-post-body" style={{ marginTop: '10px' }}>
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
                        <ZoomIn size={12} />
                        <span>Zoom</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Metrics & Moderation Actions */}
                <div className="forum-card-footer">
                  <div className="forum-metrics-group">
                    <span className="forum-metric-item">
                      <Heart size={13} style={{ color: '#ef4444' }} />
                      <span>{post.likes_count || 0}</span>
                    </span>
                    <span className="forum-metric-item">
                      <MessageCircle size={13} style={{ color: '#3b82f6' }} />
                      <span>{post.comments_count || 0} replies</span>
                    </span>
                  </div>

                  <div className="forum-actions-group">
                    <button 
                      className="forum-view-thread-btn"
                      onClick={() => handleOpenThread(post)}
                      title="Inspect discussion comments and replies"
                    >
                      <Eye size={13} />
                      <span>Inspect ({post.comments_count || 0})</span>
                    </button>

                    <button 
                      className="forum-delete-btn"
                      onClick={() => handleDeletePost(post.id, post.title)}
                      title="Remove inappropriate post"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
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
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
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
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
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

                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: 'var(--text-main)' }}>
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
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Replies & Comments ({threadComments.length})
                  </h4>
                </div>

                {threadLoading ? (
                  <div style={{ padding: '30px 0', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <span style={{ fontSize: '12.5px' }}>Loading replies...</span>
                  </div>
                ) : threadComments.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
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
                          <Trash2 size={12} />
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
