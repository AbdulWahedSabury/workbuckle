import Parallax from "@/components/motion/Parallax";
import Image from "next/image";

interface PhotoItem {
  src: string;
  alt: string;
  size: string;
  parallax: [from: number, to: number];
}


export default function PhotoCard({ photo, sizes }: { photo: PhotoItem; sizes: string }) {
  const [from, to] = photo.parallax;
  return (
    <Parallax
      from={from}
      to={to}
      className={`w-full lg:max-w-full ${photo.size}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm-card bg-gray-3 sm:rounded-card lg:aspect-auto lg:h-full">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          className="object-cover"
          preload
        />
      </div>
    </Parallax>
  );
}