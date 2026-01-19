import Input from './Input';

export default function PasswordInput(
  { className, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'required'>
) {
  return (
    <Input
      type="password"
      required
      className={`${className}`}
      {...props}
    />
  );
}
