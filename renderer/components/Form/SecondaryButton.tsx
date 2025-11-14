interface ButtonProps {
  onClick?: () => void;
  text: string;
  icon?: React.ReactNode;
}

export default function SecondaryButton({
  onClick,
  text,
  icon,
}: ButtonProps) {
  return (
    <button
      type='button'
      className='group w-full flex justify-center py-3 px-4 text-sm font-medium transition-colors rounded-md text-gray-700 bg-white hover:bg-gray-100 cursor-pointer border border-gray-300'
      onClick={onClick}
    >
      <div className="flex items-center">
        <>
          {icon && icon}
          <span>{text}</span>
        </>
      </div>
    </button>
  );
}