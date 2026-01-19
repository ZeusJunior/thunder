export default function Textarea(
  { className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      className={`block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 ${className}`}
      {...props}
    />
  );
}
