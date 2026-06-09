import { useState, useEffect } from 'react';
import api from '../api';

export default function TherapistMessagingAdvanced() {
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Send message form
  const [sendForm, setSendForm] = useState({
    parent_id: '',
    parent_search: '',
    message_type: 'general',
    subject: '',
    content: ''
  });

  // Follow-up form
  const [followUpForm, setFollowUpForm] = useState({
    parent_id: '',
    parent_search: '',
    advice_subject: '',
    advice_content: ''
  });

  // Edit message form
  const [editForm, setEditForm] = useState({
    messageId: '',
    subject: '',
    content: ''
  });

  useEffect(() => {
    if (activeTab === 'conversations') {
      fetchConversations();
    }
  }, [activeTab]);

  async function fetchConversations() {
    setLoading(true);
    try {
      const { data } = await api.get('/therapists/messages/conversations');
      setConversations(data.conversations);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setLoading(false);
    }
  }

  async function handleViewConversation(parentId) {
    try {
      const { data } = await api.get(`/therapists/messages/${parentId}`);
      setMessages(data.messages);
      setSelectedConversation(parentId);
    } catch (err) {
      alert(' Failed to load conversation');
    }
  }

  async function handleSendMessage() {
    if (!sendForm.parent_id || !sendForm.content) {
      alert(' Please select parent and enter message');
      return;
    }

    try {
      await api.post('/therapists/messages/send', {
        parent_id: sendForm.parent_id,
        message_type: sendForm.message_type,
        subject: sendForm.subject || 'Message from therapist',
        content: sendForm.content
      });
      alert(' Message sent');
      setSendForm({ parent_id: '', parent_search: '', message_type: 'general', subject: '', content: '' });
      fetchConversations();
    } catch (err) {
      alert(' Failed to send message');
    }
  }

  async function handleSendFollowUp() {
    if (!followUpForm.parent_id || !followUpForm.advice_subject || !followUpForm.advice_content) {
      alert(' Please select parent and fill in subject & advice');
      return;
    }

    try {
      await api.post('/therapists/messages/follow-up', {
        parent_id: followUpForm.parent_id,
        advice_subject: followUpForm.advice_subject,
        advice_content: followUpForm.advice_content
      });
      alert(' Follow-up advice sent');
      setFollowUpForm({ parent_id: '', parent_search: '', advice_subject: '', advice_content: '' });
      fetchConversations();
    } catch (err) {
      alert(' Failed to send follow-up');
    }
  }

  async function handleEditMessage(messageId, subject, content) {
    if (!subject || !content) {
      alert(' Subject and content required');
      return;
    }

    try {
      await api.put(`/therapists/messages/${messageId}/edit`, { subject, content });
      alert(' Message updated');
      if (selectedConversation) {
        handleViewConversation(selectedConversation);
      }
      setEditForm({ messageId: '', subject: '', content: '' });
    } catch (err) {
      alert(' Failed to edit message');
    }
  }

  async function handleDeleteMessage(messageId) {
    if (!window.confirm(' Delete this message?')) return;

    try {
      await api.delete(`/therapists/messages/${messageId}`);
      alert(' Message deleted');
      if (selectedConversation) {
        handleViewConversation(selectedConversation);
      }
    } catch (err) {
      alert(' Failed to delete message');
    }
  }

  async function handleDeleteConversation(parentId) {
    if (!window.confirm(' Delete entire conversation? This cannot be undone!')) return;

    try {
      await api.delete(`/therapists/messages/conversation/${parentId}`);
      alert(' Conversation deleted');
      fetchConversations();
      setSelectedConversation(null);
    } catch (err) {
      alert(' Failed to delete conversation');
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('conversations'); setSelectedConversation(null); }}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'conversations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Conversations
        </button>
        <button
          onClick={() => setActiveTab('send')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'send'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Send Message
        </button>
        <button
          onClick={() => setActiveTab('follow-up')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'follow-up'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Follow-up Advice
        </button>
      </div>

      {/* CONVERSATIONS TAB */}
      {activeTab === 'conversations' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Messages & Conversations</h2>

          {!selectedConversation ? (
            <>
              {/* Conversation List */}
              {loading ? (
                <div className="text-center py-8 text-slate-600">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-slate-600">No conversations yet</div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-400 cursor-pointer transition"
                      onClick={() => handleViewConversation(conv.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-900">{conv.name}</h4>
                          <p className="text-sm text-slate-600">{conv.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{conv.message_count} messages</p>
                          <p className="text-xs text-slate-500">
                            {new Date(conv.last_message_at).toLocaleDateString()}
                          </p>
                          {conv.unread === false && (
                            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                               Unread
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Message Thread */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
                  >
                     Back to Conversations
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(selectedConversation)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                     Delete Conversation
                  </button>
                </div>

                {/* Messages */}
                <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-center text-slate-600 py-8">No messages in this conversation</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg border ${
                          msg.sender_id === msg.receiver_id
                            ? 'bg-blue-50 border-blue-200 ml-12'
                            : 'bg-slate-50 border-slate-200 mr-12'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{msg.sender_name}</p>
                            {msg.subject && (
                              <p className="text-sm font-medium text-slate-700 mt-1"> {msg.subject}</p>
                            )}
                            <p className="text-sm text-slate-700 mt-2">{msg.content}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              {new Date(msg.created_at).toLocaleString()}
                            </p>
                            {msg.message_type === 'follow_up_advice' && (
                              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                 Follow-up Advice
                              </span>
                            )}
                          </div>
                          <div className="ml-4 space-y-2 flex flex-col">
                            <button
                              onClick={() => setEditForm({ messageId: msg.id, subject: msg.subject, content: msg.content })}
                              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                               Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            >
                               Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SEND MESSAGE TAB */}
      {activeTab === 'send' && (
        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900"> Send Message to Parents</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2"> Find Parent</label>
            <input
              type="text"
              placeholder="Type parent name or email..."
              value={sendForm.parent_search}
              onChange={(e) => setSendForm({ ...sendForm, parent_search: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {sendForm.parent_search && conversations.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {conversations
                .filter((c) =>
                  c.name.toLowerCase().includes(sendForm.parent_search.toLowerCase()) ||
                  c.email.toLowerCase().includes(sendForm.parent_search.toLowerCase())
                )
                .map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100 cursor-pointer"
                    onClick={() => setSendForm({ ...sendForm, parent_id: conv.id, parent_search: '' })}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{conv.name}</p>
                      <p className="text-xs text-slate-600">{conv.email}</p>
                    </div>
                    <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {sendForm.parent_id && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  Selected: {conversations.find((c) => c.id === sendForm.parent_id)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message Type</label>
                <select
                  value={sendForm.message_type}
                  onChange={(e) => setSendForm({ ...sendForm, message_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General Message</option>
                  <option value="appointment">Appointment Related</option>
                  <option value="progress">Progress Update</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="Message subject..."
                  value={sendForm.subject}
                  onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  placeholder="Type your message..."
                  value={sendForm.content}
                  onChange={(e) => setSendForm({ ...sendForm, content: e.target.value })}
                  rows="6"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSendMessage}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                 Send Message
              </button>
            </>
          )}
        </div>
      )}

      {/* FOLLOW-UP ADVICE TAB */}
      {activeTab === 'follow-up' && (
        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900"> Send Follow-up Advice</h2>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm text-green-800">
               Use this to send professional advice and recommendations to parents after sessions.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2"> Find Parent</label>
            <input
              type="text"
              placeholder="Type parent name or email..."
              value={followUpForm.parent_search}
              onChange={(e) => setFollowUpForm({ ...followUpForm, parent_search: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {followUpForm.parent_search && conversations.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {conversations
                .filter((c) =>
                  c.name.toLowerCase().includes(followUpForm.parent_search.toLowerCase()) ||
                  c.email.toLowerCase().includes(followUpForm.parent_search.toLowerCase())
                )
                .map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100 cursor-pointer"
                    onClick={() => setFollowUpForm({ ...followUpForm, parent_id: conv.id, parent_search: '' })}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{conv.name}</p>
                      <p className="text-xs text-slate-600">{conv.email}</p>
                    </div>
                    <button className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {followUpForm.parent_id && (
            <>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-900">
                  Selected: {conversations.find((c) => c.id === followUpForm.parent_id)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Advice Topic/Title</label>
                <input
                  type="text"
                  placeholder="e.g., Exercise Recommendations, Behavioral Strategies..."
                  value={followUpForm.advice_subject}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, advice_subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Detailed Advice</label>
                <textarea
                  placeholder="Provide detailed, professional advice and recommendations..."
                  value={followUpForm.advice_content}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, advice_content: e.target.value })}
                  rows="8"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSendFollowUp}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                 Send Follow-up Advice
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit Message Modal */}
      {editForm.messageId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Edit Message</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
              <input
                type="text"
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows="6"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEditMessage(editForm.messageId, editForm.subject, editForm.content)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                 Save Changes
              </button>
              <button
                onClick={() => setEditForm({ messageId: '', subject: '', content: '' })}
                className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                 Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
