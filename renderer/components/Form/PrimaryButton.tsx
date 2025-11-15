import SmallLoadingSpinner from '../Icons/SmallLoadingSpinner';

interface ButtonProps {
  onClick?: () => void;
  text: string;
  loadingText?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  type?: 'submit' | 'button';
}

export default function PrimaryButton({
  onClick,
  text,
  loadingText,
  icon,
  disabled,
  isLoading,
  type = 'submit',
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      className="group w-full flex justify-center py-3 px-4 text-sm font-medium transition-colors rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
      onClick={onClick}
    >
      <div className="flex items-center space-x-1">
        {isLoading ? (
          <>
            <SmallLoadingSpinner />
            {loadingText || text}
          </>
        ) : (
          <>
            {icon && icon}
            <span>{text}</span>
          </>
        )}
      </div>
    </button>
  );
}