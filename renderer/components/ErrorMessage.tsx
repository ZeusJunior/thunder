export const ErrorMessage = ({ title, message }: { title?: string; message: string }) => {
  return (
    <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4 border border-red-200">
      {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
      <p className="text-sm text-red-700">
        {message}
      </p>
    </div>
  );
};