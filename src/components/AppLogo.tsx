import Image from 'next/image';
import headbangLogo from '../../public/E.V. Logo.jpeg';

type AppLogoProps = {
  width: number;
  className?: string;
  priority?: boolean;
};

export default function AppLogo({ width, className, priority = false }: AppLogoProps) {
  const height = Math.round((width * headbangLogo.height) / headbangLogo.width);

  return (
    <Image
      src={headbangLogo}
      alt="Headbang Handwerk e. V. – Handwerk. Laut. Sichtbar."
      width={width}
      height={height}
      priority={priority}
      className={`object-contain ${className ?? ''}`}
    />
  );
}
