type TextFieldProps = {
  label: string;
  name: string;
  defaultValue?: string | number;
  required?: boolean;
  type?: string;
  step?: string;
};

export function TextField({ label, name, defaultValue, required = false, type = "text", step }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <input className="input" defaultValue={defaultValue} name={name} required={required} step={step} type={type} />
    </label>
  );
}

export function TextAreaField({ label, name }: { label: string; name: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <textarea className="input" name={name} />
    </label>
  );
}
