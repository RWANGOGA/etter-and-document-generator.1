import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { CommandItem } from './commands';

interface SlashMenuProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

function SlashMenu({ items, command }: SlashMenuProps, ref: any) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: (props: any) => {
      const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter'];
      if (navigationKeys.includes(props.event.key)) {
        props.event.preventDefault();
        if (props.event.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length);
          return true;
        }
        if (props.event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length);
          return true;
        }
        if (props.event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
      }
      return false;
    },
  }));

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 w-64 max-h-64 overflow-y-auto z-50">
      {items.map((item, index) => (
        <button
          key={item.title}
          onClick={() => selectItem(index)}
          className={`flex items-center gap-3 w-full p-2 rounded-lg text-left transition-colors ${
            index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className={`p-2 rounded-md ${index === selectedIndex ? 'bg-blue-100' : 'bg-slate-100'}`}>
            {item.icon}
          </div>
          <div>
            <p className="font-medium text-sm">{item.title}</p>
            <p className="text-xs text-slate-500">{item.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default forwardRef(SlashMenu);