import React, { useState } from 'react';
import api from '../utils/api';
import { useWorkspaceStore } from '../hooks/useStore';
import PageHeader from '../components/PageHeader';
import ResultBox from '../components/ResultBox';
import AISelector from '../components/AISelector';
import CompareView from '../components/CompareView';
import toast from 'react-hot-toast';

export default function Engagement() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);
  const [engForm, setEngForm] = useState({ biz_type: ws?.business_name||'', goal:'Increase Comments' });
  const [engAI, setEngAI]   = useState('claude');
  const [engRes, setEngRes] = useState(''); const [engCompare, setEngCompare] = useState(null); const [engLoad, setEngLoad] = useState(false);
  const [comment, setComment] = useState('');
  const [cType, setCType]   = useState('Positive / Compliment');
  const [replyTone, setReplyTone] = useState('Professional & Warm');
  const [replyAI, setReplyAI] = useState('claude');
  const [replyRes, setReplyRes] = useState(''); const [replyCompare, setReplyCompare] = useState(null); const [replyLoad, setReplyLoad] = useState(false);

  async function generateEngagement(engType) {
    if (!ws?.id) return toast.error('Select a workspace first.');
    setEngLoad(true); setEngRes(''); setEngCompare(null);
    try {
      const isCompare = engAI === 'compare';
      const r = await api.post('/engagement/ideas', { workspace_id: ws.id, biz_type: engForm.biz_type, goal: engForm.goal, eng_type: engType, provider: isCompare ? 'claude' : engAI, compare: isCompare });
      if (isCompare) setEngCompare(r.data.results); else setEngRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error||'Failed'); }
    finally { setEngLoad(false); }
  }

  async function generateReply() {
    if (!ws?.id) return toast.error('Select a workspace first.');
    if (!comment) return toast.error('Paste a comment first.');
    setReplyLoad(true); setReplyRes(''); setReplyCompare(null);
    try {
      const isCompare = replyAI === 'compare';
      const r = await api.post('/engagement/reply', { workspace_id: ws.id, comment, comment_type: cType, tone: replyTone, provider: isCompare ? 'claude' : replyAI, compare: isCompare });
      if (isCompare) setReplyCompare(r.data.results); else setReplyRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error||'Failed'); }
    finally { setReplyLoad(false); }
  }

  return (
    <div>
      <PageHeader title="Engagement" highlight="Hub" subtitle="Customer & employee engagement strategies and templates" />
      <div className="card">
        <div className="card-title">👥 Engagement Ideas Generator</div>
        <AISelector value={engAI} onChange={setEngAI} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="input-group"><label className="label">Business Type</label><input className="input" placeholder="e.g. Skincare brand, SaaS startup" value={engForm.biz_type} onChange={(e) => setEngForm({...engForm,biz_type:e.target.value})} /></div>
          <div className="input-group"><label className="label">Engagement Goal</label><select className="input" value={engForm.goal} onChange={(e) => setEngForm({...engForm,goal:e.target.value})}>{['Increase Comments','Boost Shares/Saves','DM Conversations','Community Building','Customer Feedback','UGC (User Generated Content)'].map((o)=><option key={o}>{o}</option>)}</select></div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[{label:'👥 Customer Ideas',type:'customer'},{label:'👨‍💼 Employee Advocacy',type:'employee'},{label:'📸 UGC Campaign',type:'ugc'}].map((b) => (
            <button key={b.type} className="btn btn-primary" onClick={() => generateEngagement(b.type)} disabled={engLoad}>{b.label}</button>
          ))}
        </div>
        {engCompare ? <CompareView results={engCompare} loading={engLoad} /> : <ResultBox result={engRes} loading={engLoad} loadingText="Generating engagement ideas..." />}
      </div>
      <div className="card">
        <div className="card-title">💬 Comment Reply Generator</div>
        <AISelector value={replyAI} onChange={setReplyAI} />
        <div className="input-group"><label className="label">Comment you received</label><textarea className="input" rows={3} placeholder="Paste the comment here..." value={comment} onChange={(e) => setComment(e.target.value)} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="input-group"><label className="label">Comment Type</label><select className="input" value={cType} onChange={(e) => setCType(e.target.value)}>{['Positive / Compliment','Negative / Complaint','Question','Spam / Irrelevant','Constructive Feedback'].map((o)=><option key={o}>{o}</option>)}</select></div>
          <div className="input-group"><label className="label">Reply Tone</label><select className="input" value={replyTone} onChange={(e) => setReplyTone(e.target.value)}>{['Professional & Warm','Casual & Friendly','Apologetic & Empathetic','Witty & Playful'].map((o)=><option key={o}>{o}</option>)}</select></div>
        </div>
        <button className="btn btn-primary" onClick={generateReply} disabled={replyLoad}>💬 Generate Replies</button>
        {replyCompare ? <CompareView results={replyCompare} loading={replyLoad} /> : <ResultBox result={replyRes} loading={replyLoad} loadingText="Crafting replies..." />}
      </div>
    </div>
  );
}
