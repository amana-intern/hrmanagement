import { BackArrowIcon } from '../icons';

export default function GoBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-amana-sec-7 hover:text-amana-blue transition p-1 hover:bg-amana-blue/5 rounded-lg"
    >
      <BackArrowIcon />
    </button>
  );
}
