'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import PreviewCanvas from '../PreviewCanvas';
import { db } from '@/lib/firebase';
import { listPages } from '@/lib/db-editor';
import type { PageTree } from '@/lib/editorTypes';
import useAuth from '@/hooks/useAuth';

type LoadState =
	| { status: 'loading' }
	| { status: 'ready'; page: PageTree; projectName: string; notice?: string }
	| { status: 'empty'; message: string }
	| { status: 'error'; message: string };

export default function Preview({ params }: { params: { id: string } }) {
	const search = useSearchParams();
	const requestedPageId = search.get('page');
	const [state, setState] = useState<LoadState>({ status: 'loading' });
	const { loading: authLoading } = useAuth();

	const getFirebaseErrorCode = (error: unknown): string | null => {
		if (!error || typeof error !== 'object') return null;
		const anyErr = error as any;
		return typeof anyErr.code === 'string' ? anyErr.code : null;
	};

	useEffect(() => {
		let cancelled = false;

		if (authLoading) return;

		const load = async () => {
			setState({ status: 'loading' });
			try {
				let projectName = 'App Vorschau';
				try {
					const projectSnap = await getDoc(doc(db, 'projects', params.id));
					if (projectSnap.exists()) {
						const data = projectSnap.data();
						const rawName = typeof data?.name === 'string' ? data.name.trim() : '';
						if (rawName) projectName = rawName;
					}
				} catch (metaError) {
					console.warn('Projekt-Metadaten konnten nicht geladen werden', metaError);
				}

				const pages = await listPages(params.id);
				if (cancelled) return;

				if (!pages.length) {
					setState({
						status: 'empty',
						message: 'Für dieses Projekt wurde noch keine Seite gespeichert.',
					});
					return;
				}

				let page: PageTree = pages[0];
				let notice: string | undefined;
				if (requestedPageId) {
					const match = pages.find((candidate) => candidate.id === requestedPageId);
					if (match) {
						page = match;
					} else {
						notice = 'Die angeforderte Seite wurde nicht gefunden. Es wird die erste gespeicherte Seite gezeigt.';
						page = pages[0];
					}
				}

				setState({
					status: 'ready',
					projectName,
					page,
					notice,
				});
			} catch (error) {
				console.error('Preview load failed', error);
				if (cancelled) return;
				const code = getFirebaseErrorCode(error);
				setState({
					status: 'error',
					message:
						code === 'permission-denied'
							? 'Die Vorschau konnte nicht geladen werden, da die Berechtigung fehlt (permission-denied). Bitte melde dich an oder prüfe deine Firestore-Regeln für Vorschau-Zugriffe.'
							: 'Die Vorschau konnte nicht geladen werden. Bitte nochmals speichern oder später erneut versuchen.',
				});
			}
		};

		void load();

		return () => {
			cancelled = true;
		};
	}, [params.id, requestedPageId, authLoading]);

	if (state.status === 'loading') {
		return (
			<div className="grid min-h-screen place-items-center bg-neutral-950 text-neutral-300">
				<p className="text-sm">Vorschau wird geladen…</p>
			</div>
		);
	}

	if (state.status === 'error') {
		return (
			<div className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-center text-neutral-100">
				<div className="max-w-sm space-y-3">
					<h1 className="text-lg font-semibold text-white">Fehler beim Laden</h1>
					<p className="text-sm text-neutral-400">{state.message}</p>
				</div>
			</div>
		);
	}

	if (state.status === 'empty') {
		return (
			<div className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-center text-neutral-100">
				<div className="max-w-sm space-y-3">
					<h1 className="text-lg font-semibold text-white">Noch keine Inhalte</h1>
					<p className="text-sm text-neutral-400">{state.message}</p>
				</div>
			</div>
		);
	}

	const fallbackUsed = Boolean(requestedPageId && state.page.id && state.page.id !== requestedPageId);

	return (
		<div className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100">
			<div className="mx-auto mb-6 flex max-w-xl flex-col items-center text-center">
				<p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Live Vorschau</p>
				<h1 className="mt-2 text-2xl font-semibold text-white">{state.projectName}</h1>
				<p className="text-sm text-neutral-400">
					{state.page.name ?? 'Unbenannte Seite'}
					{fallbackUsed ? ' (Fallback)' : ''}
				</p>
				{state.notice && <p className="mt-2 text-xs text-amber-300">{state.notice}</p>}
			</div>
			<PreviewCanvas page={state.page} />
			<div className="mx-auto mt-6 max-w-xl text-center text-[11px] text-neutral-500">
				Verwende das Dashboard, um Änderungen vorzunehmen. Speichere erneut, um die Vorschau zu aktualisieren.
			</div>
		</div>
	);
}