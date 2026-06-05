import { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useLang } from '../context/LangContext';

export default function AdminForum() {
  const { getFlaggedComments, approveComment, deleteComment, loading } = useAdmin();
  const { t } = useLang();
  const [comments, setComments] = useState([]);
  const [selectedComment, setSelectedComment] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadComments();
  }, []);

  async function loadComments() {
    const data = await getFlaggedComments();
    setComments(data || []);
  }

  async function handleApprove(id) {
    const result = await approveComment(id);
    if (result) {
      setComments(comments.filter(c => c.id !== id));
    }
  }

  async function handleDelete(id) {
    const result = await deleteComment(id, deleteReason);
    if (result) {
      setComments(comments.filter(c => c.id !== id));
      setSelectedComment(null);
      setDeleteReason('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/60 p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Forum Moderation</h1>
        <p className="text-slate-600">Review and manage flagged comments</p>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-slate-600">No flagged comments</div>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">By {comment.name}</h3>
                  <p className="text-slate-600 mt-2 line-clamp-2">{comment.content}</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                  Flagged
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs text-slate-600">
                <div>Post ID: {comment.post_id}</div>
                <div>Email: {comment.email}</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(comment.id)}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => setSelectedComment(comment)}
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
      {selectedComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Delete this comment?</h3>
            <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm text-slate-700 max-h-32 overflow-y-auto">
              {selectedComment.content}
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
                onClick={() => setSelectedComment(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedComment.id)}
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
