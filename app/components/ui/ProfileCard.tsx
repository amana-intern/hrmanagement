import { ReactNode } from 'react';

interface ProfileCardProps {
  imageSrc?: string;
  greeting: string;
  title: string;
  subtitle: string;
  footer: string;
  children?: ReactNode;
}

export default function ProfileCard({
  imageSrc = '/PlaceholderPP.png',
  greeting,
  title,
  subtitle,
  footer,
  children,
}: ProfileCardProps) {
  return (
    <div
      className="w-full bg-white p-6 md:p-8 rounded-2xl shadow-md border border-amana-sec-6
                 flex flex-col md:flex-row gap-8 items-start mb-8 animate-fade-in
                 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-44 h-56 rounded-xl overflow-hidden border-2 border-amana-blue/30 shadow-lg shadow-amana-blue/10 relative group">
          <img
            src={imageSrc}
            alt="Profile"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-amana-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
      <div className="flex-1 w-full flex flex-col gap-5">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amana-blue to-amana-sec-1 bg-clip-text text-transparent">
          {greeting}
        </h2>
        <div className="border border-amana-sec-6 rounded-xl p-6 bg-white shadow-sm">
          <div className="flex flex-col gap-0.5 mb-5">
            <h3 className="text-xl md:text-2xl font-bold leading-tight text-amana-black">{title}</h3>
            <h3 className="text-lg md:text-xl font-normal leading-tight text-amana-sec-7">{subtitle}</h3>
          </div>
          <p className="text-sm font-medium pt-4 border-t border-amana-sec-6 text-amana-sec-7">{footer}</p>
        </div>
        {children && (
          <div className="border border-amana-sec-6 rounded-xl p-6 bg-white shadow-sm">{children}</div>
        )}
      </div>
    </div>
  );
}
