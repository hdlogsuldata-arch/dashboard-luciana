interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/HDLOGSUL_LOGO.png"
      alt="HDLOG Sul"
      className={className}
    />
  );
}
