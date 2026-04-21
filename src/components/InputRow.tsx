import { useEffect, useRef, useState } from 'react';

interface Props {
  onSubmit: (body: string) => void;
}

export function InputRow({ onSubmit }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    // Autofocus on mount to bring up the keyboard
    ref.current?.focus();
  }, []);

  return (
    <div className="flex items-center px-4 h-12 border-b border-gray-100">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isComposing) {
            e.preventDefault();
            if (value.trim()) {
              onSubmit(value);
              setValue('');
            }
          }
        }}
        enterKeyHint="done"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-300"
        placeholder=""
      />
    </div>
  );
}
