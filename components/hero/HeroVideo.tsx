export default function HeroVideo({src}:{src : string}){
    return(
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 inset-0 w-full h-full object-cover opacity-100"
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
    )
}