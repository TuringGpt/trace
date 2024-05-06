import icon from '../../../assets/icon.svg';

export default function AppHeader() {
  return (
    <>
      <div className="flex justify-center">
        <img
          alt="icon"
          src={icon}
          className="inline-block h-12 mt-16 mb-8 mr-2"
        />
        <h1 className="text-5xl mt-16 mb-8 font-sans inline-block font-bold text-center">
          Trace
        </h1>
      </div>
      <p className="text-center text-xl">
        Screen Recorder with clicks and keystrokes
      </p>
    </>
  );
}
