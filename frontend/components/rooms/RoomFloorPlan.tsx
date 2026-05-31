type Layout = "boardroom" | "meeting" | "office" | "training" | "lounge" | "default"

function detectLayout(name: string): Layout {
  const n = name.toLowerCase()
  if (n.includes("board") || n.includes("executive") || n.includes("director") || n.includes("conference")) return "boardroom"
  if (n.includes("meeting") || n.includes("huddle") || n.includes("seminar")) return "meeting"
  if (n.includes("office") || n.includes("private") || n.includes("cabin") || n.includes("studio")) return "office"
  if (n.includes("training") || n.includes("classroom") || n.includes("lecture") || n.includes("workshop")) return "training"
  if (n.includes("lounge") || n.includes("break") || n.includes("common") || n.includes("social") || n.includes("chill")) return "lounge"
  return "default"
}

// Shared style tokens
const WALL = "#CC2229"
const TABLE = "#CC2229"
const TABLE_FILL = "rgba(204,34,41,0.12)"
const CHAIR = "#A51B21"
const CHAIR_FILL = "rgba(165,27,33,0.35)"
const FLOOR = "#FFF8F8"
const GRID = "rgba(204,34,41,0.06)"
const WINDOW = "#fff"

/** Boardroom — long table, chairs all around */
function Boardroom() {
  const chairs = [60, 90, 120, 150, 180]
  return (
    <svg viewBox="0 0 240 148" className="w-full h-full">
      <rect width="240" height="148" fill={FLOOR} />
      {/* grid lines */}
      {[30,60,90,120,150,180,210].map(x => <line key={x} x1={x} y1={0} x2={x} y2={148} stroke={GRID} strokeWidth="1"/>)}
      {[37,74,111].map(y => <line key={y} x1={0} y1={y} x2={240} y2={y} stroke={GRID} strokeWidth="1"/>)}
      {/* walls */}
      <rect x="2" y="2" width="236" height="144" fill="none" stroke={WALL} strokeWidth="3" rx="2"/>
      {/* door bottom-right */}
      <line x1="160" y1="146" x2="200" y2="146" stroke={FLOOR} strokeWidth="3"/>
      <path d="M 200 146 A 40 40 0 0 0 160 146" fill="none" stroke={WALL} strokeWidth="1.2" strokeDasharray="3 2"/>
      {/* window top */}
      <line x1="60" y1="2" x2="120" y2="2" stroke={WINDOW} strokeWidth="3"/>
      <line x1="60" y1="5" x2="120" y2="5" stroke={WALL} strokeWidth="1"/>
      {/* table */}
      <rect x="40" y="52" width="160" height="44" rx="5" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.8"/>
      {/* top chairs */}
      {chairs.map(x => <rect key={`t${x}`} x={x-12} y={36} width={24} height={13} rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1.2"/>)}
      {/* bottom chairs */}
      {chairs.map(x => <rect key={`b${x}`} x={x-12} y={99} width={24} height={13} rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1.2"/>)}
      {/* left chairs */}
      {[60,74].map(y => <rect key={`l${y}`} x={22} y={y-6} width={14} height={12} rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1.2"/>)}
      {/* right chairs */}
      {[60,74].map(y => <rect key={`r${y}`} x={204} y={y-6} width={14} height={12} rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1.2"/>)}
    </svg>
  )
}

/** Meeting Room — round table, 6 chairs around */
function MeetingRoom() {
  const cx = 120, cy = 74, tr = 28, cr = 48
  const chairAngles = [0, 60, 120, 180, 240, 300]
  return (
    <svg viewBox="0 0 240 148" className="w-full h-full">
      <rect width="240" height="148" fill={FLOOR} />
      {[60,120,180].map(x => <line key={x} x1={x} y1={0} x2={x} y2={148} stroke={GRID} strokeWidth="1"/>)}
      {[49,99].map(y => <line key={y} x1={0} y1={y} x2={240} y2={y} stroke={GRID} strokeWidth="1"/>)}
      <rect x="2" y="2" width="236" height="144" fill="none" stroke={WALL} strokeWidth="3" rx="2"/>
      {/* door */}
      <line x1="10" y1="100" x2="10" y2="140" stroke={FLOOR} strokeWidth="3"/>
      <path d="M 10 100 A 40 40 0 0 1 10 140" fill="none" stroke={WALL} strokeWidth="1.2" strokeDasharray="3 2"/>
      {/* window */}
      <line x1="90" y1="2" x2="150" y2="2" stroke={WINDOW} strokeWidth="3"/>
      <line x1="90" y1="5" x2="150" y2="5" stroke={WALL} strokeWidth="1"/>
      {/* round table */}
      <circle cx={cx} cy={cy} r={tr} fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.8"/>
      {/* chairs around */}
      {chairAngles.map(angle => {
        const rad = (angle * Math.PI) / 180
        const x = cx + cr * Math.sin(rad)
        const y = cy - cr * Math.cos(rad)
        return (
          <ellipse key={angle} cx={x} cy={y} rx="11" ry="8"
            fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1.2"
            transform={`rotate(${angle}, ${x}, ${y})`}
          />
        )
      })}
    </svg>
  )
}

/** Private Office — L-desk, monitor, single chair */
function PrivateOffice() {
  return (
    <svg viewBox="0 0 240 148" className="w-full h-full">
      <rect width="240" height="148" fill={FLOOR} />
      {[80,160].map(x => <line key={x} x1={x} y1={0} x2={x} y2={148} stroke={GRID} strokeWidth="1"/>)}
      {[49,99].map(y => <line key={y} x1={0} y1={y} x2={240} y2={y} stroke={GRID} strokeWidth="1"/>)}
      <rect x="2" y="2" width="236" height="144" fill="none" stroke={WALL} strokeWidth="3" rx="2"/>
      {/* door */}
      <line x1="170" y1="146" x2="210" y2="146" stroke={FLOOR} strokeWidth="3"/>
      <path d="M 210 146 A 40 40 0 0 0 170 146" fill="none" stroke={WALL} strokeWidth="1.2" strokeDasharray="3 2"/>
      {/* window */}
      <line x1="30" y1="2" x2="90" y2="2" stroke={WINDOW} strokeWidth="3"/>
      <line x1="30" y1="5" x2="90" y2="5" stroke={WALL} strokeWidth="1"/>
      {/* L-desk horizontal */}
      <rect x="18" y="20" width="100" height="22" rx="2" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.8"/>
      {/* L-desk vertical */}
      <rect x="18" y="20" width="22" height="60" rx="2" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.8"/>
      {/* monitor */}
      <rect x="65" y="24" width="30" height="14" rx="2" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.5"/>
      <line x1="80" y1="38" x2="80" y2="42" stroke={TABLE} strokeWidth="1.5"/>
      <line x1="74" y1="42" x2="86" y2="42" stroke={TABLE} strokeWidth="1.5"/>
      {/* keyboard */}
      <rect x="55" y="38" width="28" height="7" rx="1" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1"/>
      {/* chair */}
      <circle cx="60" cy="95" r="13" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1.5"/>
      <circle cx="60" cy="95" r="6" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1"/>
      {/* bookshelf */}
      <rect x="155" y="15" width="70" height="90" rx="2" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.5"/>
      {[30,45,60,75,90].map(y => <line key={y} x1="155" x2="225" y1={y} y2={y} stroke={TABLE} strokeWidth="0.8"/>)}
    </svg>
  )
}

/** Training Room — rows of desks facing a whiteboard */
function TrainingRoom() {
  const deskCols = [30, 85, 140, 195]
  const deskRows = [65, 95]
  return (
    <svg viewBox="0 0 240 148" className="w-full h-full">
      <rect width="240" height="148" fill={FLOOR} />
      {[60,120,180].map(x => <line key={x} x1={x} y1={0} x2={x} y2={148} stroke={GRID} strokeWidth="1"/>)}
      {[49,99].map(y => <line key={y} x1={0} y1={y} x2={240} y2={y} stroke={GRID} strokeWidth="1"/>)}
      <rect x="2" y="2" width="236" height="144" fill="none" stroke={WALL} strokeWidth="3" rx="2"/>
      {/* door */}
      <line x1="10" y1="105" x2="10" y2="145" stroke={FLOOR} strokeWidth="3"/>
      <path d="M 10 105 A 40 40 0 0 1 10 145" fill="none" stroke={WALL} strokeWidth="1.2" strokeDasharray="3 2"/>
      {/* whiteboard at top */}
      <rect x="30" y="10" width="180" height="18" rx="2" fill="#fff" stroke={TABLE} strokeWidth="1.5"/>
      <text x="120" y="23" textAnchor="middle" fontSize="7" fill={TABLE} fontFamily="sans-serif">WHITEBOARD</text>
      {/* presenter desk */}
      <rect x="80" y="36" width="80" height="16" rx="2" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.5"/>
      <rect x="112" y="53" width="16" height="12" rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1"/>
      {/* student desks + chairs */}
      {deskRows.map(dy =>
        deskCols.map(dx => (
          <g key={`${dx}-${dy}`}>
            <rect x={dx} y={dy} width="40" height="18" rx="2" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.3"/>
            <rect x={dx+10} y={dy+19} width="20" height="12" rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1"/>
          </g>
        ))
      )}
    </svg>
  )
}

/** Lounge — sofas, coffee table, plant */
function Lounge() {
  return (
    <svg viewBox="0 0 240 148" className="w-full h-full">
      <rect width="240" height="148" fill={FLOOR} />
      {[80,160].map(x => <line key={x} x1={x} y1={0} x2={x} y2={148} stroke={GRID} strokeWidth="1"/>)}
      {[49,99].map(y => <line key={y} x1={0} y1={y} x2={240} y2={y} stroke={GRID} strokeWidth="1"/>)}
      <rect x="2" y="2" width="236" height="144" fill="none" stroke={WALL} strokeWidth="3" rx="2"/>
      {/* door */}
      <line x1="10" y1="60" x2="10" y2="100" stroke={FLOOR} strokeWidth="3"/>
      <path d="M 10 60 A 40 40 0 0 1 10 100" fill="none" stroke={WALL} strokeWidth="1.2" strokeDasharray="3 2"/>
      {/* window */}
      <line x1="100" y1="2" x2="180" y2="2" stroke={WINDOW} strokeWidth="3"/>
      <line x1="100" y1="5" x2="180" y2="5" stroke={WALL} strokeWidth="1"/>
      {/* sofa top */}
      <rect x="30" y="18" width="130" height="28" rx="6" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.8"/>
      <rect x="30" y="18" width="130" height="10" rx="4" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1"/>
      {/* sofa armrests */}
      <rect x="30" y="20" width="12" height="26" rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1"/>
      <rect x="148" y="20" width="12" height="26" rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1"/>
      {/* sofa left side */}
      <rect x="18" y="68" width="28" height="65" rx="6" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.8"/>
      <rect x="18" y="68" width="10" height="65" rx="4" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1"/>
      {/* coffee table */}
      <rect x="70" y="68" width="90" height="50" rx="8" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.8"/>
      <circle cx="115" cy="93" r="12" fill="none" stroke={TABLE} strokeWidth="1" strokeDasharray="3 2"/>
      {/* plant */}
      <circle cx="208" cy="26" r="14" fill="rgba(34,120,34,0.15)" stroke="rgba(34,120,34,0.5)" strokeWidth="1.5"/>
      <circle cx="208" cy="26" r="8" fill="rgba(34,120,34,0.15)" stroke="rgba(34,120,34,0.5)" strokeWidth="1"/>
      <line x1="208" y1="40" x2="208" y2="50" stroke="rgba(100,60,20,0.6)" strokeWidth="2"/>
      <rect x="202" y="50" width="12" height="8" rx="1" fill="rgba(100,60,20,0.2)" stroke="rgba(100,60,20,0.4)" strokeWidth="1"/>
    </svg>
  )
}

/** Default — simple table with 4 chairs */
function DefaultRoom() {
  return (
    <svg viewBox="0 0 240 148" className="w-full h-full">
      <rect width="240" height="148" fill={FLOOR} />
      {[60,120,180].map(x => <line key={x} x1={x} y1={0} x2={x} y2={148} stroke={GRID} strokeWidth="1"/>)}
      {[49,99].map(y => <line key={y} x1={0} y1={y} x2={240} y2={y} stroke={GRID} strokeWidth="1"/>)}
      <rect x="2" y="2" width="236" height="144" fill="none" stroke={WALL} strokeWidth="3" rx="2"/>
      {/* door */}
      <line x1="155" y1="146" x2="200" y2="146" stroke={FLOOR} strokeWidth="3"/>
      <path d="M 200 146 A 45 45 0 0 0 155 146" fill="none" stroke={WALL} strokeWidth="1.2" strokeDasharray="3 2"/>
      {/* window */}
      <line x1="70" y1="2" x2="130" y2="2" stroke={WINDOW} strokeWidth="3"/>
      <line x1="70" y1="5" x2="130" y2="5" stroke={WALL} strokeWidth="1"/>
      {/* table */}
      <rect x="70" y="44" width="100" height="60" rx="5" fill={TABLE_FILL} stroke={TABLE} strokeWidth="1.8"/>
      {/* top 2 chairs */}
      {[90, 150].map(x => <rect key={`t${x}`} x={x-15} y={28} width={28} height={13} rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1.2"/>)}
      {/* bottom 2 chairs */}
      {[90, 150].map(x => <rect key={`b${x}`} x={x-15} y={107} width={28} height={13} rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1.2"/>)}
      {/* left chair */}
      <rect x={50} y={66} width={16} height={16} rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1.2"/>
      {/* right chair */}
      <rect x={174} y={66} width={16} height={16} rx="3" fill={CHAIR_FILL} stroke={CHAIR} strokeWidth="1.2"/>
    </svg>
  )
}

interface Props {
  name: string
  capacity?: number
}

export default function RoomFloorPlan({ name }: Props) {
  const layout = detectLayout(name)
  return (
    <div className="w-full h-full">
      {layout === "boardroom"  && <Boardroom />}
      {layout === "meeting"    && <MeetingRoom />}
      {layout === "office"     && <PrivateOffice />}
      {layout === "training"   && <TrainingRoom />}
      {layout === "lounge"     && <Lounge />}
      {layout === "default"    && <DefaultRoom />}
    </div>
  )
}
