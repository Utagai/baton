const Circle = (props: { animationDelay: number }) => {
  const { animationDelay } = props;

  const baseStyles =
    'inline-block border-t-2 border-b-2 h-14 w-14 m-2 rounded-full animate-bounce';
  console.log('clases: ', `${baseStyles} animation-delay-${animationDelay}`);
  return <span className={`${baseStyles} animation-delay-${animationDelay}`} />;
};

const Loading = () => (
  <div className="h-screen flex flex-col items-center justify-center">
    <div className="">
      <Circle animationDelay={100} />
      <Circle animationDelay={200} />
      <Circle animationDelay={300} />
    </div>
    <div className="">
      <h1 className="text-6xl font-extralight opacity-25">LOADING</h1>
    </div>
  </div>
);

export default Loading;
