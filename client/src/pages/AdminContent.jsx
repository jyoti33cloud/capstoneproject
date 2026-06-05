import { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useLang } from '../context/LangContext';

export default function AdminContent() {
  const { getFlaggedPosts, approvePost, deletePost, loading } = useAdmin();
  const { t } = useLang();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    const data = await getFlaggedPosts();
    setPosts(data || []);
  }

  async function handleApprove(id) {
    const result = await approvePost(id);
    if (result) {
      setPosts(posts.filter(p => p.id !== id));
    }
  }

  async function handleDelete(id) {
    const result = await deletePost(id, deleteReason);
    if (result) {
      setPosts(posts.filter(p => p.id !== id));
      setSelectedPost(null);
      setDeleteReason('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/60 p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Content Moderation</h1>
        <p className="text-slate-600">Review and manage flagged posts</p>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-slate-600">No flagged posts</div>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">By {post.name}</h3>
                  <p className="text-slate-600 mt-2 line-clamp-2">{post.content}</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                  Flagged
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs text-slate-600">
                Email: {post.email}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(post.id)}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => setSelectedPost(post)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Delete this post?</h3>
            <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm text-slate-700 max-h-32 overflow-y-auto">
              {selectedPost.content}
            </div>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Reason for deletion (optional)"
              className="w-full border border-slate-200 rounded-lg p-3 mb-4 text-sm resize-none"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPost(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedPost.id)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
