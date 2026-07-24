import { TextareaHTMLAttributes } from 'react';

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2.5 bg-white border border-amana-sec-6 rounded-xl outline-none text-sm text-amana-black shadow-sm
                  focus:border-amana-blue focus:ring-2 focus:ring-amana-blue/15
                  hover:border-amana-sec-7/30
                  transition-all duration-200 resize-none
                  ${props.className || ''}`}
    />
  );
}
