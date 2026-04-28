// src/icons/TrashIcon.jsx
export default function TrashIcon({ className = "h-6 w-6" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L3.87 5.955m16.47-3.21a48.523 48.523 0 00-4.05-4.05L14.74 9.17c-.346.052-.692.107-1.038.165m-2.828 0m-2.828 0l-1.06-1.06" />
    </svg>
  );
}