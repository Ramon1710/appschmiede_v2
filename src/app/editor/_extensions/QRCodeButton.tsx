'use client';
import React, { useCallback, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n';

type Props = {
	projectId?: string | null;
	pageId?: string | null;
	onBeforeOpen?: () => Promise<void> | void;
	className?: string;
	label?: string;
};

const buildPreviewUrl = (projectId?: string | null, pageId?: string | null) => {
	if (!projectId) return '';
	if (typeof window === 'undefined') return '';
	const base = window.location.origin;
	const suffix = pageId ? `?page=${encodeURIComponent(pageId)}` : '';
	return `${base}/preview/${encodeURIComponent(projectId)}${suffix}`;
};

export default function QRCodeButton({ projectId, pageId, onBeforeOpen, className, label }: Props) {
	const { lang } = useI18n();
	const tr = (de: string, en: string) => (lang === 'en' ? en : de);
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);

	const url = useMemo(() => buildPreviewUrl(projectId ?? undefined, pageId ?? undefined), [projectId, pageId]);
	const img = useMemo(
		() => (url ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}` : ''),
		[url]
	);

	const handleOpen = useCallback(async () => {
		if (!projectId) return;
		if (!onBeforeOpen) {
			setOpen(true);
			return;
		}
		try {
			setBusy(true);
			await onBeforeOpen();
			setOpen(true);
		} catch (error) {
			console.error('Preview preparation failed', error);
		} finally {
			setBusy(false);
		}
	}, [onBeforeOpen, projectId]);

	const handleCopy = useCallback(async () => {
		if (!url || typeof navigator === 'undefined' || !navigator.clipboard) return;
		try {
			await navigator.clipboard.writeText(url);
		} catch (error) {
			console.error('Copy failed', error);
		}
	}, [url]);

	return (
		<>
			<button
				type="button"
				disabled={!projectId || busy}
				onClick={handleOpen}
				className={`rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 transition hover:bg-white/10 disabled:opacity-40 ${className ?? ''}`}
			>
				{busy ? tr('Speichere…', 'Saving…') : label ?? tr('Vorschau', 'Preview')}
			</button>
			{open && (
				<div
					className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 backdrop-blur-sm"
					onClick={() => setOpen(false)}
				>
					<div
						className="w-full max-w-md rounded-2xl border border-white/20 bg-neutral-900 p-6 shadow-2xl"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="space-y-1">
							<h2 className="text-lg font-semibold text-neutral-100">{tr('App auf dem Smartphone testen', 'Test the app on your phone')}</h2>
							<p className="text-sm text-neutral-400">
								{tr(
									'Scanne den QR-Code, um die aktuelle Vorschau deiner App im mobilen Browser zu öffnen.',
									'Scan the QR code to open the current preview of your app in your mobile browser.'
								)}
							</p>
						</div>

						{img ? (
							<div className="mt-5 flex flex-col items-center gap-3">
								<img
									src={img}
									alt={tr('Vorschau-QR-Code', 'Preview QR code')}
									className="h-52 w-52 rounded-xl border border-white/10 bg-white p-2 shadow-lg"
								/>
								{url && (
									<button
										type="button"
										onClick={handleCopy}
										className="text-xs text-emerald-300 underline-offset-4 hover:underline"
									>
										{tr('Link kopieren', 'Copy link')}
									</button>
								)}
							</div>
						) : (
							<div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-neutral-400">
								{tr(
									'Kein Projekt gefunden. Speichere dein Projekt oder lade die Seite neu.',
									'No project found. Save your project or reload the page.'
								)}
							</div>
						)}

						<div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
							<p className="font-medium text-neutral-100">{tr('So funktioniert es:', 'How it works:')}</p>
							<ul className="space-y-1 text-xs leading-relaxed text-neutral-300">
								<li>{tr('• Öffne die Kamera-App deines Smartphones und richte sie auf den QR-Code.', '• Open your phone\'s camera app and point it at the QR code.')}</li>
								<li>
									{lang === 'en' ? (
										<>
											• Alternatively, use a QR scanner, e.g. <span className="font-medium">Google Lens</span> (Android) or{' '}
											<span className="font-medium">QR Code &amp; Barcode Scanner</span> (iOS).
										</>
									) : (
										<>
											• Alternativ kannst du einen QR-Scanner verwenden, z.&nbsp;B.{' '}
											<span className="font-medium">Google Lens</span> (Android) oder{' '}
											<span className="font-medium">QR Code &amp; Barcode Scanner</span> (iOS).
										</>
									)}
								</li>
								<li>{tr('• Tippe auf den eingeblendeten Link, um die App-Vorschau im Browser zu laden.', '• Tap the suggested link to load the app preview in your browser.')}</li>
							</ul>
							<p className="text-xs text-neutral-400">
								{tr(
									'Hinweis: Stelle sicher, dass du online bist und die neueste Version deiner Seite gespeichert wurde.',
									'Note: Make sure you\'re online and that the latest version of your page has been saved.'
								)}
							</p>
						</div>

						{url && (
							<div className="mt-4 rounded-lg bg-neutral-800/60 p-3 text-[11px] text-neutral-400 break-all">
								{url}
							</div>
						)}

						<div className="mt-6 flex justify-end">
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-neutral-100 transition hover:bg-white/20"
							>
								{tr('Schließen', 'Close')}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}