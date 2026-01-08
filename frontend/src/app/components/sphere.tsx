const bookmarkCards = [
  { title: "Design Systems", tag: "UI/UX", rotation: -15, top: "35%", left: "15%" },
  { title: "React Patterns", tag: "Dev", rotation: 8, top: "25%", left: "45%" },
  { title: "AI Research", tag: "Tech", rotation: -5, top: "40%", left: "70%" },
  { title: "Startup Ideas", tag: "Business", rotation: 12, top: "55%", left: "30%" },
  { title: "Typography", tag: "Design", rotation: -8, top: "50%", left: "60%" },
];

const Sphere = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[600px] h-[600px] md:w-[800px] md:h-[800px]">
        {/* Outer glow rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-black/5 animate-spin-slow" />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-black/10 animate-spin-slow" 
          style={{ animationDirection: 'reverse', animationDuration: '30s' }} 
        />
        
        {/* Main half-sphere container */}
        {/* Sphere glow underneath */}
        <div 
          className="absolute inset-0 rounded-full blur-3xl opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(32,42,41,0.35), transparent 60%)',
          }}
        />
        
        {/* Half-sphere body */}
        <div 
          className="relative w-full h-full rounded-full glow-sphere overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(209,213,219,0.22), rgba(209,213,219,0.18) 55%, rgba(209,213,219,0.14) 100%)',
            maskImage: 'linear-gradient(to bottom, black 50%, transparent 50%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 50%)',
          }}
        >
          {/* Inner highlight */}
          <div 
            className="absolute top-[10%] left-[30%] w-1/3 h-1/4 rounded-full blur-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
            }}
          />
          
          {/* Surface texture rings */}
          <div className="absolute inset-[5%] rounded-full border border-black/3" />
          <div className="absolute inset-[10%] rounded-full border border-black/3" />
          <div className="absolute inset-[15%] rounded-full border border-black/3" />
          <div className="absolute inset-[20%] rounded-full border border-black/3" />
          
          {/* Horizontal grid lines for depth */}
          <div className="absolute top-[20%] left-[10%] right-[10%] h-px bg-black/3" />
          <div className="absolute top-[30%] left-[5%] right-[5%] h-px bg-black/3" />
          <div className="absolute top-[40%] left-[2%] right-[2%] h-px bg-black/3" />
        </div>
        
        {/* Bookmark cards floating on the sphere */}
        {false &&
          bookmarkCards.map((card, index) => (
            <div
              key={index}
              className="absolute animate-float"
              style={{
                top: card.top,
                left: card.left,
                transform: `rotate(${card.rotation}deg)`,
                animationDelay: `${index * 0.5}s`,
                animationDuration: `${4 + index * 0.5}s`,
              }}
            >
              <div 
                className="glass-card px-4 py-3 rounded-lg border border-black/10 backdrop-blur-md"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.35)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#202A29]/40" />
                  <span className="text-xs text-[#202A29]/60 font-medium">{card.tag}</span>
                </div>
                <p className="text-sm text-[#202A29]/80 font-medium whitespace-nowrap">{card.title}</p>
              </div>
            </div>
          ))}
        
        {/* Ambient particles */}
        <div className="absolute w-1.5 h-1.5 bg-[#202A29]/25 rounded-full top-[30%] left-[25%] animate-pulse-slow" />
        <div className="absolute w-1 h-1 bg-[#202A29]/20 rounded-full top-[25%] right-[30%] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute w-1.5 h-1.5 bg-[#202A29]/20 rounded-full top-[40%] left-[40%] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>
      </div>
    </div>
  );
};

export default Sphere;
