'use client';

export default function Card({
  children,
  className = '',
  hover = false,
  padding = true,
  ...props
}) {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-100
        ${hover ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : ''}
        ${padding ? 'p-4' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`border-b border-gray-100 pb-3 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`border-t border-gray-100 pt-3 mt-4 ${className}`}>
      {children}
    </div>
  );
}
