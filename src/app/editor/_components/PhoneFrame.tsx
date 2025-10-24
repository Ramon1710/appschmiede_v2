// src/app/editor/_components/PhoneFrame.tsx
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[390px] h-[844px] bg-neutral-900 rounded-[36px] border border-neutral-800 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 p-3">
        <div className="w-full h-full rounded-2xl bg-neutral-950 relative overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
