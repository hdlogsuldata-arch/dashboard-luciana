interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/LogoHDLOG_cinza.svg"
      alt="HDLOG"
      className={className}
    />
  );
}
