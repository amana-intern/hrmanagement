'use client';

interface RadioListProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  name: string;
  className?: string;
}

export default function RadioList({ options, selected, onChange, name, className = '' }: RadioListProps) {
  return (
    <ul className={`flex flex-col gap-2.5 ${className}`}>
      {options.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <input
            type="radio"
            name={name}
            checked={selected === item}
            onChange={() => onChange(item)}
            className="mt-1 accent-amana-blue cursor-pointer flex-shrink-0"
          />
          <span
            className="text-amana-black cursor-pointer leading-relaxed font-normal"
            onClick={() => onChange(item)}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
