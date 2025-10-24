'use client';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Project } from '@/types/editor';


export default function Preview({ params }:{ params:{ id:string }}){
const [project, setProject] = useState<Project| null>(null);
useEffect(()=>{ (async()=>{ const snap = await getDoc(doc(db,'projects', params.id)); if (snap.exists()) setProject(snap.data() as Project); })(); },[params.id]);
if (!project) return <div className="grid place-items-center min-h-screen">Lade Vorschau…</div>;
const page = project.pages[0];
return (
<div className="min-h-screen bg-neutral-950 text-neutral-100 grid place-items-center p-6">
<div className="w-[390px]">
<h1 className="text-sm mb-2 opacity-60">Vorschau: {project.name}</h1>
<div className="rounded-2xl overflow-hidden border border-white/10">
<div className="aspect-[390/844] bg-black relative">
{page.nodeIds.map(id=>{
const n = project.nodes[id];
const style = { position:'absolute' as const, left:n.frame.x, top:n.frame.y, width:n.frame.w, height:n.frame.h };
return (
<div key={id} style={style}>
{n.type==='text' && <div style={{color:n.style?.color||'#fff', fontSize:n.style?.fontSize||16, fontWeight:n.style?.fontWeight||400}}>{n.props?.text||'Text'}</div>}
{n.type==='button' && <button className="w-full h-full rounded-md border border-white/20 bg-white/10">{n.props?.label||'Button'}</button>}
{n.type==='image' && <img className="w-full h-full object-cover" src={n.props?.src||''} alt=""/>}
{n.type==='input' && <input className="w-full h-full rounded-md bg-neutral-800 px-2" placeholder={n.props?.placeholder||'Eingabe'} />}
{n.type==='container' && <div className="w-full h-full" style={{background:n.style?.background||'#111'}} />}
</div>
);
})}
</div>
</div>
</div>
</div>
);
}