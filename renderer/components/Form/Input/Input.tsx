export default function Input(
  { className, ...props }: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      className={`block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 ${className}`}
      {...props}
    />
  );
}
