'use client';
import React, { useMemo, useState } from 'react';


export default function QRCodeButton({ projectId }:{ projectId: string | undefined }){
const [open, setOpen] = useState(false);
const url = useMemo(()=> projectId ? `${typeof window!=='undefined' ? window.location.origin : ''}/preview/${projectId}` : '', [projectId]);
const img = url ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}` : '';
return (
<>
<button disabled={!projectId} onClick={()=>setOpen(true)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40">QR‑Code</button>
{open && (
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center" onClick={()=>setOpen(false)}>
<div className="rounded-2xl border border-white/20 bg-neutral-900 p-6" onClick={(e)=>e.stopPropagation()}>
<div className="text-sm opacity-70 mb-2">Scanne zum Öffnen der Vorschau</div>
{img && <img src={img} alt="QR" className="mx-auto"/>}
<div className="mt-2 text-xs break-all opacity-70">{url}</div>
<div className="mt-4 text-right">
<button onClick={()=>setOpen(false)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Schließen</button>
</div>
</div>
</div>
)}
</>
);
}