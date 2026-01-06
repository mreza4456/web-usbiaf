import { useEffect, useRef } from "react";

export default function GooglyEyes() {
  const leftEye = useRef(null);
  const rightEye = useRef(null);

  useEffect(() => {
    const moveEyes = (e) => {
      document.querySelectorAll('.pupil').forEach((pupil) => {
        const rect = pupil.parentElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const angle = Math.atan2(dy, dx);
        const radius = 12;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        pupil.style.transform = `translate(${x}px, ${y}px)`;
      });
    };
    window.addEventListener('mousemove', moveEyes);
    return () => window.removeEventListener('mousemove', moveEyes);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex gap-10">
        {[leftEye, rightEye].map((ref, i) => (
          <div
            key={i}
            ref={ref}
            className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl"
          >
            <img className="pupil w-20 h-20  rounded-full transition-transform" src="eyes.png" alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}
