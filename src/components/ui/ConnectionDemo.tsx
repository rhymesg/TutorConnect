"use client";

import { useRef } from "react";
import { AnimatedBeam } from "./AnimatedBeam";
import { User, GraduationCap, MessageCircle } from "lucide-react";

export default function ConnectionDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tutorRef = useRef<HTMLDivElement>(null);
  const studentRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative mx-auto max-w-2xl">
      <div 
        ref={containerRef} 
        className="relative flex h-80 w-full items-center justify-between px-8"
      >
        {/* Tutor */}
        <div 
          ref={tutorRef}
          className="flex flex-col items-center space-y-2 text-center"
        >
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 border-4 border-white shadow-lg">
              <GraduationCap className="h-8 w-8 text-brand-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-neutral-900">Kvalifisert lærer</p>
            <p className="text-xs text-neutral-600">Matematikk • Fysikk</p>
            <div className="flex items-center justify-center space-x-1 text-xs text-yellow-600">
              <span>⭐</span>
              <span className="font-medium">4.9</span>
            </div>
          </div>
        </div>

        {/* Chat/Connection Icon */}
        <div 
          ref={chatRef}
          className="flex flex-col items-center space-y-2"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-success-100 to-success-200 border-2 border-white shadow-md">
            <MessageCircle className="h-5 w-5 text-success-600" />
          </div>
          <p className="text-xs font-medium text-success-700">Sanntid chat</p>
        </div>

        {/* Student */}
        <div 
          ref={studentRef}
          className="flex flex-col items-center space-y-2 text-center"
        >
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-neutral-900">Motivert student</p>
            <p className="text-xs text-neutral-600">Videregående • Oslo</p>
            <p className="text-xs text-brand-600 font-medium">Søker hjelp</p>
          </div>
        </div>

        {/* Animated Beams */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={tutorRef}
          toRef={chatRef}
          curvature={30}
          duration={5}
          delay={0}
          gradientStartColor="#0ea5e9"
          gradientStopColor="#22c55e"
          pathColor="rgb(156 163 175)"
          pathOpacity={0.15}
        />
        
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={chatRef}
          toRef={studentRef}
          curvature={30}
          duration={5}
          delay={2.5}
          gradientStartColor="#22c55e"
          gradientStopColor="#3b82f6"
          pathColor="rgb(156 163 175)"
          pathOpacity={0.15}
        />

        {/* Reverse beams for bi-directional communication */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={studentRef}
          toRef={chatRef}
          curvature={-30}
          duration={5}
          delay={1.25}
          reverse={true}
          gradientStartColor="#3b82f6"
          gradientStopColor="#22c55e"
          pathColor="rgb(156 163 175)"
          pathOpacity={0.1}
        />
        
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={chatRef}
          toRef={tutorRef}
          curvature={-30}
          duration={5}
          delay={3.75}
          reverse={true}
          gradientStartColor="#22c55e"
          gradientStopColor="#0ea5e9"
          pathColor="rgb(156 163 175)"
          pathOpacity={0.1}
        />
      </div>
    </div>
  );
}