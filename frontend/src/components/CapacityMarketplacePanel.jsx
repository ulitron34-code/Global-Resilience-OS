import { useEffect, useState } from 'react';
import { createCapacityInquiry, getCapacityInquiries, getCapacityMarketplace } from '../api/client';

function usd(value) { return `$${Number(value || 0).toLocaleString()}`; }

export default function CapacityMarketplacePanel() {
  const [offers, setOffers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [draft, setDraft] = useState({ offerId: '', requestedUnits: 1, caseId: '', note: '' });
  const [message, setMessage] = useState('');
  const refresh = async () => { const [market, localInquiries] = await Promise.all([getCapacityMarketplace(), getCapacityInquiries()]); setOffers(market.offers || []); setInquiries(localInquiries || []); };
  useEffect(() => { refresh().catch(() => setMessage('Could not load the local capacity catalog.')); }, []);
  const submit = async (event) => { event.preventDefault(); setMessage(''); try { const result = await createCapacityInquiry({ ...draft, requestedUnits: Number(draft.requestedUnits) }); setMessage(`Request ${result.id} recorded in dry run.`); setDraft((current) => ({ ...current, note: '' })); await refresh(); } catch (error) { setMessage(error.message); } };
  return <section className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Contingency capacity marketplace</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Comparable alternate capacity</h2><p className="text-xs text-ink-muted mt-2">Compare options and register a local request. It does not contact providers or reserve capacity.</p><div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">{offers.map((offer) => <button type="button" key={offer.id} onClick={() => setDraft((current) => ({ ...current, offerId: offer.id }))} className={`text-left border rounded p-3 ${draft.offerId === offer.id ? 'border-signal' : 'border-line'}`}><div className="text-xs text-ink">{offer.name}</div><div className="font-mono text-[10px] text-signal mt-2">{offer.leadTimeHours}h · {usd(offer.estimatedCostUsd)} · {offer.capacityUnits}u</div><div className="text-[10px] text-ink-dim mt-2">Availability: {offer.availabilityStatus}</div></button>)}</div><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3"><input className="control" required value={draft.offerId} onChange={(event) => setDraft({ ...draft, offerId: event.target.value })} placeholder="Offer ID" aria-label="Offer ID" /><input className="control" required type="number" min="1" max="100" value={draft.requestedUnits} onChange={(event) => setDraft({ ...draft, requestedUnits: event.target.value })} placeholder="Units" aria-label="Requested units" /><input className="control" value={draft.caseId} onChange={(event) => setDraft({ ...draft, caseId: event.target.value })} placeholder="Related risk case" aria-label="Related risk case" /><button className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Register inquiry</button></form>{message && <div role="status" className="text-xs text-signal mt-2">{message}</div>}<div className="text-[10px] text-ink-dim mt-3">Local inquiries: {inquiries.length} · external execution blocked</div></section>;
}



