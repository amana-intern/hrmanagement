export default function PageTitle({ children }: { children: string }) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-amana-neutral-500 inline-block">
        {children}
      </h1>
      <div className="h-1 w-16 bg-gradient-to-r from-amana-primary-500 to-amana-primary-300 rounded-full mt-1.5" />
    </div>
  );
}
