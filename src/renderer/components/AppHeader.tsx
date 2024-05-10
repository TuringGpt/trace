import { APP_TITLE, APP_SUBTITLE } from '../../constants'; // adjust the path as necessary
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
          {APP_TITLE}
        </h1>
      </div>
      <p className="text-center text-xl">
        {APP_SUBTITLE}
      </p>
    </>
  );
}
