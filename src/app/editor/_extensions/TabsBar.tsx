'use client';
import React, { useState } from 'react';
import type { Page } from '@/types/editor';
import { useI18n } from '@/lib/i18n';


export default function TabsBar({
pages,
currentId,
onSelect,
onAdd,
onRename,
onDelete,
}:{
pages: Page[];
currentId: string | null;
onSelect: (id:string)=>void;
onAdd: ()=>void;
onRename: (id:string, name:string)=>void;
onDelete: (id:string)=>void;
}){
const [edit, setEdit] = useState<string|null>(null);
const { lang } = useI18n();
const addLabel = lang === 'en' ? '+ Page' : '+ Seite';
return (
<div className="flex items-center gap-2 overflow-auto no-scrollbar">
{pages.map(p=> (
<div key={p.id} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border ${currentId===p.id? 'bg-white/15 border-white/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
{edit===p.id ? (
<input autoFocus defaultValue={p.name} onBlur={(e)=>{ onRename(p.id, e.target.value); setEdit(null); }} className="bg-transparent outline-none"/>
) : (
<button onClick={()=>onSelect(p.id)} className="font-medium">{p.name}</button>
)}
<button onClick={()=>setEdit(p.id)} className="text-xs opacity-70 hover:opacity-100">✏️</button>
<button onClick={()=>onDelete(p.id)} className="text-xs opacity-70 hover:opacity-100">✖</button>
</div>
))}
<button onClick={onAdd} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20">{addLabel}</button>
</div>
);
}