export const PageHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold text-gray-900">
        {title}
      </h1>
      {children && children}
    </div>
  );
};