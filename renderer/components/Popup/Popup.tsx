import XIcon from '../Icons/X';

interface PopupProps {
  title: string;
  close: () => void;
  children?: React.ReactNode;
}

export default function Popup({ title, close, children }: PopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <button
            onClick={close}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}