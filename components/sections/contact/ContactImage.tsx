import Image from "next/image";

interface ContactImageProps {
  src: string;
  alt: string;
}

/** Rounded photo sitting on a dark panel that bleeds out to the left edge of the viewport. */
export default function ContactImage({ src, alt }: ContactImageProps) {
  return (
    <div className="relative h-full p-5 sm:p-[30px] lg:py-[50px] lg:pr-[50px] lg:pl-0 xl:py-[60px] xl:pr-[60px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-sm-card bg-ink lg:right-0 lg:left-auto lg:w-screen lg:rounded-l-none"
      />
      <div className="relative h-full min-h-[320px] overflow-hidden rounded-card">
        <Image src={src} alt={alt} fill priority sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
      </div>
    </div>
  );
}
