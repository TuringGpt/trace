import clsx from 'clsx';

import useAppState from '../store/hook';

export default function BusyOverlay() {
  const { state } = useAppState();
  return (
    <div
      id="loadingOverlay"
      className={clsx(' ', {
        hidden: !state.busyIndicator.isShow,
      })}
    >
      <div className="relative">
        <div className="flex justify-center mt-16">
          <div className="p-1 bg-gradient-to-tr animate-spin from-white to-indigo-600 via-indigo-600 rounded-full">
            <div className="bg-slate-900 rounded-full">
              <div className="w-12 h-12 rounded-full" />
            </div>
          </div>
        </div>
        <div className="absolute top-[20%] left-[calc(50%-1rem)]">
          <div className="p-1 bg-gradient-to-tr animate-spin from-white to-indigo-600 via-indigo-600 rounded-full">
            <div className="bg-slate-900 rounded-full">
              <div className="w-6 h-6 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <h1 className="text-xl mt-16 mb-8 flex flex-col justify-center font-sans text-center">
        {state.busyIndicator.message.split('\n').map((line, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index}>{line}</div>
        ))}
      </h1>
    </div>
  );
}
