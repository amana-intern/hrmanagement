'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';
import PageTopBar from '../layout/PageTopBar';
import Button from '../forms/Button';
import Collapse from '../layout/Collapse';
import StatBox, { type Stat } from './StatBox';
import { cn } from '@/app/utils/cn';
import { springSnappy, durationFast, easeOut } from '@/app/utils/motion';

export type { Stat };

export interface SummaryPanelConfig {
  title: string;
  stats: Stat[];
  updates: string[];
}

export interface ProfileBio {
  name: string;
  role: string;
  email: string;
  phone: string;
  photoSrc?: string;
}

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

const defaultTodos: TodoItem[] = [
  { id: 1, text: 'This is filling out a text field', done: false },
  { id: 2, text: 'Meeting senin 10.00', done: false },
  { id: 3, text: 'Project kickoff 12.30', done: false },
  { id: 4, text: 'Client feedback session 14.00', done: false },
  { id: 5, text: 'Team brainstorming 16.00', done: false },
  { id: 6, text: 'Weekly review 17.30', done: false },
  { id: 7, text: 'Monthly review 10.00', done: false },
  { id: 8, text: 'Quarterly review 15.00', done: false },
];

function SummaryPanel({ title, stats, updates }: SummaryPanelConfig) {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[7px] border border-amana-primary-500 shadow-sm px-4 py-2.5">
      <h3 className="flex-shrink-0 text-[20px] font-semibold text-amana-primary-500 pb-1.5 mb-2 border-b border-amana-primary-500">
        {title}
      </h3>
      <div className="flex-shrink-0 flex gap-2 mb-2">
        {stats.map((s, i) => (
          <StatBox key={i} {...s} />
        ))}
      </div>
      <div className="flex-1 min-h-0 border-t border-amana-neutral-300 pt-1.5 overflow-y-auto scroll-smooth">
        {updates.map((text, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2 py-1.5 text-[16px] text-amana-neutral-500',
              i < updates.length - 1 && 'border-b border-amana-neutral-200'
            )}
          >
            <span className="w-2 h-2 rounded-full border border-amana-primary-500 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeeBio({ name, role, email, phone, photoSrc }: ProfileBio) {
  return (
    <div className="flex-shrink-0 bg-amana-neutral-100 rounded-[8px] border border-amana-primary-500 shadow-sm px-4 py-2.5">
      <h3 className="text-[20px] font-semibold text-amana-primary-500 pb-1.5 mb-3 border-b border-amana-primary-500">
        Employee Bio
      </h3>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[35px] font-light text-amana-primary-500 leading-tight truncate">{name}</p>
          <div className="border-t border-amana-neutral-300 my-1" />
          <p className="text-[19px] font-light text-amana-primary-500 truncate">{role}</p>
          <div className="border-t border-amana-neutral-300 my-1" />
          <a href={`mailto:${email}`} className="text-[19px] font-light text-amana-primary-500 truncate block hover:underline">
            {email}
          </a>
          <div className="border-t border-amana-neutral-300 my-1" />
          <p className="text-[19px] font-light text-amana-primary-500 truncate">{phone}</p>
        </div>
        <div className="w-[92px] h-[123px] rounded-[4px] overflow-hidden border border-amana-primary-500 shadow-md flex-shrink-0 bg-amana-neutral-200 flex items-center justify-center">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[28px] font-semibold text-amana-primary-500">
              {name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ToDoList({ initialTodos = defaultTodos }: { initialTodos?: TodoItem[] }) {
  const [tasks, setTasks] = useState<TodoItem[]>(initialTodos);
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const commitTask = () => {
    const trimmed = input.trim();
    if (trimmed) {
      setTasks((prev) => [{ id: Date.now(), text: trimmed, done: false }, ...prev]);
    }
    setInput('');
    setShowInput(false);
  };

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-amana-neutral-100 rounded-[8px] border border-amana-primary-500 shadow-sm px-4 py-2.5">
      <h3 className="text-[20px] font-semibold text-amana-primary-500 pb-1.5 mb-1.5 border-b border-amana-primary-500 flex-shrink-0">
        To-Do List
      </h3>

      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
        <Collapse open={showInput}>
          <div className="flex items-center gap-2 py-1.5 pr-1 border-b border-amana-neutral-200">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitTask()}
              autoFocus={showInput}
              placeholder="Type a task and press Enter..."
              className="flex-1 min-w-0 text-[16px] bg-transparent outline-none text-black placeholder:text-amana-neutral-300"
            />
          </div>
        </Collapse>
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: durationFast, ease: easeOut }}
              onClick={() => toggleTask(task.id)}
              className="flex items-center justify-between gap-2 py-1.5 pr-1 border-b border-amana-neutral-200 last:border-b-0 cursor-pointer group overflow-hidden"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full border border-amana-primary-500 flex-shrink-0" />
                <span className="relative min-w-0">
                  <span
                    className={cn(
                      'block text-[16px] truncate transition-colors duration-300',
                      task.done ? 'text-amana-neutral-300' : 'text-black'
                    )}
                  >
                    {task.text}
                  </span>
                  <motion.span
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] w-full origin-left bg-amana-neutral-300"
                    initial={false}
                    animate={{ scaleX: task.done ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: easeOut }}
                  />
                </span>
              </span>
              <span className="flex items-center gap-2 flex-shrink-0">
                {task.done && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task.id);
                    }}
                    aria-label="Delete task"
                    className="text-amana-danger-500 hover:text-amana-danger-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <span
                  className={cn(
                    'w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center flex-shrink-0',
                    task.done
                      ? 'bg-amana-primary-500 border-amana-primary-500'
                      : 'border-amana-neutral-300 group-hover:border-amana-primary-500'
                  )}
                >
                  {task.done && (
                    <motion.span
                      initial={false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={springSnappy}
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                    </motion.span>
                  )}
                </span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-end pt-2 flex-shrink-0">
        <Button variant="primary" size="md" onClick={() => setShowInput(true)}>
          Add List
        </Button>
      </div>
    </div>
  );
}

export interface ProfileOverviewProps {
  panels: [SummaryPanelConfig, SummaryPanelConfig];
  bio: ProfileBio;
  initialTodos?: TodoItem[];
  pageLabel?: string;
  showGreeting?: boolean;
}

export default function ProfileOverview({
  panels,
  bio,
  initialTodos,
  pageLabel = 'Profile',
  showGreeting = false,
}: ProfileOverviewProps) {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <PageTopBar right={pageLabel} showGreeting={showGreeting} />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-3 w-full lg:w-3/5 min-h-0">
          <SummaryPanel {...panels[0]} />
          <SummaryPanel {...panels[1]} />
        </div>

        <div className="flex flex-col gap-4 w-full lg:w-2/5 min-h-0">
          <EmployeeBio {...bio} />
          <ToDoList initialTodos={initialTodos} />
        </div>
      </div>
    </div>
  );
}
