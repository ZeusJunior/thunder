export const ErrorMessage = ({ message }: { message: string }) => {
  return (
    <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 border border-red-300">
      {message}
    </div>
  );
};