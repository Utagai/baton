function Button(props: {
  children: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  const { children, ariaLabel, onClick } = props;

  return (
    <button
      aria-label={ariaLabel}
      type="button"
      onClick={onClick}
      className="bg-transparent font-semibold border rounded-sm p-1.5 m-1 hover:bg-red-500 hover:text-blue-100"
    >
      {children}
    </button>
  );
}

export default Button;
