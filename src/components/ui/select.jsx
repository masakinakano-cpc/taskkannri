import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils';
import { ChevronDown, Check } from 'lucide-react';

const SelectContext = createContext({});

const Select = ({ value, onValueChange, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useContext(SelectContext);

  return (
    <button
      ref={ref}
      onClick={() => setOpen(!open)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = ({ placeholder }) => {
  const { value } = useContext(SelectContext);
  return <span>{value || placeholder}</span>;
};

const SelectContent = ({ children, className }) => {
  const { open, setOpen } = useContext(SelectContext);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          'absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg',
          className
        )}
      >
        <div className="max-h-60 overflow-auto p-1">
          {children}
        </div>
      </div>
    </>
  );
};

const SelectItem = ({ value, children, className }) => {
  const { value: selectedValue, onValueChange, setOpen } = useContext(SelectContext);
  const isSelected = value === selectedValue;

  return (
    <div
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100',
        isSelected && 'bg-slate-100',
        className
      )}
    >
      {isSelected && (
        <Check className="h-4 w-4 mr-2" />
      )}
      {!isSelected && <span className="w-4 mr-2" />}
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
