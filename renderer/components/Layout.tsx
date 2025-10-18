import Sidebar from './Sidebar';
 
export default function Layout({ children }) {
  return (
    <>
      <Sidebar />
      <main className="ml-48 min-h-screen">
        {children}
      </main>
    </>
  );
}