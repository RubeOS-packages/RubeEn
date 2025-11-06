export const StatusMessage = ({ type, message }) => {
  const baseClasses = 'p-4 rounded-md text-sm';
  const typeClasses = {
    error: 'bg-danger/20 text-danger',
    success: 'bg-success/20 text-success',
    info: 'bg-accent/20 text-accent',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <p>{message}</p>
    </div>
  );
};