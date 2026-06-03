import React, { useState } from 'react';
import api from '../utils/api';
import { useWorkspaceStore } from '../hooks/useStore';
import PageHeader from '../components/PageHeader';
import ResultBox from '../components/ResultBox';
import toast from 'react-hot-toast';

export default function Engagement() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);

  const [engForm, setEngForm] = useState({ biz_type: ws?.business_name || '', goal: 'Increase Comments', eng_type: 'customer' });
  const [engRes, setEngRes]   = useState('');
  const [engLoad, setEngLoad] = useState(false);

  const [comment, setComment]   = useState('');
  const [cType, setCType]       = useState('Positive / Compliment');
  const [replyTone, setReplyTone] = useState('Professional & Warm');
  const [replyRes, setReplyRes] = useState('');
  const [replyLoad, setReplyLoad] = useState(false);

  async function generateEngagement(engType) {
    if (!ws?.id) return toast.error('Select a workspace first.');
    setEngLoad(true); setEngRes('');
    try {
      const r = await api.post('/engagement/ideas', {
        workspace_id: ws.id,
        biz_type: engForm.biz_type,
        goal: engForm.goal,
        eng_type: engType,
      });
      setEngRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setEngLoad(false); }
  }

  async function generateReply() {
    if (!ws?.id) return toast.error('Select a workspace first.');
    if (!comment) return toast.error('Paste a comment first.');
    setReplyLoad(true); setReplyRes('');
    try {
      const r = await api.post('/engagement/reply', {
        workspace_id: ws.id,
        comment,
        comment_type: cType,
        tone: replyTone,
      });
      setReplyRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setReplyLoad(false); }
  }

  return (
    <div>
      <PageHeader title="Engagement" highlight="Hub" subtitle="Customer & employee engagement strategies and templates" />

      {/* Engagement ideas */}
      <div className="card">
        <div className="card-title">👥 Engagement Ideas Generator</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="input-group">
            <label className="label">Your Business Type</label>
            <input className="input" placeholder="e.g. Skincare brand, SaaS startup"
              value={engForm.biz_type} onChange={(e) => setEngForm({ ...engForm, biz_type: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="label">Engagement Goal</label>
            <select className="input" value={engForm.goal} onChange={(e) => setEngForm({ ...engForm, goal: e.target.value })}>
              {['Increase Comments', 'Boost Shares/Saves', 'DM Conversations', 'Community Building', 'Customer Feedback', 'UGC (User Generated Content)'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: '👥 Customer Ideas', type: 'customer' },
            { label: '👨‍💼 Employee Advocacy', type: 'employee' },
            { label: '📸 UGC Campaign', type: 'ugc' },
          ].map((b) => (
            <button key={b.type} className="btn btn-primary" onClick={() => generateEngagement(b.type)} disabled={engLoad}>
              {b.label}
            </button>
          ))}
        </div>
        <ResultBox result={engRes} loading={engLoad} loadingText="Generating engagement ideas..." />
      </div>

      {/* Comment reply */}
      <div className="card">
        <div className="card-title">💬 Comment Reply Generator</div>
        <div className="input-group">
          <label className="label">Comment you received</label>
          <textarea className="input" rows={3} placeholder="Paste the comment here..."
            value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="input-group">
            <label className="label">Comment Type</label>
            <select className="input" value={cType} onChange={(e) => setCType(e.target.value)}>
              {['Positive / Compliment', 'Negative / Complaint', 'Question', 'Spam / Irrelevant', 'Constructive Feedback'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="label">Reply Tone</label>
            <select className="input" value={replyTone} onChange={(e) => setReplyTone(e.target.value)}>
              {['Professional & Warm', 'Casual & Friendly', 'Apologetic & Empathetic', 'Witty & Playful'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={generateReply} disabled={replyLoad}>
          💬 Generate Replies
        </button>
        <ResultBox result={replyRes} loading={replyLoad} loadingText="Crafting replies..." />
      </div>
    </div>
  );
}
