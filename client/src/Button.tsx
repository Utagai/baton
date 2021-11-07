function Button(props: {
  // TODO: I think we can make this into 'children: string', and avoid having to
  // use an extra prop.
  text: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  const { text, ariaLabel, onClick } = props;

  return (
    <button
      aria-label={ariaLabel}
      type="button"
      onClick={onClick}
      className="bg-transparent font-semibold border rounded-sm p-1.5 m-1 hover:bg-red-500 hover:text-blue-100"
    >
      {text}
    </button>
  );
}

export default Button;
