export default function PageTitle({ children }: { children: string }) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-amana-black inline-block">
        {children}
      </h1>
      <div className="h-1 w-16 bg-gradient-to-r from-amana-blue to-amana-sec-1 rounded-full mt-1.5" />
    </div>
  );
}
