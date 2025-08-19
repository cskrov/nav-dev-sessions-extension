export const Button = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={`cursor-pointer bg-blue-500 px-2 py-1 text-sm text-white hover:bg-blue-700 ${className}`}
    {...props}
  >
    {children}
  </button>
);
