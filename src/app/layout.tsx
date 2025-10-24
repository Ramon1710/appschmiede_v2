export const metadata = { title: 'AppSchmiede', description: 'Editor' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="de" suppressHydrationWarning>
<body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
{children}
</body>
</html>
);
}