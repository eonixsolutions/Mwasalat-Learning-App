import { useState } from 'react';
import ProgramCard from './ProgramCard';

const PROGRAMS = [
  {
    id: 'zero2code',
    name: 'ZERO2CODE',
    image: '/laptop-swing-no-bg.png',
    imageClass: 'w-52 h-[220px] -ml-4',
    titleClass: 'mb-4',
    accentColor: '#E8557A',
    detailsTo: '/programs/zero2code',
    features: [
      'Beginner-friendly · 1 month program',
      'Core programming fundamentals from scratch',
      'Object-Oriented Programming concepts',
      'For anyone stepping into the coding field',
    ],
  },
  {
    id: 'code2career',
    name: 'CODE2CAREER',
    image: '/suitcase-swing-no-bg.png',
    imageClass: 'w-36 h-[190px]',
    accentColor: '#7C5CE8',
    detailsTo: '/programs/code2career',
    features: [
      'Full-stack web development course',
      'Requires Zero2Code or prior coding knowledge',
      'Frontend: React, Tailwind CSS',
      'Backend: Node.js, Express, MongoDB',
      'Dedicated mentor support throughout',
      'Build and deploy real-world projects',
    ],
  },
  {
    id: 'aira-learn',
    name: 'AI LAUNCHPAD',
    image: '/robot-swing-no-bg.png',
    imageClass: 'w-52 h-[220px] -ml-4',
    titleClass: 'mb-4',
    accentColor: '#0DB8A8',
    detailsTo: '/programs/ai-launchpad',
    features: [
      'Designed for school students · 2 weeks',
      'Hands-on practice with real AI tools',
      'NotebookLM, Turbo AI, Canva AI & more',
      'Learn how AI can power your studies',
    ],
  },
];

const SHAPES = [
  { shape: 'triangle-left',  color: '#F06090', top: '8%',  left: '4%'  },
  { shape: 'triangle-right', color: '#22C55E', top: '8%',  left: '18%' },
  { shape: 'circle',         color: '#7C5CE8', top: '14%', left: '12%' },
  { shape: 'square',         color: '#F06090', top: '20%', left: '6%'  },
  { shape: 'diamond',        color: '#7C5CE8', top: '6%',  left: '42%' },
  { shape: 'triangle-right', color: '#22C55E', top: '5%',  left: '52%' },
  { shape: 'diamond',        color: '#1E293B', top: '7%',  left: '62%' },
  { shape: 'diamond',        color: '#0DB8A8', top: '5%',  left: '74%' },
  { shape: 'triangle-left',  color: '#F06090', top: '9%',  left: '88%' },
  { shape: 'diamond',        color: '#1E293B', top: '7%',  left: '96%' },
  { shape: 'circle',         color: '#0DB8A8', top: '30%', left: '92%' },
  { shape: 'circle',         color: '#F06090', top: '40%', left: '3%'  },
  { shape: 'circle',         color: '#7C5CE8', top: '22%', left: '97%' },
  { shape: 'circle',         color: '#F06090', top: '48%', left: '96%' },
];

function Shape({ shape, color, top, left }) {
  const style = { position: 'absolute', top, left };
  if (shape === 'circle')         return <div style={{ ...style, width: 10, height: 10, borderRadius: '50%', background: color }} />;
  if (shape === 'square')         return <div style={{ ...style, width: 10, height: 10, background: color }} />;
  if (shape === 'diamond')        return <div style={{ ...style, width: 10, height: 10, background: color, transform: 'rotate(45deg)' }} />;
  if (shape === 'triangle-right') return <div style={{ ...style, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: `10px solid ${color}` }} />;
  if (shape === 'triangle-left')  return <div style={{ ...style, width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: `10px solid ${color}` }} />;
  return null;
}

function ProgramsStack() {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  return (
    <div className="flex items-stretch justify-center gap-0">
      {PROGRAMS.map((prog, i) => {
        const isMiddle = i === 1;
        const isHovered = hoveredIdx === i;
        return (
          <div
            key={prog.id}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="w-[360px] h-[520px] flex-shrink-0 cursor-pointer"
            style={{
              position: 'relative',
              transition: 'transform 0.3s ease',
              transform: `scale(${isHovered ? 1.17 : (hoveredIdx === null && isMiddle) ? 1.15 : 1})`,
              zIndex: isHovered ? 30 : isMiddle ? 20 : 10,
              marginLeft: i !== 0 ? '9px' : '0',
            }}
          >
            <ProgramCard {...prog} />
          </div>
        );
      })}
    </div>
  );
}

export default function ProgramsSection() {
  return (
    <section id="programs" className="relative bg-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">

      {SHAPES.map((s, i) => <Shape key={i} {...s} />)}

      <div className="max-w-6xl mx-auto relative z-10">

        <div className="text-center mb-14">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1E293B] mb-4">
            Structured Programs for Every Stage.
          </h2>
          <p className="text-[#475569] text-base max-w-lg mx-auto">
            Choose the right path and learn at your pace with our expert-designed programs.
          </p>
        </div>

        <div className="md:hidden grid grid-cols-1 gap-6 px-12 sm:px-20">
          {PROGRAMS.map((prog) => (
            <ProgramCard key={prog.id} {...prog} />
          ))}
        </div>

        <div className="hidden md:flex justify-center">
          <ProgramsStack />
        </div>

      </div>
    </section>
  );
}
