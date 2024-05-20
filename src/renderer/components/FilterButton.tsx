import { ReactNode } from 'react';

type FilterButtonProps = {
  filter: string;
  activeFilter: string;
  handleFilterChange: (filter: string) => void;
  children: ReactNode;
};

export default function FilterButton({
  filter,
  activeFilter,
  handleFilterChange,
  children,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={() => handleFilterChange(filter)}
      className={`px-3 py-1 border-r-2
      border-r-slate-400 hover:bg-indigo-500 last:border-r-0
      ${activeFilter === filter ? 'bg-indigo-600' : 'bg-gray-600'}`}
    >
      {children}
    </button>
  );
}
